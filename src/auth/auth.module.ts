import { forwardRef, Module } from '@nestjs/common'
import { UsersModule } from '../features/users/users.module.js'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { RefreshTokensModule } from '../features/refresh-tokens/refresh-tokens.module.js'

@Module({
  imports: [
    forwardRef(() => UsersModule),
    RefreshTokensModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [JwtModule],
})
export class AuthModule {}
