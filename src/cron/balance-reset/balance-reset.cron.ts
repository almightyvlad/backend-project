import { Cron } from '@nestjs/schedule'
import { Injectable } from '@nestjs/common'
import { BalanceResetService } from '../../queues/balance-reset/balance-reset.service.js'

@Injectable()
export class BalanceResetCron {
  constructor(private readonly balanceResetService: BalanceResetService) {}

  @Cron('*/1 * * * *')
  async handleCron() {
    await this.balanceResetService.add()
  }
}
