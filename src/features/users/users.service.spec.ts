import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcrypt'
import { UsersService } from './users.service.js'
import { UsersRepository } from './users.repository.js'
import { BCRYPT_SALT_ROUNDS } from '../../auth/auth.constants.js'
import { TokensService } from '../../auth/tokens.service.js'

describe('UsersService', () => {
  let service: UsersService
  let repository: UsersRepository
  let tokensService: TokensService

  beforeEach(async () => {
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
          },
        },
        {
          provide: TokensService,
          useValue: {
            issueTokens: vi.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    repository = module.get<UsersRepository>(UsersRepository)
    tokensService = module.get<TokensService>(TokensService)
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

    expect(bcrypt.hash).toHaveBeenCalledWith(
      'password123',
      BCRYPT_SALT_ROUNDS,
    )

    expect(repository.createUser).toHaveBeenCalledWith({
      ...user,
      password: 'hashed-password',
    })

    expect(tokensService.issueTokens).toHaveBeenCalledWith(1)
  })

  it('should throw UnauthorizedException when the user is not found by login', async () => {
    vi.mocked(repository.findByLogin).mockResolvedValue(null as never)

    await expect(
      service.findByLogin('unknown'),
    ).rejects.toThrow(UnauthorizedException)
  })
})