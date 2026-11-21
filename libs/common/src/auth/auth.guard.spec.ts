import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest'
import { AuthGuard } from './auth.guard.js'

describe('AuthGuard', () => {
  let guard: AuthGuard
  let jwtService: Mocked<JwtService>
  let reflector: Mocked<Reflector>

  const createContext = (
    request: object,
    getType: () => 'http' | 'ws' | 'rpc' = () => 'http',
  ) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => vi.fn(),
      getClass: () => class TestController {},
      getType,
    }) as unknown as ExecutionContext

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
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: vi.fn().mockReturnValue(false),
          },
        },
      ],
    }).compile()

    guard = module.get<AuthGuard>(AuthGuard)
    jwtService = module.get<JwtService>(JwtService) as Mocked<JwtService>
    reflector = module.get<Reflector>(Reflector) as Mocked<Reflector>
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })

  it('should throw UnauthorizedException when authorization header is missing', () => {
    const context = createContext({ headers: {} })

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
  })

  it('should throw UnauthorizedException when authorization header does not start with Bearer', () => {
    const context = createContext({
      headers: {
        authorization: 'Basic test-token',
      },
    })

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
    expect(jwtService.verify).not.toHaveBeenCalled()
  })

  it('should throw UnauthorizedException when JWT verification fails', () => {
    const context = createContext({
      headers: {
        authorization: 'Bearer test-token',
      },
    })

    jwtService.verify.mockImplementationOnce(() => {
      throw new Error('Invalid token')
    })

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
  })

  it('should return true when JWT verification succeeds', () => {
    const context = createContext({
      headers: {
        authorization: 'Bearer test-token',
      },
    })

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
    const context = createContext(request)

    const payload = { sub: 1, email: 'test@example.com' }
    jwtService.verify.mockReturnValueOnce(payload)

    expect(guard.canActivate(context)).toBe(true)
    expect(request.user).toEqual(payload)
  })

  it('should allow public routes without an access token', () => {
    const context = createContext({ headers: {} })

    reflector.getAllAndOverride.mockReturnValueOnce(true)

    expect(guard.canActivate(context)).toBe(true)
    expect(jwtService.verify).not.toHaveBeenCalled()
  })

  it('should skip non-http contexts', () => {
    const context = createContext({ headers: {} }, () => 'ws')

    expect(guard.canActivate(context)).toBe(true)
    expect(jwtService.verify).not.toHaveBeenCalled()
  })
})
