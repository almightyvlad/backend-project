import { Body, Controller, Post } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { LoginDto } from './dto/login.dto.js'
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Log in and receive tokens' })
  @ApiCreatedResponse({ description: 'Login successful' })
  @ApiBadRequestResponse({ description: 'Invalid login data' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @ApiOperation({ summary: 'Log out and revoke refresh token' })
  @ApiCreatedResponse({ description: 'Logout successful' })
  @Post('logout')
  logout(@Body() body: { refreshToken: string }) {
    return this.authService.logout(body.refreshToken)
  }

  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiCreatedResponse({ description: 'Tokens refreshed successfully' })
  @Post('refresh')
  getRefreshToken(@Body() body: { refreshToken: string }) {
    return this.authService.updateRefreshToken(body.refreshToken)
  }
}
