import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ClientKafka } from '@nestjs/microservices'
import { TRANSFER_EVENTS_TOPIC, type TransferNotification } from '@app/common'
import { KAFKA_SERVICE } from './kafka.constants.js'

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(KAFKA_SERVICE)
    private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect()
  }

  async onModuleDestroy() {
    await this.kafkaClient.close()
  }

  publishTransfer(event: TransferNotification) {
    return this.kafkaClient.emit(TRANSFER_EVENTS_TOPIC, event)
  }
}
