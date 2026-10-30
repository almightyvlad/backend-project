import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { UsersRepository } from '../features/users/users.repository.js'
import { RefreshTokensService } from '../features/refresh-tokens/refresh-tokens.service.js'
import { TokensService } from './tokens.service.js'
import { comparePassword } from './helpers/password.helper.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./helpers/password.helper.js', () => ({
  comparePassword: vi.fn(),
}))

describe('AuthService', () => {
  let service: AuthService
  let module: TestingModule
  let repository: UsersRepository
  let tokensService: TokensService
  let refreshTokensService: RefreshTokensService

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
          provide: TokensService,
          useValue: {
            issueTokens: vi.fn(),
            updateRefreshToken: vi.fn(),
          },
        },
        {
          provide: RefreshTokensService,
          useValue: {
            deleteRefreshToken: vi.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    repository = module.get<UsersRepository>(UsersRepository)
    tokensService = module.get<TokensService>(TokensService)
    refreshTokensService =
      module.get<RefreshTokensService>(RefreshTokensService)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
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
    vi.mocked(comparePassword).mockResolvedValue(false)

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
    vi.mocked(comparePassword).mockResolvedValue(true)

    vi.mocked(repository.findByLogin).mockResolvedValue({
      id: 1,
      login: 'vlad',
      password: 'hashed-password',
    } as never)

    const tokens = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    }

    vi.mocked(tokensService.issueTokens).mockResolvedValue(tokens as never)

    await expect(
      service.login({
        login: 'vlad',
        password: 'correct-password',
      }),
    ).resolves.toEqual(tokens)

    expect(tokensService.issueTokens).toHaveBeenCalledWith(1)
  })

  it('should logout successfully', async () => {
    vi.mocked(
      refreshTokensService.deleteRefreshToken,
    ).mockResolvedValue([] as never)

    await expect(
      service.logout('test-refresh-token'),
    ).resolves.toBeUndefined()

    expect(
      refreshTokensService.deleteRefreshToken,
    ).toHaveBeenCalledWith('test-refresh-token')
  })

  it('should update refresh token successfully', async () => {
    const tokens = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    }

    vi.mocked(tokensService.updateRefreshToken).mockResolvedValue(
      tokens as never,
    )

    await expect(
      tokensService.updateRefreshToken('old-refresh-token'),
    ).resolves.toEqual(tokens)

    expect(tokensService.updateRefreshToken).toHaveBeenCalledWith(
      'old-refresh-token',
    )
  })
})