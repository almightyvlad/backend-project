import { Module } from '@nestjs/common'
import { AppController } from './app.controller.js'
import { AppService } from './app.service.js'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { envSchema } from './configs/env.validation.js'
import { DatabasesModule } from './databases/databases.module.js'
import { UsersModule } from './features/users/users.module.js'
import { FeaturesModule } from './features/features.module.js'
import { AuthModule } from './auth/auth.module.js'
import { RefreshTokensModule } from './features/refresh-tokens/refresh-tokens.module.js'
import { appConfig } from './configs/app.config.js'
import { databaseConfig } from './configs/database.config.js'
import { jwtConfig } from './configs/jwt.config.js'
import { AuthGuard } from './auth/auth.guard.js'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'
import { ClsModule } from 'nestjs-cls'
import { randomUUID } from 'crypto'
import { LOG_LEVEL } from './configs/env.constants.js'
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js'
import { StorageModule } from './storage/storage.module.js'
import { AvatarsController } from './avatars/avatars.controller.js'
import { AvatarsModule } from './avatars/avatars.module.js'
import { RedisModule } from './redis/redis.module.js'
import { BullModule } from '@nestjs/bull'
import { REDIS_HOST, REDIS_PORT } from './redis/redis.constants.js'
import { QueuesModule } from './queues/queues.module.js'
import { CronModule } from './cron/cron.module.js'
import { ScheduleModule } from '@nestjs/schedule'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (config) => envSchema.parse(config),
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get(LOG_LEVEL),
          genReqId: (req, res) => {
            const existingID = req.id ?? req.headers['x-request-id']

            if (typeof existingID === 'string' && existingID.length > 0) {
              res.setHeader('X-Request-Id', existingID)
              return existingID
            }

            const id = randomUUID()

            res.setHeader('X-Request-Id', id)

            return id
          },
        },
      }),
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req) => {
          cls.set('requestId', req.id)
        },
      },
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.getOrThrow(REDIS_HOST),
          port: config.getOrThrow<number>(REDIS_PORT),
        },
      }),
    }),
    ScheduleModule.forRoot(),
    DatabasesModule,
    UsersModule,
    FeaturesModule,
    AuthModule,
    RefreshTokensModule,
    StorageModule,
    AvatarsModule,
    RedisModule,
    QueuesModule,
    CronModule,
  ],
  controllers: [AppController, AvatarsController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
