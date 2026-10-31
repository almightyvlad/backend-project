import { Injectable, UnauthorizedException } from '@nestjs/common'
import { UsersRepository } from '../features/users/users.repository.js'
import { LoginDto } from './dto/login.dto.js'
import { RefreshTokensService } from '../features/refresh-tokens/refresh-tokens.service.js'
import { comparePassword } from './helpers/password.helper.js'
import { TokensService } from './tokens.service.js'

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly tokensService: TokensService
  ) { }

  async findByLogin(login: string) {
    const user = await this.repository.findByLogin(login)

    if (!user) {
      throw new UnauthorizedException('Invalid login or password')
    }

    return user
  }

  async login(loginDto: LoginDto) {
    const user = await this.findByLogin(loginDto.login)

    if (!(await comparePassword(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid login or password')
    }

    return this.tokensService.issueTokens(user.id)
  }

  async logout(refreshToken: string) {
    await this.refreshTokensService.deleteRefreshToken(refreshToken)
  }


}
