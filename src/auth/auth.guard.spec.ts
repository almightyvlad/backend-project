import { Test, TestingModule } from '@nestjs/testing'
import { AuthGuard } from './auth.guard.js'
import { JwtService } from '@nestjs/jwt'
import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core' // ИЗМЕНЕНИЕ: импорт Reflector
import { vi, type Mocked, describe, expect, it, beforeEach } from 'vitest'

describe('AuthGuard', () => {
  let guard: AuthGuard
  let jwtService: Mocked<JwtService>
  let reflector: Mocked<Reflector> // ИЗМЕНЕНИЕ: мок Reflector

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
          provide: Reflector, // ИЗМЕНЕНИЕ: регистрация мока Reflector
          useValue: {
            getAllAndOverride: vi.fn().mockReturnValue(false),
          },
        },
      ],
    }).compile()

    guard = module.get<AuthGuard>(AuthGuard)
    jwtService = module.get<JwtService>(JwtService) as Mocked<JwtService>
    reflector = module.get<Reflector>(Reflector) as Mocked<Reflector> // ИЗМЕНЕНИЕ
  })

  it('should be defined', () => {
    expect(guard).toBeDefined()
  })

  it('should throw UnauthorizedException when authorization header is missing', () => {
    const request = { headers: {} }
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => vi.fn(), // ИЗМЕНЕНИЕ: метод для чтения метаданных
      getClass: () => class TestController { }, // ИЗМЕНЕНИЕ
    } as unknown as ExecutionContext

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
  })

  it('should throw UnauthorizedException when authorization header does not start with Bearer', () => {
    const request = {
      headers: {
        authorization: 'Basic test-token',
      },
    }
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => vi.fn(), // ИЗМЕНЕНИЕ
      getClass: () => class TestController { }, // ИЗМЕНЕНИЕ
    } as unknown as ExecutionContext

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
    expect(jwtService.verify).not.toHaveBeenCalled()
  })

  it('should throw UnauthorizedException when JWT verification fails', () => {
    const request = {
      headers: {
        authorization: 'Bearer test-token',
      },
    }
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => vi.fn(), // ИЗМЕНЕНИЕ
      getClass: () => class TestController { }, // ИЗМЕНЕНИЕ
    } as unknown as ExecutionContext

    jwtService.verify.mockImplementationOnce(() => {
      throw new Error('Invalid token')
    })

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException)
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
      getHandler: () => vi.fn(), // ИЗМЕНЕНИЕ
      getClass: () => class TestController { }, // ИЗМЕНЕНИЕ
    } as unknown as ExecutionContext

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
      getHandler: () => vi.fn(),
      getClass: () => class TestController { },
    } as unknown as ExecutionContext

    const payload = { sub: 1, email: 'test@example.com' }
    jwtService.verify.mockReturnValueOnce(payload)

    expect(guard.canActivate(context)).toBe(true)
    expect(request.user).toEqual(payload)
  })

  it('should allow public routes without an access token', () => {
    const request = { headers: {} }
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => vi.fn(),
      getClass: () => class TestController { },
    } as unknown as ExecutionContext

    reflector.getAllAndOverride.mockReturnValueOnce(true)

    expect(guard.canActivate(context)).toBe(true)
    expect(jwtService.verify).not.toHaveBeenCalled()
  })
})