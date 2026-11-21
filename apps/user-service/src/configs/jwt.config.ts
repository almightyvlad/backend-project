import { registerAs } from '@nestjs/config'
import { envSchema } from './env.validation.js'

export const jwtConfig = registerAs('jwt', () => {
  const env = envSchema.parse(process.env)

  return {
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  }
})
