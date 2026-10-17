import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Observable } from 'rxjs'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest()
    const authorization = request.headers.authorization

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return false
    }

    const token = authorization.split(' ')[1]

    try {
      const payload = this.jwtService.verify(token)

      request.user = payload
    } catch {
      return false
    }

    return true
  }
}
