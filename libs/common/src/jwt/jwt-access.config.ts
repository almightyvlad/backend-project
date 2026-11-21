import { registerAs } from '@nestjs/config'
import { z } from 'zod'
import type { StringValue } from 'ms'
import {
  jwtAccessExpiresInSchema,
  jwtAccessSecretSchema,
} from '../config/shared-env.js'

const jwtAccessEnvSchema = z.object({
  JWT_ACCESS_SECRET: jwtAccessSecretSchema,
  JWT_ACCESS_EXPIRES_IN: jwtAccessExpiresInSchema,
})

export const jwtAccessConfig = registerAs('jwtAccess', () => {
  const env = jwtAccessEnvSchema.parse(process.env)

  return {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
  }
})
