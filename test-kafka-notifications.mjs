import { randomUUID } from 'node:crypto'
import { loadEnvFile } from 'node:process'
import { Client } from 'pg'
import { io } from 'socket.io-client'

// Checks that a transfer notifies the sender and the recipient, and not a third user.
//
// By default the script registers three users through POST /users, sets the sender
// balance to 100.00 in Postgres, then transfers 10.00. New users start at 0, so a
// transfer without that update returns 400. user-service also resets every balance
// once a minute, so the balance is written immediately before the transfer.
//
// To use existing users instead, set all of:
// SENDER_TOKEN, RECIPIENT_TOKEN, STRANGER_TOKEN, RECIPIENT_ID
// The sender account must already have a balance of at least 10.00.

try {
  loadEnvFile()
} catch {
  // .env is optional when the variables are already in the environment.
}

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:3000'
const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3001'
const TRANSFER_AMOUNT = '10.00'
const SENDER_BALANCE = '100.00'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function userIdFromAccessToken(token) {
  const payloadPart = token.split('.')[1]

  if (payloadPart === undefined) {
    throw new Error('Access token is not a JWT')
  }

  const payload = JSON.parse(
    Buffer.from(payloadPart, 'base64url').toString('utf8'),
  )

  if (!isPositiveInteger(payload?.sub)) {
    throw new Error('Access token sub is not a positive integer')
  }

  return payload.sub
}

function isPositiveInteger(value) {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

async function registerUser(role) {
  const login = `ntf_${role}_${randomUUID().slice(0, 8)}`
  const response = await fetch(`${USER_SERVICE_URL}/users`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      login,
      email: `${login}@example.com`,
      password: 'password1',
      age: 25,
      description: 'Notification delivery check',
    }),
  })
  const body = await response.text()

  if (!response.ok) {
    throw new Error(`Registration failed for ${role}: HTTP ${response.status} ${body}`)
  }

  const parsed = JSON.parse(body)

  if (typeof parsed.access_token !== 'string') {
    throw new Error(`Registration for ${role} did not return an access token`)
  }

  return {
    id: userIdFromAccessToken(parsed.access_token),
    token: parsed.access_token,
    received: [],
  }
}

async function fundSender(senderId) {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  })

  await client.connect()

  try {
    await client.query('UPDATE users SET balance = $1 WHERE id = $2', [
      SENDER_BALANCE,
      senderId,
    ])
  } finally {
    await client.end()
  }
}

function usersFromEnv() {
  const senderToken = process.env.SENDER_TOKEN
  const recipientToken = process.env.RECIPIENT_TOKEN
  const strangerToken = process.env.STRANGER_TOKEN
  const recipientId = Number(process.env.RECIPIENT_ID)
  const tokens = [senderToken, recipientToken, strangerToken]

  if (tokens.every((token) => token === undefined || token.length === 0)) {
    return undefined
  }

  if (tokens.some((token) => token === undefined || token.length === 0)) {
    throw new Error(
      'Set SENDER_TOKEN, RECIPIENT_TOKEN, STRANGER_TOKEN and RECIPIENT_ID together',
    )
  }

  if (!isPositiveInteger(recipientId)) {
    throw new Error('RECIPIENT_ID must be a positive integer')
  }

  return {
    sender: {
      id: userIdFromAccessToken(senderToken),
      token: senderToken,
      received: [],
    },
    recipient: { id: recipientId, token: recipientToken, received: [] },
    stranger: {
      id: userIdFromAccessToken(strangerToken),
      token: strangerToken,
      received: [],
    },
  }
}

async function createUsers() {
  const existing = usersFromEnv()

  if (existing !== undefined) {
    console.log('Using tokens from the environment')
    return existing
  }

  const sender = await registerUser('sender')
  const recipient = await registerUser('recipient')
  const stranger = await registerUser('stranger')

  await fundSender(sender.id)
  console.log(
    `Registered users sender=${sender.id} recipient=${recipient.id} stranger=${stranger.id}`,
  )
  console.log(`Set sender ${sender.id} balance to ${SENDER_BALANCE}`)

  return { sender, recipient, stranger }
}

function connectClients(users) {
  return Object.entries(users).map(([name, user]) => {
    const socket = io(NOTIFICATION_SERVICE_URL, {
      auth: { token: user.token },
      reconnection: false,
    })

    socket.on('connect', () => {
      console.log(`${name}: connected`)
    })

    socket.on('connect_error', (error) => {
      console.error(`${name}: connection error:`, error.message)
    })

    socket.on('notification', (data) => {
      user.received.push(data)
      console.log(`${name}: notification received`, data)
    })

    return socket
  })
}

async function waitForNotifications(users) {
  const deadline = Date.now() + 8000

  while (Date.now() < deadline) {
    if (
      users.sender.received.length >= 1 &&
      users.recipient.received.length >= 1
    ) {
      return
    }

    await sleep(100)
  }
}

let clients = []

try {
  const users = await createUsers()
  clients = connectClients(users)

  await Promise.all(
    clients.map(
      (socket) =>
        new Promise((resolve, reject) => {
          socket.once('connect', resolve)
          socket.once('connect_error', reject)
        }),
    ),
  )

  console.log('\nAll clients connected\n')

  const response = await fetch(`${USER_SERVICE_URL}/users/transfer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${users.sender.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipientId: users.recipient.id,
      amount: TRANSFER_AMOUNT,
    }),
  })
  const responseBody = await response.text()

  console.log('HTTP STATUS:', response.status)
  console.log('HTTP BODY:', responseBody)

  if (!response.ok) {
    throw new Error(`Transfer failed: HTTP ${response.status}`)
  }

  await waitForNotifications(users)

  console.log('\n========== RESULTS ==========')
  console.log('Sender received:', users.sender.received.length)
  console.log('Recipient received:', users.recipient.received.length)
  console.log('Stranger received:', users.stranger.received.length)

  const success =
    users.sender.received.length === 1 &&
    users.recipient.received.length === 1 &&
    users.stranger.received.length === 0

  if (success) {
    console.log('\nSUCCESS: notification delivery works')
  } else {
    console.log('\nFAIL: unexpected notification delivery')
    process.exitCode = 1
  }
} catch (error) {
  console.error('\nTest failed:', error)
  process.exitCode = 1
} finally {
  for (const socket of clients) {
    socket.disconnect()
  }
}
