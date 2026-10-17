import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { UnauthorizedException } from '@nestjs/common'
import { createHash } from 'crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RefreshTokensService } from './refresh-tokens.service.js'
import { RefreshTokensRepository } from './refresh-tokens.repository.js'

describe('RefreshTokensService', () => {
  let service: RefreshTokensService
  let repository: RefreshTokensRepository
  let configService: ConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokensService,
        {
          provide: RefreshTokensRepository,
          useValue: {
            createRefreshToken: vi.fn(),
            getRefreshToken: vi.fn(),
            deleteRefreshToken: vi.fn(),
            replaceRefreshToken: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<RefreshTokensService>(RefreshTokensService)
    repository = module.get<RefreshTokensRepository>(RefreshTokensRepository)
    configService = module.get<ConfigService>(ConfigService)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create and save a refresh token', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000000)
    vi.mocked(configService.get).mockReturnValue('7d')

    const result = await service.createRefreshToken(1)
    const hash = createHash('sha256').update(result.hex).digest('hex')

    expect(result.hex).toMatch(/^[a-f0-9]{64}$/)
    expect(result.expires).toEqual(new Date(1000000 + 7 * 24 * 60 * 60 * 1000))
    expect(repository.createRefreshToken).toHaveBeenCalledWith(
      1,
      hash,
      result.expires,
    )
  })

  it('should throw when refresh token expiration is not configured', async () => {
    vi.mocked(configService.get).mockReturnValue(undefined)

    await expect(service.createRefreshToken(1)).rejects.toThrow(
      'JWT_REFRESH_EXPIRES_IN is not configured',
    )
    expect(repository.createRefreshToken).not.toHaveBeenCalled()
  })

  it('should return a valid refresh token', async () => {
    const refreshToken = 'valid-token'
    const hash = createHash('sha256').update(refreshToken).digest('hex')
    const token = {
      token_hash: hash,
      user_id: 1,
      expires_at: new Date(Date.now() + 60000),
    }

    vi.mocked(repository.getRefreshToken).mockResolvedValue(token as never)

    await expect(service.getRefreshToken(refreshToken)).resolves.toEqual(token)
    expect(repository.getRefreshToken).toHaveBeenCalledWith(hash)
  })

  it('should throw when refresh token is invalid', async () => {
    vi.mocked(repository.getRefreshToken).mockResolvedValue(null as never)

    await expect(service.getRefreshToken('invalid-token')).rejects.toThrow(
      UnauthorizedException,
    )
  })

  it('should delete a refresh token by hash', async () => {
    const refreshToken = 'token-to-delete'
    const hash = createHash('sha256').update(refreshToken).digest('hex')

    await service.deleteRefreshToken(refreshToken)

    expect(repository.deleteRefreshToken).toHaveBeenCalledWith(hash)
  })

  it('should rotate a refresh token', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000000)
    vi.mocked(configService.get).mockReturnValue('7d')

    const refreshToken = 'old-token'
    const oldHash = createHash('sha256').update(refreshToken).digest('hex')

    vi.mocked(repository.getRefreshToken).mockResolvedValue({
      token_hash: oldHash,
      user_id: 1,
      expires_at: new Date(2000000),
    } as never)

    const result = await service.rotateRefreshToken(refreshToken)
    const newHash = createHash('sha256').update(result.hex).digest('hex')

    expect(result.hex).toMatch(/^[a-f0-9]{64}$/)
    expect(result.userId).toBe(1)
    expect(result.expires).toEqual(new Date(1000000 + 7 * 24 * 60 * 60 * 1000))
    expect(repository.replaceRefreshToken).toHaveBeenCalledWith(
      oldHash,
      1,
      newHash,
      result.expires,
    )
  })
})
