import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, type ConfigType } from '@nestjs/config'
import { jwtAccessConfig } from './jwt-access.config.js'

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtAccessConfig)],
      useFactory: (config: ConfigType<typeof jwtAccessConfig>) => ({
        secret: config.accessSecret,
        signOptions: {
          expiresIn: config.accessExpiresIn,
        },
      }),
      inject: [jwtAccessConfig.KEY],
    }),
  ],
  exports: [JwtModule],
})
export class JwtVerificationModule {}
