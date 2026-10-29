
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import request from 'supertest'
import { randomUUID } from 'node:crypto'
import { AppModule } from './../src/app.module.js'
import { Kysely } from 'kysely'
import { Database } from '../src/databases/database.types.js'
import { DATABASE_CONNECTION } from '../src/databases/databases.contants.js'

describe('AppController (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()

    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }))

    await app.init()
  })

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!')
  })

  it('should complete the authentication flow with refresh token rotation', async () => {
    const server = app.getHttpServer()
    const db = app.get<Kysely<Database>>(DATABASE_CONNECTION)

    const password = 'E2eTestPassword123!'
    const login = `e2e_${randomUUID().slice(0, 12)}`
    const email = `${login}@example.com`

    let userId: number | undefined

    try {
      await request(server)
        .post('/auth/login')
        .send({})
        .expect(400)

      const registrationResponse = await request(server)
        .post('/users')
        .send({
          login,
          password,
          email,
          age: 25,
          description: 'E2E test user',
        })

      expect(registrationResponse.status).toBe(201)

      userId = registrationResponse.body.id

      await request(server)
        .post('/users')
        .send({
          login,
          password,
          email: `duplicate_${email}`,
          age: 25,
          description: 'Duplicate E2E test user',
        })
        .expect(409)

      const loginResponse = await request(server)
        .post('/auth/login')
        .send({ login, password })
        .expect(201)

      const oldRefreshToken = loginResponse.body.refresh_token
      const accessToken = loginResponse.body.access_token

      expect(oldRefreshToken).toEqual(expect.any(String))
      expect(accessToken).toEqual(expect.any(String))

      await request(server)
        .get('/profile/my')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(({ body }) => {
          expect(body.login).toBe(login)
        })

      const refreshResponse = await request(server)
        .post('/auth/refresh')
        .send({ refresh_token: oldRefreshToken })
        .expect(201)

      const newRefreshToken = refreshResponse.body.refresh_token

      expect(refreshResponse.body.access_token).toEqual(expect.any(String))
      expect(newRefreshToken).toEqual(expect.any(String))
      expect(newRefreshToken).not.toBe(oldRefreshToken)

      await request(server)
        .post('/auth/refresh')
        .send({ refresh_token: oldRefreshToken })
        .expect(401)

      await request(server)
        .post('/auth/logout')
        .send({ refresh_token: newRefreshToken })
        .expect(201)

      await request(server)
        .post('/auth/refresh')
        .send({ refresh_token: newRefreshToken })
        .expect(401)
    } finally {
      if (userId !== undefined) {
        await db
          .deleteFrom('refresh_tokens')
          .where('user_id', '=', userId)
          .execute()

        await db
          .deleteFrom('users')
          .where('id', '=', userId)
          .execute()
      }
    }
  })

  afterEach(async () => {
    const db = app.get<Kysely<Database>>(DATABASE_CONNECTION)
    const destroySpy = vi.spyOn(db, 'destroy')

    await app.close()

    expect(destroySpy).toHaveBeenCalledOnce()
  })
})
