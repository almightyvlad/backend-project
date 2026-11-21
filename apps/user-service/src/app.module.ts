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
import { appConfig } from './configs/app.config.js'
import { databaseConfig } from './configs/database.config.js'
import { jwtConfig } from './configs/jwt.config.js'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { LoggerModule } from 'nestjs-pino'
import { ClsModule, ClsService } from 'nestjs-cls'
import { randomUUID } from 'crypto'
import {
  AuthGuard,
  createLoggerModuleOptions,
  HttpExceptionFilter,
  jwtAccessConfig,
  loggerConfig,
  REQUEST_ID_KEY,
} from '@app/common'
import { StorageModule } from './storage/storage.module.js'
import { AvatarsModule } from './avatars/avatars.module.js'
import { RedisModule } from './redis/redis.module.js'
import { BullModule } from '@nestjs/bull'
import { QueuesModule } from './queues/queues.module.js'
import { CronModule } from './cron/cron.module.js'
import { ScheduleModule } from '@nestjs/schedule'
import { avatarCleanupConfig } from './configs/avatar-cleanup.config.js'
import { redisConfig } from './configs/redis.config.js'
import { storageConfig } from './configs/storage.config.js'
import type { ConfigType } from '@nestjs/config'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (config) => envSchema.parse(config),
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        jwtAccessConfig,
        avatarCleanupConfig,
        loggerConfig,
        redisConfig,
        storageConfig,
      ],
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req, res) => {
          const header = req.headers['x-request-id']
          const requestId =
            typeof header === 'string' && header.length > 0
              ? header
              : randomUUID()

          req.id = requestId
          cls.set(REQUEST_ID_KEY, requestId)
          res.setHeader('X-Request-Id', requestId)
        },
      },
    }),
    LoggerModule.forRootAsync({
      inject: [loggerConfig.KEY, ClsService],
      useFactory: createLoggerModuleOptions,
    }),
    BullModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (config: ConfigType<typeof redisConfig>) => ({
        redis: {
          host: config.host,
          port: config.port,
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
  controllers: [AppController],
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
export class AppModule { }
