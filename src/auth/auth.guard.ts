import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Observable } from 'rxjs'
import { Reflector } from '@nestjs/core'
import { AuthenticatedRequest } from './types/authenticated-request.js'
import { IS_PUBLIC_KEY } from './decorators/public.decorator.js'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector
  ) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const authorization = request.headers.authorization

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header')
    }

    const token = authorization.split(' ')[1]

    try {
      const payload = this.jwtService.verify<{ sub: number }>(token)
      request.user = payload
    } catch {
      throw new UnauthorizedException('Invalid or expired access token')
    }

    return true
  }
}