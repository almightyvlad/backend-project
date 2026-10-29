import { registerAs } from '@nestjs/config'
import { envSchema } from './env.validation.js'
import { StringValue } from 'ms'

export const jwtConfig = registerAs('jwt', () => {
    const env = envSchema.parse(process.env)

    return {
        accessSecret: env.JWT_ACCESS_SECRET,
        accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
        refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    }
})

