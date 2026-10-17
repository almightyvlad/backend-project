import { Injectable, UnauthorizedException } from '@nestjs/common'
import { UsersRepository } from '../features/users/users.repository.js'
import { LoginDto } from './dto/login.dto.js'
import bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { RefreshTokensService } from '../features/refresh-tokens/refresh-tokens.service.js'

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly refreshTokensService: RefreshTokensService,
  ) {}

  async findByLogin(login: string) {
    const user = await this.repository.findByLogin(login)

    if (!user) {
      throw new UnauthorizedException('Invalid login or password')
    }

    return user
  }

  async login(loginDto: LoginDto) {
    const user = await this.findByLogin(loginDto.login)

    if (await bcrypt.compare(loginDto.password, user.password)) {
      const accessToken = await this.jwtService.signAsync({ sub: user.id })
      const refreshToken = (
        await this.refreshTokensService.createRefreshToken(user.id)
      ).hex

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
      }
    } else {
      throw new UnauthorizedException('Invalid login or password')
    }
  }

  async logout(refreshToken: string) {
    await this.refreshTokensService.deleteRefreshToken(refreshToken)

    return { message: 'Logged out successfully' }
  }

  async updateRefreshToken(refreshToken: string) {
    const newRefreshToken =
      await this.refreshTokensService.rotateRefreshToken(refreshToken)

    const newAccessToken = await this.jwtService.signAsync({
      sub: newRefreshToken.userId,
    })

    return { access_token: newAccessToken, refresh_token: newRefreshToken.hex }
  }
}
