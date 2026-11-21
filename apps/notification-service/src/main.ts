import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'
import { ClsService } from 'nestjs-cls'
import { randomUUID } from 'crypto'
import type { ConfigType } from '@nestjs/config'
import { Transport } from '@nestjs/microservices'
import { kafkaConfig, REQUEST_ID_KEY } from '@app/common'
import { NotificationServiceModule } from './notification-service.module.js'
import { appConfig } from './configs/app.config.js'

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule, {
    bufferLogs: true,
  })

  const logger = app.get(Logger)
  const cls = app.get(ClsService)
  const appSettings = app.get<ConfigType<typeof appConfig>>(appConfig.KEY)
  const kafkaSettings = app.get<ConfigType<typeof kafkaConfig>>(kafkaConfig.KEY)

  app.useLogger(logger)
  app.enableShutdownHooks()

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'notification-service',
        brokers: kafkaSettings.brokers,
      },
      consumer: {
        groupId: 'notification-service',
      },
      run: {
        autoCommit: false,
      },
    },
  })

  await cls.run(async () => {
    cls.set(REQUEST_ID_KEY, randomUUID())

    await app.startAllMicroservices()
    await app.listen(appSettings.port)
    logger.log(`Notification service started on PORT: ${appSettings.port}`)
  })
}
await bootstrap()
