import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'
import { ClsModule, ClsService } from 'nestjs-cls'
import { randomUUID } from 'crypto'
import {
  AuthGuard,
  createLoggerModuleOptions,
  HttpExceptionFilter,
  jwtAccessConfig,
  JwtVerificationModule,
  kafkaConfig,
  loggerConfig,
  REQUEST_ID_KEY,
} from '@app/common'
import { appConfig } from './configs/app.config.js'
import { notificationEnvSchema } from './configs/env.validation.js'
import { NotificationServiceController } from './notification-service.controller.js'
import { NotificationServiceService } from './notification-service.service.js'
import { NotificationModule } from './notification/notification.module.js'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => notificationEnvSchema.parse(config),
      load: [appConfig, kafkaConfig, loggerConfig, jwtAccessConfig],
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
    JwtVerificationModule,
    NotificationModule,
  ],
  controllers: [NotificationServiceController],
  providers: [
    NotificationServiceService,
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
export class NotificationServiceModule {}
