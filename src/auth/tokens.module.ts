import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigType } from '@nestjs/config'
import { jwtConfig } from '../configs/jwt.config.js'
import { RefreshTokensModule } from '../features/refresh-tokens/refresh-tokens.module.js'
import { TokensService } from './tokens.service.js'

@Module({
  imports: [
    RefreshTokensModule,
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      useFactory: (config: ConfigType<typeof jwtConfig>) => ({
        secret: config.accessSecret,
        signOptions: {
          expiresIn: config.accessExpiresIn,
        },
      }),
      inject: [jwtConfig.KEY],
    }),
  ],
  providers: [TokensService],
  exports: [JwtModule, TokensService, RefreshTokensModule],
})
export class TokensModule {}
