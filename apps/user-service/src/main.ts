import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import type { ConfigType } from '@nestjs/config'
import { Logger } from 'nestjs-pino'
import { ClsService } from 'nestjs-cls'
import { randomUUID } from 'crypto'
import { REQUEST_ID_KEY } from '@app/common'
import { appConfig } from './configs/app.config.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  const logger = app.get(Logger)
  const cls = app.get(ClsService)

  app.useLogger(logger)

  app.enableShutdownHooks()

  const appSettings = app.get<ConfigType<typeof appConfig>>(appConfig.KEY)

  const config = new DocumentBuilder()
    .setTitle('Backend Project API')
    .setDescription('API documentation for Backend Project')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  const port = appSettings.port

  await cls.run(async () => {
    cls.set(REQUEST_ID_KEY, randomUUID())
    await app.listen(port)
    logger.log(`Application started on PORT: ${port}`)
  })
}
await bootstrap()
