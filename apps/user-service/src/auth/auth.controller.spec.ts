import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { TokensService } from './tokens.service.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mocked } from 'vitest'

describe('AuthController', () => {
  let controller: AuthController
  let service: Mocked<AuthService>
  let tokensService: Mocked<TokensService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: vi.fn(),
            logout: vi.fn(),
          },
        },
        {
          provide: TokensService,
          useValue: {
            updateRefreshToken: vi.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    service = module.get<AuthService>(AuthService) as Mocked<AuthService>
    tokensService = module.get<TokensService>(TokensService) as Mocked<TokensService>
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('should call AuthService.login with loginDto', async () => {
    const loginDto = {
      login: 'vlad123',
      password: 'securepass123',
    }

    const result = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
    }

    service.login.mockResolvedValueOnce(result as never)

    const response = await controller.login(loginDto)

    expect(service.login).toHaveBeenCalledWith(loginDto)
    expect(response).toEqual(result)
  })

  it('should call AuthService.logout with refreshToken', async () => {
    const refreshToken = 'test-refresh-token'

    service.logout.mockResolvedValueOnce(undefined)

    const response = await controller.logout({ refresh_token: refreshToken })

    expect(service.logout).toHaveBeenCalledWith(refreshToken)
    expect(response).toBeUndefined()
  })

  it('should call TokensService.updateRefreshToken with refreshToken', async () => {
    const refreshToken = 'test-refresh-token'

    const result = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    }

    tokensService.updateRefreshToken.mockResolvedValueOnce(result as never)

    const response = await controller.getRefreshToken({ refresh_token: refreshToken })

    expect(tokensService.updateRefreshToken).toHaveBeenCalledWith(refreshToken)
    expect(response).toEqual(result)
  })
})