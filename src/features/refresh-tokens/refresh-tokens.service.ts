import { Injectable, UnauthorizedException } from '@nestjs/common'
import { RefreshTokensRepository } from './refresh-tokens.repository.js'
import { createHash, randomBytes } from 'crypto'
import { ConfigService } from '@nestjs/config'
import ms, { StringValue } from 'ms'

@Injectable()
export class RefreshTokensService {
  constructor(
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly configService: ConfigService,
  ) {}

  async createRefreshToken(userId: number) {
    const hex = randomBytes(32).toString('hex')
    const hash = createHash('sha256').update(hex).digest('hex')

    const refreshExpiresIn = this.configService.get<StringValue>(
      'JWT_REFRESH_EXPIRES_IN',
    )

    if (!refreshExpiresIn) {
      throw new Error('JWT_REFRESH_EXPIRES_IN is not configured')
    }

    const expires = Date.now() + ms(refreshExpiresIn)

    await this.refreshTokensRepository.createRefreshToken(
      userId,
      hash,
      new Date(expires),
    )

    return { hex: hex, expires: new Date(expires) }
  }

  async getRefreshToken(refreshToken: string) {
    const hash = createHash('sha256').update(refreshToken).digest('hex')

    const token = await this.refreshTokensRepository.getRefreshToken(hash)

    if (!token || token.expires_at.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid refresh_token')
    }

    return token
  }

  async deleteRefreshToken(refreshToken: string) {
    const hash = createHash('sha256').update(refreshToken).digest('hex')

    return await this.refreshTokensRepository.deleteRefreshToken(hash)
  }

  async replaceRefreshToken(
    oldTokenHash: string,
    userId: number,
    newTokenHash: string,
    expiresAt: Date,
  ) {
    return await this.refreshTokensRepository.replaceRefreshToken(
      oldTokenHash,
      userId,
      newTokenHash,
      expiresAt,
    )
  }

  async rotateRefreshToken(refreshToken: string) {
    const token = await this.getRefreshToken(refreshToken)

    const hex = randomBytes(32).toString('hex')
    const hash = createHash('sha256').update(hex).digest('hex')

    const refreshExpiresIn = this.configService.get<StringValue>(
      'JWT_REFRESH_EXPIRES_IN',
    )

    if (!refreshExpiresIn) {
      throw new Error('JWT_REFRESH_EXPIRES_IN is not configured')
    }

    const expires = new Date(Date.now() + ms(refreshExpiresIn))

    await this.refreshTokensRepository.replaceRefreshToken(
      token.token_hash,
      token.user_id,
      hash,
      expires,
    )

    return { hex, expires, userId: token.user_id }
  }
}
