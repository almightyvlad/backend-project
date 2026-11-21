import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { RefreshTokensService } from '../features/refresh-tokens/refresh-tokens.service.js'

@Injectable()
export class TokensService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly refreshTokensService: RefreshTokensService
    ) { }

    async issueTokens(userId: number) {
        const accessToken = await this.jwtService.signAsync({ sub: userId })
        const refreshToken = (
            await this.refreshTokensService.createRefreshToken(userId)
        ).hex

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        }
    }

    async updateRefreshToken(refreshToken: string) {
        const newRefreshToken =
            await this.refreshTokensService.rotateRefreshToken(refreshToken)

        const newAccessToken = await this.jwtService.signAsync({
            sub: newRefreshToken.userId,
        })

        return {
            access_token: newAccessToken,
            refresh_token: newRefreshToken.hex,
        }
    }
}