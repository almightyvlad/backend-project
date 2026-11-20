import { ArgumentsHost, HttpException } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { HttpExceptionFilter } from './http-exception.filter.js'

describe('HttpExceptionFilter', () => {
  const createLogger = () => ({
    setContext: vi.fn(),
    error: vi.fn(),
  })

  it('should be defined', () => {
    const logger = createLogger()

    expect(
      new HttpExceptionFilter(logger as unknown as PinoLogger),
    ).toBeDefined()
    expect(logger.setContext).toHaveBeenCalledWith('HttpExceptionFilter')
  })

  it('should return the correct status and response body', () => {
    const logger = createLogger()
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    const request = { method: 'GET', url: '/users' }
    const host = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: vi.fn().mockReturnValue(response),
        getRequest: vi.fn().mockReturnValue(request),
      }),
    } as unknown as ArgumentsHost

    const exception = new HttpException('Bad Request', 400)

    new HttpExceptionFilter(logger as unknown as PinoLogger).catch(
      exception,
      host,
    )

    expect(response.status).toHaveBeenCalledWith(400)
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Bad Request',
      timestamp: expect.any(String),
      path: '/users',
    })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('should log server errors', () => {
    const logger = createLogger()
    const response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }
    const request = { method: 'POST', url: '/users' }
    const host = {
      switchToHttp: vi.fn().mockReturnValue({
        getResponse: vi.fn().mockReturnValue(response),
        getRequest: vi.fn().mockReturnValue(request),
      }),
    } as unknown as ArgumentsHost

    const exception = new Error('Something went wrong')

    new HttpExceptionFilter(logger as unknown as PinoLogger).catch(
      exception,
      host,
    )

    expect(logger.error).toHaveBeenCalledWith(
      {
        err: exception,
        statusCode: 500,
        method: 'POST',
        url: '/users',
      },
      'HTTP request failed',
    )
  })
})
