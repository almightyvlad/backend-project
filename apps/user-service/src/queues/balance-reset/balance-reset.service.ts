import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import type { Queue } from 'bull'
import {
  BALANCE_RESET_JOB,
  BALANCE_RESET_QUEUE,
} from './balance-reset.constants.js'
import { ClsService } from 'nestjs-cls'
import { randomUUID } from 'crypto'
import { REQUEST_ID_KEY } from '@app/common'

@Injectable()
export class BalanceResetService {
  constructor(
    @InjectQueue(BALANCE_RESET_QUEUE)
    private readonly balanceResetQueue: Queue,
    private readonly cls: ClsService,
  ) {}

  add() {
    const requestId = this.cls.isActive()
      ? (this.cls.get<string | undefined>(REQUEST_ID_KEY) ?? randomUUID())
      : randomUUID()

    return this.balanceResetQueue.add(
      BALANCE_RESET_JOB,
      { requestId },
      {
        jobId: 'balance-reset',
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    )
  }
}
