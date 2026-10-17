import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { ValidationPipe } from '@nestjs/common'
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService)

  const config = new DocumentBuilder()
    .setTitle('Backend Project API')
    .setDescription('API documentation for Backend Project')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  app.useGlobalPipes(new ValidationPipe())
  app.useGlobalFilters(new HttpExceptionFilter())
  await app.listen(configService.get<number>('PORT', 3000))
}
await bootstrap()
