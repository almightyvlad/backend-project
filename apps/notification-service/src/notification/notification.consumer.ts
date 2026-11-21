import { Controller } from "@nestjs/common";
import { Ctx, EventPattern, KafkaContext, Payload } from "@nestjs/microservices";
import { NotificationGateway } from "./notification.gateway.js";
import type { TransferNotification } from "@app/common";

@Controller()
export class NotificationConsumer {

    constructor(
        private readonly notificationGateway: NotificationGateway,
    ) { }

    @(EventPattern('transfer-events') as MethodDecorator)
    async handleTransfer(
        @Payload() data: TransferNotification,
        @Ctx() context: KafkaContext,
    ) {
        console.log('RECEIVED EVENT:', data.eventId)

        const toUserId = Number(data.toUserId)
        const fromUserId = Number(data.fromUserId)

        if (!Number.isFinite(toUserId) || !Number.isFinite(fromUserId)) {
            throw new Error('Invalid user IDs in transfer event')
        }

        console.log('Processing event:', data.eventId)

        this.notificationGateway.sendNotification(toUserId, data)
        this.notificationGateway.sendNotification(fromUserId, data)

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