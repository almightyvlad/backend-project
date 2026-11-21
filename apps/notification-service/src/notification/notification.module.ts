import { Module } from '@nestjs/common'
import { JwtVerificationModule } from '@app/common'
import { NotificationConsumer } from './notification.consumer.js'
import { NotificationGateway } from './notification.gateway.js'

@Module({
  imports: [JwtVerificationModule],
  providers: [NotificationGateway],
  controllers: [NotificationConsumer],
})
export class NotificationModule {}
