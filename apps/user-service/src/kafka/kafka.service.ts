import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { ClientKafka } from '@nestjs/microservices'
import { ClsService } from 'nestjs-cls'
import {
  REQUEST_ID_HEADER,
  REQUEST_ID_KEY,
  TRANSFER_EVENTS_TOPIC,
  type TransferNotification,
} from '@app/common'
import { KAFKA_SERVICE } from './kafka.constants.js'

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(KAFKA_SERVICE)
    private readonly kafkaClient: ClientKafka,
    private readonly cls: ClsService,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect()
  }

  async onModuleDestroy() {
    await this.kafkaClient.close()
  }

  publishTransfer(event: TransferNotification) {
    const headers: Record<string, string> = {}
    const requestId = this.readRequestId()

    if (requestId !== undefined) {
      headers[REQUEST_ID_HEADER] = requestId
    }

    return this.kafkaClient.emit(TRANSFER_EVENTS_TOPIC, {
      value: event,
      headers,
    })
  }

  private readRequestId(): string | undefined {
    if (!this.cls.isActive()) {
      return undefined
    }

    const requestId: unknown = this.cls.get(REQUEST_ID_KEY)

    return typeof requestId === 'string' && requestId.length > 0
      ? requestId
      : undefined
  }
}
