import { Process, Processor } from '@nestjs/bull'
import type { Job } from 'bull'
import {
  BALANCE_RESET_JOB,
  BALANCE_RESET_QUEUE,
} from './balance-reset.constants.js'
import { UsersRepository } from '../../features/users/users.repository.js'
import { PinoLogger } from 'nestjs-pino'
import { ClsService } from 'nestjs-cls'
import { REQUEST_ID_KEY } from '@app/common'
import { randomUUID } from 'crypto'

@Processor(BALANCE_RESET_QUEUE)
export class BalanceResetProcessor {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly logger: PinoLogger,
    private readonly cls: ClsService,
  ) {
    this.logger.setContext(BalanceResetProcessor.name)
  }

  @Process(BALANCE_RESET_JOB)
  async process(job: Job<{ requestId?: string }>) {
    return this.cls.run(async () => {
      this.cls.set(REQUEST_ID_KEY, job.data.requestId ?? randomUUID())

      this.logger.info('Balance reset started')
      try {
        const users = await this.usersRepository.resetAllUsersBalances()
        this.logger.info(
          { affectedUsers: users.length },
          'Balance reset completed',
        )
        return users.length
      } catch (error) {
        this.logger.error({ err: error }, 'Balance reset failed')
        throw error
      }
    })
  }
}
