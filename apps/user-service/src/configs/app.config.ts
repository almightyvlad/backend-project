import { registerAs } from '@nestjs/config'
import { envSchema } from './env.validation.js'

export const appConfig = registerAs('app', () => {
    const env = envSchema.parse(process.env)

    return {
        port: env.PORT,
    }
})

