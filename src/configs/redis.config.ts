import { registerAs } from '@nestjs/config'
import { envSchema } from './env.validation.js'
import { USERS_CACHE_TTL_SECONDS } from '../redis/redis.constants.js'

export const redisConfig = registerAs('redis', () => {
  const env = envSchema.parse(process.env)

  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    usersCacheTtlSeconds: USERS_CACHE_TTL_SECONDS,
  }
})
