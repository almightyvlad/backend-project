import { Module } from '@nestjs/common'
import { UsersModule } from '../features/users/users.module.js'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'
import { TokensModule } from './tokens.module.js'

@Module({
  imports: [UsersModule, TokensModule],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [TokensModule, AuthService],
})
export class AuthModule {}
