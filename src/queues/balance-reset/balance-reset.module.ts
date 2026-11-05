import { Module } from '@nestjs/common'
import { BalanceResetController } from './balance-reset.controller.js'
import { QueuesModule } from '../queues.module.js'
import { BalanceResetProcessor } from './balance-reset.processor.js'
import { UsersModule } from '../../features/users/users.module.js'

@Module({
  imports: [QueuesModule, UsersModule],
  providers: [BalanceResetProcessor],
  controllers: [BalanceResetController],
})
export class BalanceResetModule {}
