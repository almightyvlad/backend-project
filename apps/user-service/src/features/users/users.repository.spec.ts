import { Test, TestingModule } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import { randomUUID } from 'node:crypto'
import { Kysely } from 'kysely'
import { UsersRepository } from './users.repository.js'
import { Database } from '../../databases/database.types.js'
import { TransferDto } from './dto/transfer.dto.js'
import { DatabasesModule } from '../../databases/databases.module.js'
import { DATABASE_CONNECTION } from '../../databases/databases.contants.js'
import { databaseConfig } from '../../configs/database.config.js'

describe('UsersRepository', () => {
  let module: TestingModule
  let repository: UsersRepository
  let db: Kysely<Database>

  let senderId: number
  let recipientId: number
  let testUserIds: number[] = []

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [databaseConfig],
        }),
        DatabasesModule,
      ],
      providers: [UsersRepository],
    }).compile()

    repository = module.get<UsersRepository>(UsersRepository)
    db = module.get<Kysely<Database>>(DATABASE_CONNECTION)
  })

  beforeEach(async () => {
    testUserIds = []

    const uniqueId = randomUUID()

    const sender = await db
      .insertInto('users')
      .values({
        login: `test_sender_${uniqueId}`,
        password: 'password',
        email: `sender_${uniqueId}@test.com`,
        age: 25,
        description: 'Test sender',
        balance: '100.00',
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    senderId = sender.id
    testUserIds.push(senderId)

    const recipient = await db
      .insertInto('users')
      .values({
        login: `test_recipient_${uniqueId}`,
        password: 'password',
        email: `recipient_${uniqueId}@test.com`,
        age: 25,
        description: 'Test recipient',
        balance: '0.00',
      })
      .returning('id')
      .executeTakeFirstOrThrow()

    recipientId = recipient.id
    testUserIds.push(recipientId)
  })

  afterEach(async () => {
    if (testUserIds.length === 0) {
      return
    }

    await db
      .deleteFrom('refresh_tokens')
      .where('user_id', 'in', testUserIds)
      .execute()

    await db.deleteFrom('avatars').where('user_id', 'in', testUserIds).execute()

    await db.deleteFrom('users').where('id', 'in', testUserIds).execute()

    testUserIds = []
  })

  afterAll(async () => {
    await module.close()
  })

  it('should transfer money between users', async () => {
    const transfer: TransferDto = {
      recipientId,
      amount: '50.00',
    }

    await repository.transfer(transfer, senderId)

    const users = await db
      .selectFrom('users')
      .select(['id', 'balance'])
      .where('id', 'in', [senderId, recipientId])
      .execute()

    expect(users.find((user) => user.id === senderId)?.balance).toBe('50.00')
    expect(users.find((user) => user.id === recipientId)?.balance).toBe('50.00')
  })

  it('should throw BadRequestException when transferring money to yourself', async () => {
    const transfer: TransferDto = {
      recipientId: senderId,
      amount: '10.00',
    }

    await expect(repository.transfer(transfer, senderId)).rejects.toThrow(
      BadRequestException,
    )
  })

  it('should throw BadRequestException when sender has insufficient funds', async () => {
    const transfer: TransferDto = {
      recipientId,
      amount: '150.00',
    }

    await expect(repository.transfer(transfer, senderId)).rejects.toThrow(
      BadRequestException,
    )

    const sender = await db
      .selectFrom('users')
      .select('balance')
      .where('id', '=', senderId)
      .executeTakeFirstOrThrow()

    expect(sender.balance).toBe('100.00')
  })

  it('should throw NotFoundException when recipient does not exist', async () => {
    const transfer: TransferDto = {
      recipientId: -1,
      amount: '10.00',
    }

    await expect(repository.transfer(transfer, senderId)).rejects.toThrow(
      NotFoundException,
    )
  })

  it('should throw NotFoundException when recipient is deleted', async () => {
    await db
      .updateTable('users')
      .set({ deleted_at: new Date() })
      .where('id', '=', recipientId)
      .execute()

    const transfer: TransferDto = {
      recipientId,
      amount: '10.00',
    }

    await expect(repository.transfer(transfer, senderId)).rejects.toThrow(
      NotFoundException,
    )
  })

  it('should not allow concurrent transfers to make balance negative', async () => {
    const transfer: TransferDto = {
      recipientId,
      amount: '100.00',
    }

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => repository.transfer(transfer, senderId)),
    )

    const successfulTransfers = results.filter(
      (result) => result.status === 'fulfilled',
    )

    const failedTransfers = results.filter(
      (result) => result.status === 'rejected',
    )

    expect(successfulTransfers).toHaveLength(1)
    expect(failedTransfers).toHaveLength(9)

    for (const result of failedTransfers) {
      expect(result.status).toBe('rejected')

      if (result.status === 'rejected') {
        expect(result.reason).toBeInstanceOf(BadRequestException)
      }
    }

    const users = await db
      .selectFrom('users')
      .select(['id', 'balance'])
      .where('id', 'in', [senderId, recipientId])
      .execute()

    expect(users.find((user) => user.id === senderId)?.balance).toBe('0.00')
    expect(users.find((user) => user.id === recipientId)?.balance).toBe(
      '100.00',
    )
  })
})
