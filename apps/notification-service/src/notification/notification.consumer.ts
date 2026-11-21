import { Controller } from '@nestjs/common'
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices'
import { PinoLogger } from 'nestjs-pino'
import { TRANSFER_EVENTS_TOPIC, type TransferNotification } from '@app/common'
import { NotificationGateway } from './notification.gateway.js'

@Controller()
export class NotificationConsumer {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationConsumer.name)
  }

  @(EventPattern(TRANSFER_EVENTS_TOPIC) as MethodDecorator)
  async handleTransfer(
    @Payload() data: TransferNotification,
    @Ctx() context: KafkaContext,
  ) {
    const toUserId = Number(data?.toUserId)
    const fromUserId = Number(data?.fromUserId)

    if (!Number.isFinite(toUserId) || !Number.isFinite(fromUserId)) {
      this.logger.error(
        {
          eventId: data?.eventId,
          fromUserId: data?.fromUserId,
          toUserId: data?.toUserId,
        },
        'Invalid user IDs in transfer event',
      )
      await this.commitOffset(context)
      return
    }

    this.logger.info(
      { eventId: data.eventId, fromUserId, toUserId },
      'Transfer event received',
    )

    this.notificationGateway.sendNotification(toUserId, data)
    this.notificationGateway.sendNotification(fromUserId, data)

    await this.commitOffset(context)
  }

  private async commitOffset(context: KafkaContext) {
    const nextOffset = (BigInt(context.getMessage().offset) + 1n).toString()

    await context.getConsumer().commitOffsets([
      {
        topic: context.getTopic(),
        partition: context.getPartition(),
        offset: nextOffset,
      },
    ])
  }
}
