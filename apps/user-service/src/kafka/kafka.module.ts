import { Module } from '@nestjs/common'
import { ConfigModule, type ConfigType } from '@nestjs/config'
import { ClientsModule, Transport } from '@nestjs/microservices'
import { kafkaConfig } from '@app/common'
import { KAFKA_SERVICE } from './kafka.constants.js'
import { KafkaService } from './kafka.service.js'

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KAFKA_SERVICE,
        imports: [ConfigModule.forFeature(kafkaConfig)],
        inject: [kafkaConfig.KEY],
        useFactory: (config: ConfigType<typeof kafkaConfig>) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'user-service',
              brokers: config.brokers,
            },
            consumer: {
              groupId: 'user-service',
            },
          },
        }),
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
