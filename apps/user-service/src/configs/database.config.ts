
import { registerAs } from '@nestjs/config'
import { envSchema } from './env.validation.js'

export function getDatabaseConfig() {
    const env = envSchema.parse(process.env)

    return {
        host: env.DATABASE_HOST,
        port: env.DATABASE_PORT,
        database: env.DATABASE_NAME,
        user: env.DATABASE_USER,
        password: env.DATABASE_PASSWORD,
    }
}

export const databaseConfig = registerAs('database', getDatabaseConfig)
