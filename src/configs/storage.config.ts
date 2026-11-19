import { registerAs } from '@nestjs/config'
import { envSchema } from './env.validation.js'

export const storageConfig = registerAs('storage', () => {
  const env = envSchema.parse(process.env)

  return {
    endpoint: env.MINIO_ENDPOINT,
    region: env.MINIO_REGION,
    bucket: env.MINIO_BUCKET,
    accessKey: env.MINIO_ROOT_USER,
    secretKey: env.MINIO_ROOT_PASSWORD,
  }
})
