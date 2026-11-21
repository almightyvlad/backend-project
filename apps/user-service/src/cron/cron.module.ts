import { Module } from '@nestjs/common'
import { AvatarsModule } from '../avatars/avatars.module.js'
import { QueuesModule } from '../queues/queues.module.js'
import { AvatarCleanupCron } from './avatar-cleanup/avatar-cleanup.cron.js'
import { BalanceResetCron } from './balance-reset/balance-reset.cron.js'
import { BalanceResetModule } from '../queues/balance-reset/balance-reset.module.js'

@Module({
  imports: [AvatarsModule, BalanceResetModule, QueuesModule],
  providers: [AvatarCleanupCron, BalanceResetCron],
})
export class CronModule {}
