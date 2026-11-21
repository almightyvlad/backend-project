import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service.js';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KAFKA_SERVICE } from './kafka.constants.js';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: KAFKA_SERVICE,
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'user-service',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'user-service',
          },
        },
      },
    ]),
  ],
  providers: [KafkaService],
  exports: [KafkaService]
})
export class KafkaModule { }
