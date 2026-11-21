
import { io } from 'socket.io-client'

const USER_SERVICE_URL = 'http://localhost:3000'
const NOTIFICATION_SERVICE_URL = 'http://localhost:3001'



const users = {
    sender: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMwNiwiaWF0IjoxNzk1MjU4NzE3LCJleHAiOjE3OTUyNTk2MTd9.VqjmfPV-IqCW5yPyhUPo6S1jrfgyc-ypNmot_VN_-G0',
        received: [],
    },
    recipient: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMwOSwiaWF0IjoxNzk1MjU4NzU3LCJleHAiOjE3OTUyNTk2NTd9.RlxUc1tescMp2PS9chhm1LtdBVzAeHr64OJSawlgNRc',
        received: [],
    },
    stranger: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMyMiwiaWF0IjoxNzk1MjU4Nzk5LCJleHAiOjE3OTUyNTk2OTl9.EdJatfJwtO03NfbteTneQlKKxZRDC2xVj_UrYkLZDbA',
        received: [],
    },
}

const clients = Object.entries(users).map(([name, user]) => {
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

try {
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
            recipientId: 309,
            amount: '10.00',
        }),
    })

    const responseBody = await response.text()

    console.log('HTTP STATUS:', response.status)
    console.log('HTTP BODY:', responseBody)

    if (!response.ok) {
        throw new Error(`Transfer failed: HTTP ${response.status}`)
    }

    await sleep(2000)

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
    clients.forEach((socket) => socket.disconnect())
}
