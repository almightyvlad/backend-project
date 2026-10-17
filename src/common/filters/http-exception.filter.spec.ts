import { ArgumentsHost, HttpException } from '@nestjs/common'
import { HttpExceptionFilter } from './http-exception.filter.js'

describe('HttpExceptionFilter', () => {
  it('should be defined', () => {
    expect(new HttpExceptionFilter()).toBeDefined()
  })

  it('should return the correct status and response body', () => {
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    const request = { url: '/users' }
    const host = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: vi.fn().mockReturnValue(response),
        getRequest: vi.fn().mockReturnValue(request),
      }),
    } as unknown as ArgumentsHost

    const exception = new HttpException('Bad Request', 400)

    new HttpExceptionFilter().catch(exception, host)

    expect(response.status).toHaveBeenCalledWith(400)
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Bad Request',
      timestamp: expect.any(String),
      path: '/users',
    })
  })
})
