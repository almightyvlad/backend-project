import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { Mocked } from 'vitest'

describe('AuthController', () => {
  let controller: AuthController
  let service: Mocked<AuthService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: vi.fn(),
            logout: vi.fn(),
            updateRefreshToken: vi.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    service = module.get<AuthService>(AuthService) as Mocked<AuthService>
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

    service.login.mockResolvedValueOnce(result)

    const response = await controller.login(loginDto)

    expect(service.login).toHaveBeenCalledWith(loginDto)
    expect(response).toEqual(result)
  })

  it('should call AuthService.logout with refreshToken', async () => {
    const refreshToken = 'test-refresh-token'

    const result = {
      message: 'Logged out',
    }

    service.logout.mockResolvedValueOnce(result)

    const response = await controller.logout({ refreshToken })

    expect(service.logout).toHaveBeenCalledWith(refreshToken)
    expect(response).toEqual(result)
  })

  it('should call AuthService.updateRefreshToken with refreshToken', async () => {
    const refreshToken = 'test-refresh-token'

    const result = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
    }

    service.updateRefreshToken.mockResolvedValueOnce(result)

    const response = await controller.getRefreshToken({ refreshToken })

    expect(service.updateRefreshToken).toHaveBeenCalledWith(refreshToken)
    expect(response).toEqual(result)
  })
})
