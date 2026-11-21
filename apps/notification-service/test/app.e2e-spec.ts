import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types.js'
import { NotificationServiceModule } from './../src/notification-service.module.js'

describe('NotificationServiceController (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NotificationServiceModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  it('/ (GET) rejects a request without an access token', () => {
    return request(app.getHttpServer()).get('/').expect(401)
  })

  it('/notification/test (POST) rejects a request without an access token', () => {
    return request(app.getHttpServer())
      .post('/notification/test')
      .send({ userId: 1, payload: {} })
      .expect(401)
  })

  it('/ (GET) rejects an invalid access token', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401)
  })

  afterEach(async () => {
    await app.close()
  })
})
