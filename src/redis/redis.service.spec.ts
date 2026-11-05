import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Redis } from 'ioredis'
import { RedisService } from './redis.service.js'
import { REDIS_HOST, REDIS_PORT } from './redis.constants.js'

const { redisMock } = vi.hoisted(() => ({
  redisMock: {
    ping: vi.fn(),
    quit: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}))

vi.mock('ioredis', () => ({
  Redis: vi.fn(function () {
    return redisMock
  }),
}))

describe('RedisService', () => {
  let service: RedisService

  beforeEach(async () => {
    vi.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: vi.fn((key: string) => {
              if (key === REDIS_HOST) return 'localhost'
              if (key === REDIS_PORT) return 6379
            }),
          },
        },
      ],
    }).compile()

    service = module.get<RedisService>(RedisService)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should create Redis connection', () => {
    expect(Redis).toHaveBeenCalledWith({
      host: 'localhost',
      port: 6379,
    })
  })

  it('should ping Redis on module initialization', async () => {
    redisMock.ping.mockResolvedValue('PONG')

    await service.onModuleInit()

    expect(redisMock.ping).toHaveBeenCalledOnce()
  })

  it('should close Redis connection on module destroy', async () => {
    redisMock.quit.mockResolvedValue('OK')

    await service.onModuleDestroy()

    expect(redisMock.quit).toHaveBeenCalledOnce()
  })

  it('should get value by key', async () => {
    redisMock.get.mockResolvedValue('test-value')

    const result = await service.get('test-key')

    expect(redisMock.get).toHaveBeenCalledWith('test-key')
    expect(result).toBe('test-value')
  })

  it('should set value with expiration', async () => {
    redisMock.set.mockResolvedValue('OK')

    const result = await service.set('test-key', 'test-value')

    expect(redisMock.set).toHaveBeenCalledWith(
      'test-key',
      'test-value',
      'EX',
      30,
    )
    expect(result).toBe('OK')
  })

  it('should delete value by key', async () => {
    redisMock.del.mockResolvedValue(1)

    const result = await service.del('test-key')

    expect(redisMock.del).toHaveBeenCalledWith('test-key')
    expect(result).toBe(1)
  })
})
