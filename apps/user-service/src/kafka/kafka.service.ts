import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices'
import { KAFKA_SERVICE } from './kafka.constants.js';
import type { TransferNotification } from '@app/common';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    constructor(
        @Inject(KAFKA_SERVICE)
        private readonly kafkaClient: ClientKafka) { }

    async onModuleInit() {
        await this.kafkaClient.connect()
    }

    async onModuleDestroy() {
        await this.kafkaClient.close()
    }

    publishTransfer(event: TransferNotification) {
        return this.kafkaClient.emit('transfer-events', event)
    }
}
