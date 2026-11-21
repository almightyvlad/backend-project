import { INestApplication, ValidationPipe } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import {
  AuthGuard,
  jwtAccessConfig,
  JwtVerificationModule,
} from '@app/common'
import { AppController } from '../app.controller.js'
import { AppService } from '../app.service.js'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { TokensService } from './tokens.service.js'
import { UsersController } from '../features/users/users.controller.js'
import { UsersService } from '../features/users/users.service.js'

describe('shared AuthGuard HTTP routes', () => {
  let app: INestApplication

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [jwtAccessConfig],
        }),
        JwtVerificationModule,
      ],
      controllers: [AppController, AuthController, UsersController],
      providers: [
        AppService,
        { provide: AuthService, useValue: { login: vi.fn(), logout: vi.fn() } },
        {
          provide: TokensService,
          useValue: { updateRefreshToken: vi.fn() },
        },
        {
          provide: UsersService,
          useValue: { getUsers: vi.fn(), createUser: vi.fn() },
        },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('allows public routes without a token', async () => {
    await request(app.getHttpServer()).get('/').expect(200).expect('Hello World!')

    await request(app.getHttpServer()).post('/auth/login').send({}).expect(400)

    await request(app.getHttpServer()).post('/users').send({}).expect(400)
  })

  it('rejects protected routes without a token', async () => {
    await request(app.getHttpServer()).get('/users').expect(401)
  })

  it('rejects protected routes with an invalid jwt', async () => {
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401)
  })
})
