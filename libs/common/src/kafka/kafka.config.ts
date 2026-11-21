import { registerAs } from '@nestjs/config'
import { z } from 'zod'
import { kafkaBrokersSchema } from '../config/shared-env.js'

const kafkaEnvSchema = z.object({
  KAFKA_BROKERS: kafkaBrokersSchema,
})

export const kafkaConfig = registerAs('kafka', () => {
  const env = kafkaEnvSchema.parse(process.env)

  return {
    brokers: env.KAFKA_BROKERS,
  }
})
