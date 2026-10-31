import { forwardRef, Module } from '@nestjs/common'
import { UsersModule } from '../features/users/users.module.js'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigType } from '@nestjs/config'
import { RefreshTokensModule } from '../features/refresh-tokens/refresh-tokens.module.js'
import { jwtConfig } from '../configs/jwt.config.js'
import { TokensService } from './tokens.service.js'

@Module({
  imports: [
    forwardRef(() => UsersModule),
    RefreshTokensModule,
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        secret: config.accessSecret,
        signOptions: {
          expiresIn: config.accessExpiresIn
        },
      }),
      inject: [jwtConfig.KEY],
    }),
  ],
  providers: [AuthService, TokensService],
  controllers: [AuthController],
  exports: [JwtModule, AuthService, TokensService],
})
export class AuthModule { }
