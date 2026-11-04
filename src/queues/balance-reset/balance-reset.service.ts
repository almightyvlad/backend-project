import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import type { Queue } from 'bull'
import {
  BALANCE_RESET_JOB,
  BALANCE_RESET_QUEUE,
} from './balance-reset.constants.js'

@Injectable()
export class BalanceResetService {
  constructor(
    @InjectQueue(BALANCE_RESET_QUEUE)
    private readonly balanceResetQueue: Queue,
  ) {}

  add() {
    return this.balanceResetQueue.add(BALANCE_RESET_JOB)
  }
}
