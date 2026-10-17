import { Test, TestingModule } from '@nestjs/testing'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UsersController } from './users.controller.js'
import { UsersService } from './users.service.js'
import { AuthGuard } from '../../auth/auth.guard.js'
import { JwtService } from '@nestjs/jwt'
import type { CreateUserDto } from './dto/create-user.dto/create-user.dto.js'
import type { AuthenticatedRequest } from '../../auth/types/authenticated-request.js'

describe('UsersController', () => {
  let controller: UsersController
  let usersService: UsersService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getUsers: vi.fn(),
            createUser: vi.fn(),
            updateUser: vi.fn(),
            softDeleteUser: vi.fn(),
          },
        },
        {
          provide: AuthGuard,
          useValue: { canActivate: vi.fn(() => true) },
        },
        {
          provide: JwtService,
          useValue: {
            verify: vi.fn(),
            verifyAsync: vi.fn(),
            sign: vi.fn(),
            signAsync: vi.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<UsersController>(UsersController)
    usersService = module.get<UsersService>(UsersService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should return users', async () => {
    const users = [{ id: 1, login: 'vlad' }]
    vi.mocked(usersService.getUsers).mockResolvedValue(users as never)

    await expect(controller.getUsers(1, 10, 'vlad')).resolves.toEqual(users)
    expect(usersService.getUsers).toHaveBeenCalledWith(1, 10, 'vlad')
  })

  it('should create a user', async () => {
    const user = {
      login: 'vlad',
      email: 'vlad@example.com',
      age: 25,
      description: 'Test user',
      password: 'password123',
    } as CreateUserDto
    const createdUser = { id: 1, ...user }

    vi.mocked(usersService.createUser).mockResolvedValue(createdUser as never)

    await expect(controller.createUser(user)).resolves.toEqual(createdUser)
    expect(usersService.createUser).toHaveBeenCalledWith(user)
  })

  it('should update a user using the authenticated user id', async () => {
    const user = { login: 'vlad-new' }
    const request = { user: { sub: 2 } } as AuthenticatedRequest
    const updatedUser = { id: 1, login: 'vlad-new' }

    vi.mocked(usersService.updateUser).mockResolvedValue(updatedUser as never)

    await expect(
      controller.updateUser(1, user as never, request),
    ).resolves.toEqual(updatedUser)
    expect(usersService.updateUser).toHaveBeenCalledWith(1, user, 2)
  })

  it('should soft-delete a user using the authenticated user id', async () => {
    const request = { user: { sub: 2 } } as AuthenticatedRequest
    const response = { message: 'User deleted successfully' }

    vi.mocked(usersService.softDeleteUser).mockResolvedValue(response as never)

    await expect(controller.softDeleteUser(2, request)).resolves.toEqual(
      response,
    )
    expect(usersService.softDeleteUser).toHaveBeenCalledWith(2, 2)
  })
})
