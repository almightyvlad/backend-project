import { registerAs } from '@nestjs/config'
import { z } from 'zod'
import { logLevelSchema } from '../config/shared-env.js'

const loggerEnvSchema = z.object({
  LOG_LEVEL: logLevelSchema,
})

export const loggerConfig = registerAs('logger', () => {
  const env = loggerEnvSchema.parse(process.env)

  return {
    level: env.LOG_LEVEL,
  }
})
