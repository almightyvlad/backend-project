import { Injectable } from '@nestjs/common'
import type {
  ParsedTransferNotification,
  TransferNotification,
} from '@app/common'
import { PinoLogger } from 'nestjs-pino'
import { NotificationGateway } from './notification.gateway.js'

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationService.name)
  }

  notifyTransferParticipants(event: ParsedTransferNotification) {
    const payload = toTransferNotification(event)
    const recipientIds = [event.toUserId, event.fromUserId]

    for (const userId of recipientIds) {
      this.notificationGateway.sendNotification(userId, payload)
    }

    this.logger.info(
      {
        eventId: event.eventId,
        fromUserId: event.fromUserId,
        toUserId: event.toUserId,
      },
      'Transfer notifications sent',
    )
  }
}

function toTransferNotification(
  event: ParsedTransferNotification,
): TransferNotification {
  return {
    eventId: event.eventId,
    fromUserId: String(event.fromUserId),
    toUserId: String(event.toUserId),
    amount: event.amount,
    occurredAt: event.occurredAt,
  }
}
