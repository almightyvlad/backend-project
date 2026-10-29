import { Body, Controller, Post } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { LoginDto } from './dto/login.dto.js'
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { RefreshTokenDto } from './dto/refresh-token.dto.js'
import { TokensService } from './tokens.service.js'
import { Public } from './decorators/public.decorator.js'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokensService: TokensService

  ) { }

  @ApiOperation({ summary: 'Log in and receive tokens' })
  @ApiCreatedResponse({ description: 'Login successful' })
  @ApiBadRequestResponse({ description: 'Invalid login data' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @ApiOperation({ summary: 'Log out and revoke refresh token' })
  @ApiCreatedResponse({ description: 'Logout successful' })
  @Public()
  @Post('logout')
  logout(@Body() body: RefreshTokenDto) {
    return this.authService.logout(body.refresh_token)
  }

  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiCreatedResponse({ description: 'Tokens refreshed successfully' })
  @Public()
  @Post('refresh')
  getRefreshToken(@Body() body: RefreshTokenDto) {
    return this.tokensService.updateRefreshToken(body.refresh_token)
  }
}
