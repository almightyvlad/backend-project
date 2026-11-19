import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { Logger } from 'nestjs-pino'
import { ClsService } from 'nestjs-cls'
import { randomUUID } from 'crypto'
import { REQUEST_ID_KEY } from './common/request-context.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  const logger = app.get(Logger)
  const cls = app.get(ClsService)

  app.useLogger(logger)

  app.enableShutdownHooks()

  const configService = app.get(ConfigService)

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

  const port = configService.get<number>('PORT', 3000)

  await cls.run(async () => {
    cls.set(REQUEST_ID_KEY, randomUUID())
    await app.listen(port)
    logger.log(`Application started on PORT: ${port}`)
  })
}
await bootstrap()
