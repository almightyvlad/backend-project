import { Module } from '@nestjs/common'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from './configs/env.validation.js'
import { DatabasesModule } from './databases/databases.module.js'
import { UsersModule } from './features/users/users.module.js'
import { FeaturesModule } from './features/features.module.js'
import { AuthModule } from './auth/auth.module.js'
import { RefreshTokensModule } from './features/refresh-tokens/refresh-tokens.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (config) => envSchema.parse(config),
      isGlobal: true,
    }),
    DatabasesModule,
    UsersModule,
    FeaturesModule,
    AuthModule,
    RefreshTokensModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
