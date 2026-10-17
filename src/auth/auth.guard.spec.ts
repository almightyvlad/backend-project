import { Test, TestingModule } from '@nestjs/testing'
import { AuthGuard } from './auth.guard.js'
import { JwtService } from '@nestjs/jwt'
import { ExecutionContext } from '@nestjs/common'
import { vi, type Mocked } from 'vitest'

describe('AuthGuard', () => {
  let guard: AuthGuard

  let jwtService: Mocked<JwtService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verify: vi.fn(),
          },
        },
      ],
    }).compile()

    guard = module.get<AuthGuard>(AuthGuard)

    jwtService = module.get<JwtService>(JwtService) as Mocked<JwtService>
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })

  it('should return false when authorization header is missing', () => {
    const request = { headers: {} }

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext

    expect(guard.canActivate(context)).toBe(false)
  })

  it('should return false when authorization header does not start with Bearer', () => {
    const request = {
      headers: {
        authorization: 'Basic test-token',
      },
    }

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext

    expect(guard.canActivate(context)).toBe(false)

    expect(jwtService.verify).toHaveBeenCalledTimes(0)
  })

  it('should return false when JWT verification fails', () => {
    const request = {
      headers: {
        authorization: 'Bearer test-token',
      },
    }

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext

    jwtService.verify.mockImplementationOnce(() => {
      throw new Error('Invalid token')
    })

    expect(guard.canActivate(context)).toBe(false)
  })

  it('should return true when JWT verification succeeds', () => {
    const request = {
      headers: {
        authorization: 'Bearer test-token',
      },
    }

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext

    jwtService.verify.mockReturnValueOnce({ sub: 1, email: 'test@example.com' })

    expect(guard.canActivate(context)).toBe(true)
  })

  it('should attach payload to request.user when JWT verification succeeds', () => {
    const request: {
      headers: { authorization: string }
      user?: { sub: number; email: string }
    } = {
      headers: {
        authorization: 'Bearer test-token',
      },
    }

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext

    const payload = { sub: 1, email: 'test@example.com' }

    jwtService.verify.mockReturnValueOnce(payload)

    expect(guard.canActivate(context)).toBe(true)

    expect(request.user).toEqual(payload)
  })
})
