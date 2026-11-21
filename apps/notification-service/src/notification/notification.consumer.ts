import { Controller } from '@nestjs/common'
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices'
import { PinoLogger } from 'nestjs-pino'
import { ClsService } from 'nestjs-cls'
import {
  REQUEST_ID_HEADER,
  REQUEST_ID_KEY,
  TRANSFER_EVENTS_TOPIC,
  transferNotificationSchema,
} from '@app/common'
import { randomUUID } from 'crypto'
import { NotificationService } from './notification.service.js'

@Controller()
export class NotificationConsumer {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly cls: ClsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationConsumer.name)
  }

  @(EventPattern(TRANSFER_EVENTS_TOPIC) as MethodDecorator)
  async handleTransfer(@Payload() data: unknown, @Ctx() context: KafkaContext) {
    await this.cls.run(async () => {
      this.cls.set(REQUEST_ID_KEY, this.readRequestId(context))

      const parsed = transferNotificationSchema.safeParse(data)

      if (!parsed.success) {
        this.logger.error(
          { issues: parsed.error.issues },
          'Invalid transfer event',
        )
        await this.commitOffset(context)
        return
      }

      this.logger.info(
        { eventId: parsed.data.eventId },
        'Transfer event received',
      )

      this.notificationService.notifyTransferParticipants(parsed.data)
      await this.commitOffset(context)
    })
  }

  private readRequestId(context: KafkaContext): string {
    const message: unknown = context.getMessage()

    if (!isRecord(message) || !isRecord(message.headers)) {
      return randomUUID()
    }

    return readHeaderValue(message.headers[REQUEST_ID_HEADER]) ?? randomUUID()
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isUnknownArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value)
}

function readHeaderValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) {
    return value
  }

  if (Buffer.isBuffer(value)) {
    const text = value.toString('utf8')
    return text.length > 0 ? text : undefined
  }

  if (!isUnknownArray(value)) {
    return undefined
  }

  for (const item of value) {
    const text = readHeaderValue(item)
    if (text !== undefined) {
      return text
    }
  }

  return undefined
}
