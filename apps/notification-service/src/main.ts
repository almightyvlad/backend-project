import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'
import { ClsService } from 'nestjs-cls'
import { randomUUID } from 'crypto'
import { REQUEST_ID_KEY } from '@app/common'
import { NotificationServiceModule } from './notification-service.module.js'
import { Transport } from '@nestjs/microservices'

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule, {
    bufferLogs: true,
  })

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'notification-service',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'notification-service',
      },
      run: {
        autoCommit: false
      }
    },
  })

  const logger = app.get(Logger)
  const cls = app.get(ClsService)

  app.useLogger(logger)

  const port = process.env.port ?? 3001

  await cls.run(async () => {
    cls.set(REQUEST_ID_KEY, randomUUID())

    await app.startAllMicroservices()

    await app.listen(port)
  })
}
await bootstrap()
