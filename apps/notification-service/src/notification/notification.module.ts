import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway.js';
import { JwtVerificationModule } from '@app/common';
import { NotificationController } from './notification.controller.js';
import { NotificationConsumer } from './notification.consumer.js';

@Module({
  imports: [JwtVerificationModule],
  providers: [NotificationGateway],
  controllers: [NotificationController, NotificationConsumer]
})
export class NotificationModule { }
