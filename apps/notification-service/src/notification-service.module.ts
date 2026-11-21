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
  REQUEST_ID_HEADER,
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
        setup: (cls: ClsService, req: unknown, res: unknown) => {
          if (!isRequestWithId(req) || !canSetHeader(res)) {
            return
          }

          const requestId = readRequestIdHeader(req.headers) ?? randomUUID()

          req.id = requestId
          cls.set(REQUEST_ID_KEY, requestId)
          res.setHeader(REQUEST_ID_HEADER, requestId)
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

type RequestWithId = {
  headers: unknown
  id?: string
}

function isRequestWithId(value: unknown): value is RequestWithId {
  return isRecord(value) && 'headers' in value
}

function canSetHeader(
  value: unknown,
): value is { setHeader: (name: string, headerValue: string) => void } {
  return isRecord(value) && typeof value.setHeader === 'function'
}

function readRequestIdHeader(headers: unknown): string | undefined {
  if (!isRecord(headers)) {
    return undefined
  }

  const header = headers[REQUEST_ID_HEADER]

  return typeof header === 'string' && header.length > 0 ? header : undefined
}
