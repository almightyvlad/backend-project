import { Controller, Post } from '@nestjs/common'
import { BalanceResetService } from './balance-reset.service.js'

@Controller('balance-reset')
export class BalanceResetController {
  constructor(private readonly balanceResetService: BalanceResetService) {}

  @Post()
  async resetBalances() {
    return await this.balanceResetService.add()
  }
}
