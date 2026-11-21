import { Body, Controller, Post } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway.js';
import type { SendNotificationDto } from './notification.types.js';

@Controller('notification')
export class NotificationController {

    constructor(private readonly gateway: NotificationGateway) { }

    @Post('test')
    sendNotification(@Body() body: SendNotificationDto) {
        this.gateway.sendNotification(body.userId, body.payload)
    }
}
