import { UnauthorizedException } from '@nestjs/common'
import type { JwtService } from '@nestjs/jwt'

export interface AccessTokenPayload {
  sub: number
}

export function readBearerToken(authorization?: string): string {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing or invalid authorization header')
  }

  return authorization.split(' ')[1]
}

export function verifyAccessToken(
  jwtService: JwtService,
  token: string,
): AccessTokenPayload {
  try {
    return jwtService.verify<AccessTokenPayload>(token)
  } catch {
    throw new UnauthorizedException('Invalid or expired access token')
  }
}
