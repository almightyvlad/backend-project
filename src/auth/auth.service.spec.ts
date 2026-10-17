import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { UsersRepository } from '../features/users/users.repository.js'
import { JwtService } from '@nestjs/jwt'
import { RefreshTokensService } from '../features/refresh-tokens/refresh-tokens.service.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcrypt'

describe('AuthService', () => {
  let service: AuthService
  let module: TestingModule
  let repository: UsersRepository

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: {
            findByLogin: vi.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: vi.fn(),
          },
        },
        {
          provide: RefreshTokensService,
          useValue: {
            createRefreshToken: vi.fn(),
            deleteRefreshToken: vi.fn(),
            rotateRefreshToken: vi.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    repository = module.get<UsersRepository>(UsersRepository)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should throw UnauthorizedException when user is not found', async () => {
    vi.mocked(repository.findByLogin).mockResolvedValue(null as never)

    await expect(
      service.login({
        login: 'unknown',
        password: 'password123',
      }),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('should throw UnauthorizedException for invalid password', async () => {
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)
    vi.mocked(repository.findByLogin).mockResolvedValue({
      id: 1,
      login: 'vlad',
      password: 'hashed-password',
    } as never)

    await expect(
      service.login({
        login: 'vlad',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException)
  })

  it('should login successfully', async () => {
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
    vi.mocked(repository.findByLogin).mockResolvedValue({
      id: 1,
      login: 'vlad',
      password: 'hashed-password',
    } as never)

    const jwtService = module.get<JwtService>(JwtService)
    const refreshTokensService =
      module.get<RefreshTokensService>(RefreshTokensService)

    vi.mocked(jwtService.signAsync).mockResolvedValue('access-token')
    vi.mocked(refreshTokensService.createRefreshToken).mockResolvedValue({
      hex: 'refresh-token',
    } as never)

    await expect(
      service.login({
        login: 'vlad',
        password: 'correct-password',
      }),
    ).resolves.toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    })
  })

  it('should logout successfully', async () => {
    const refreshTokensService =
      module.get<RefreshTokensService>(RefreshTokensService)

    vi.mocked(refreshTokensService.deleteRefreshToken).mockResolvedValue(
      [] as never,
    )

    await expect(service.logout('test-refresh-token')).resolves.toEqual({
      message: 'Logged out successfully',
    })

    expect(refreshTokensService.deleteRefreshToken).toHaveBeenCalledWith(
      'test-refresh-token',
    )
  })

  it('should update refresh token successfully', async () => {
    const jwtService = module.get<JwtService>(JwtService)
    const refreshTokensService =
      module.get<RefreshTokensService>(RefreshTokensService)

    vi.mocked(refreshTokensService.rotateRefreshToken).mockResolvedValue({
      userId: 1,
      hex: 'new-refresh-token',
    } as never)
    vi.mocked(jwtService.signAsync).mockResolvedValue('new-access-token')

    await expect(
      service.updateRefreshToken('old-refresh-token'),
    ).resolves.toEqual({
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    })

    expect(refreshTokensService.rotateRefreshToken).toHaveBeenCalledWith(
      'old-refresh-token',
    )
    expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 1 })
  })
})
