import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException, ForbiddenException } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcrypt'
import { UsersService } from './users.service.js'
import { UsersRepository } from './users.repository.js'

describe('UsersService', () => {
  let service: UsersService
  let repository: UsersRepository

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: {
            searchByLogin: vi.fn(),
            getUsers: vi.fn(),
            createUser: vi.fn(),
            findByLogin: vi.fn(),
            findById: vi.fn(),
            updateUser: vi.fn(),
            softDeleteUser: vi.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    repository = module.get<UsersRepository>(UsersRepository)
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
    expect(repository.getUsers).toHaveBeenCalledWith(1, 10)
  })

  it('should search users by login', async () => {
    const users = [{ id: 1, login: 'vlad' }]
    vi.mocked(repository.searchByLogin).mockResolvedValue(users as never)

    await expect(service.getUsers(1, 10, 'vlad')).resolves.toEqual(users)
    expect(repository.searchByLogin).toHaveBeenCalledWith('vlad', 1, 10)
  })

  it('should create a user with a hashed password', async () => {
    const user = {
      login: 'vlad',
      email: 'vlad@example.com',
      password: 'password123',
      age: 25,
      description: 'Test user',
    }

    vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never)
    vi.mocked(repository.createUser).mockResolvedValue({
      id: 1,
      ...user,
      password: 'hashed-password',
    } as never)

    await service.createUser(user)

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10)
    expect(repository.createUser).toHaveBeenCalledWith({
      ...user,
      password: 'hashed-password',
    })
  })

  it('should throw UnauthorizedException when the user is not found by login', async () => {
    vi.mocked(repository.findByLogin).mockResolvedValue(null as never)

    await expect(service.findByLogin('unknown')).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('should forbid updating another user', async () => {
    vi.mocked(repository.findById).mockResolvedValue({
      id: 2,
      login: 'other',
    } as never)

    await expect(
      service.updateUser(2, { login: 'new-login' }, 1),
    ).rejects.toThrow(ForbiddenException)

    expect(repository.updateUser).not.toHaveBeenCalled()
  })
})
