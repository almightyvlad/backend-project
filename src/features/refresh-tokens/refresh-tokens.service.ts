
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { RefreshTokensRepository } from './refresh-tokens.repository.js'
import type { ConfigType } from '@nestjs/config'
import type { StringValue } from 'ms'
import { jwtConfig } from '../../configs/jwt.config.js'
import {
  generateRefreshToken,
  hashToken,
} from '../../auth/helpers/token.helper.js'

@Injectable()
export class RefreshTokensService {
  constructor(
    private readonly refreshTokensRepository: RefreshTokensRepository,
    @Inject(jwtConfig.KEY)
    private readonly config: ConfigType<typeof jwtConfig>
  ) { }

  async createRefreshToken(userId: number) {
    const { hex, hash, expires } = generateRefreshToken(
      this.config.refreshExpiresIn as StringValue,
    )

    await this.refreshTokensRepository.createRefreshToken(
      userId,
      hash,
      expires,
    )

    return { hex, expires }
  }

  async getRefreshToken(refreshToken: string) {
    const hash = hashToken(refreshToken)

    const token = await this.refreshTokensRepository.getRefreshToken(hash)

    if (!token || token.expires_at.getTime() <= Date.now()) {
      throw new UnauthorizedException('Invalid refresh_token')
    }

    return token
  }

  async deleteRefreshToken(refreshToken: string) {
    const hash = hashToken(refreshToken)

    return await this.refreshTokensRepository.deleteRefreshToken(hash)
  }

  async rotateRefreshToken(refreshToken: string) {
    const token = await this.getRefreshToken(refreshToken)

    const { hex, hash, expires } = generateRefreshToken(
      this.config.refreshExpiresIn as StringValue,
    )

    const replaced = await this.refreshTokensRepository.replaceRefreshToken(
      token.token_hash,
      token.user_id,
      hash,
      expires,
    )

    if (!replaced) {
      throw new UnauthorizedException('Invalid or already used refresh_token')
    }

    return { hex, expires, userId: token.user_id }
  }
}
