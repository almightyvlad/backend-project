import { registerAs } from '@nestjs/config'
import { envSchema } from './env.validation.js'

export const loggerConfig = registerAs('logger', () => {
  const env = envSchema.parse(process.env)

  return {
    level: env.LOG_LEVEL,
  }
})
