import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Redis } from 'ioredis'
import { REDIS_HOST, REDIS_PORT } from './redis.constants.js'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly redis: Redis

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      port: configService.getOrThrow(REDIS_PORT),
      host: configService.getOrThrow(REDIS_HOST),
    })
  }

  async onModuleInit() {
    await this.redis.ping()
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }

  async get(key: string) {
    return await this.redis.get(key)
  }

  async set(key: string, value: string) {
    return await this.redis.set(key, value, 'EX', 30)
  }

  async del(key: string) {
    return await this.redis.del(key)
  }

  async delPattern(pattern: string) {
    let cursor = '0'
    let deletedCount = 0

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      )
      cursor = nextCursor
      if (keys.length > 0) deletedCount += await this.redis.del(...keys)
    } while (cursor !== '0')

    return deletedCount
  }
}
