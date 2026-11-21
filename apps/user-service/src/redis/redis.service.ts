import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import { Redis } from 'ioredis'
import { redisConfig } from '../configs/redis.config.js'
import { parseCachedValue } from './typed-cache.js'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly redis: Redis

  constructor(
    @Inject(redisConfig.KEY)
    private readonly config: ConfigType<typeof redisConfig>,
  ) {
    this.redis = new Redis({
      port: this.config.port,
      host: this.config.host,
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

  async getJson<T>(
    key: string,
    isValid: (value: unknown) => value is T,
  ): Promise<T | null> {
    return parseCachedValue(await this.get(key), isValid)
  }

  async set(key: string, value: string) {
    return await this.redis.set(
      key,
      value,
      'EX',
      this.config.usersCacheTtlSeconds,
    )
  }

  async setJson(key: string, value: unknown) {
    return await this.set(key, JSON.stringify(value))
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
