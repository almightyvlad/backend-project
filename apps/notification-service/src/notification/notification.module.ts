import { Module } from '@nestjs/common'
import { JwtVerificationModule } from '@app/common'
import { NotificationConsumer } from './notification.consumer.js'
import { NotificationGateway } from './notification.gateway.js'
import { NotificationService } from './notification.service.js'

@Module({
  imports: [JwtVerificationModule],
  providers: [NotificationGateway, NotificationService],
  controllers: [NotificationConsumer],
})
export class NotificationModule {}
