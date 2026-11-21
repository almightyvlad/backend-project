import { Cron } from '@nestjs/schedule'
import { Injectable } from '@nestjs/common'
import { BalanceResetService } from '../../queues/balance-reset/balance-reset.service.js'
import { ClsService } from 'nestjs-cls'
import { PinoLogger } from 'nestjs-pino'
import { randomUUID } from 'crypto'
import { REQUEST_ID_KEY } from '@app/common'

@Injectable()
export class BalanceResetCron {
  constructor(
    private readonly balanceResetService: BalanceResetService,
    private readonly cls: ClsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BalanceResetCron.name)
  }

  async handleCron() {
    try {
      await this.cls.run(async () => {
        this.cls.set(REQUEST_ID_KEY, randomUUID())
        await this.balanceResetService.add()
      })
    } catch (error) {
      this.logger.error({ err: error }, 'Balance reset cron failed')
    }
  }
}
