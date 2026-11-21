import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcrypt'
import { UsersService } from './users.service.js'
import { UsersRepository } from './users.repository.js'
import { BCRYPT_SALT_ROUNDS } from '../../auth/auth.constants.js'
import { TokensService } from '../../auth/tokens.service.js'
import { ClsService } from 'nestjs-cls'
import { PinoLogger } from 'nestjs-pino'
import { RedisService } from '../../redis/redis.service.js'
import { KafkaService } from '../../kafka/kafka.service.js'

describe('UsersService', () => {
  let service: UsersService
  let repository: UsersRepository
  let tokensService: TokensService
  let kafkaService: KafkaService
  const logger = {
    setContext: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }

  beforeEach(async () => {
    logger.error.mockReset()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            getUsers: vi.fn(),
            createUser: vi.fn(),
            findByLogin: vi.fn(),
            findById: vi.fn(),
            updateUser: vi.fn(),
            softDeleteUser: vi.fn(),
            transfer: vi.fn(),
          },
        },
        {
          provide: TokensService,
          useValue: {
            issueTokens: vi.fn(),
          },
        },
        {
          provide: ClsService,
          useValue: {
            get: vi.fn(),
            set: vi.fn(),
          },
        },
        {
          provide: PinoLogger,
          useValue: logger,
        },
        {
          provide: KafkaService,
          useValue: {
            publishTransfer: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: vi.fn().mockResolvedValue(null),
            getJson: vi.fn().mockResolvedValue(null),
            set: vi.fn().mockResolvedValue('OK'),
            setJson: vi.fn().mockResolvedValue('OK'),
            del: vi.fn().mockResolvedValue(1),
            delPattern: vi.fn().mockResolvedValue(0),
          },
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    repository = module.get<UsersRepository>(UsersRepository)
    tokensService = module.get<TokensService>(TokensService)
    kafkaService = module.get<KafkaService>(KafkaService)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return users without a login filter', async () => {
    const users = [{ id: 1, login: 'vlad' }]

    vi.mocked(repository.getUsers).mockResolvedValue(users as never)

    await expect(service.getUsers(1, 10)).resolves.toEqual(users)

    expect(repository.getUsers).toHaveBeenCalledWith(1, 10, undefined)
  })

  it('should search users by login', async () => {
    const users = [{ id: 1, login: 'vlad' }]

    vi.mocked(repository.getUsers).mockResolvedValue(users as never)

    await expect(service.getUsers(1, 10, 'vlad')).resolves.toEqual(users)

    expect(repository.getUsers).toHaveBeenCalledWith(1, 10, 'vlad')
  })

  it('should create a user with a hashed password', async () => {
    const user = {
      login: 'vlad',
      email: 'vlad@example.com',
      password: 'password123',
      age: 25,
      description: 'Test user',
    }

    const tokens = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    }

    vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never)

    vi.mocked(repository.createUser).mockResolvedValue({
      id: 1,
      ...user,
      password: 'hashed-password',
    } as never)

    vi.mocked(tokensService.issueTokens).mockResolvedValue(tokens as never)

    await expect(service.createUser(user)).resolves.toEqual(tokens)

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', BCRYPT_SALT_ROUNDS)

    expect(repository.createUser).toHaveBeenCalledWith({
      ...user,
      password: 'hashed-password',
    })

    expect(tokensService.issueTokens).toHaveBeenCalledWith(1)
  })

  it('should throw UnauthorizedException when the user is not found by login', async () => {
    vi.mocked(repository.findByLogin).mockResolvedValue(null as never)

    await expect(service.findByLogin('unknown')).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('publishes a transfer event after a successful transfer', async () => {
    const transfer = { recipientId: 2, amount: '10.00' }
    const result = { senderId: 1, recipientId: 2 }

    vi.mocked(repository.transfer).mockResolvedValue(result as never)

    await expect(service.transfer(transfer, 1)).resolves.toEqual(result)

    expect(repository.transfer).toHaveBeenCalledWith(transfer, 1)
    expect(kafkaService.publishTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        fromUserId: '1',
        toUserId: '2',
        amount: '10.00',
      }),
    )
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: expect.any(String),
        senderId: 1,
        recipientId: 2,
        amount: '10.00',
      }),
      'Balance transfer completed',
    )
  })

  it('logs a kafka failure without failing the transfer', async () => {
    const transfer = { recipientId: 2, amount: '10.00' }

    vi.mocked(repository.transfer).mockResolvedValue({ ok: true } as never)
    vi.mocked(kafkaService.publishTransfer).mockReturnValue({
      subscribe: ({ error }: { error: (reason: unknown) => void }) => {
        error(new Error('broker down'))
      },
    } as never)

    await expect(service.transfer(transfer, 1)).resolves.toEqual({ ok: true })

    expect(logger.error).toHaveBeenCalled()
  })
})
