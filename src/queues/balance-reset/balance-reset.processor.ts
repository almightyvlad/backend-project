import { Process, Processor } from '@nestjs/bull'
import {
  BALANCE_RESET_JOB,
  BALANCE_RESET_QUEUE,
} from './balance-reset.constants.js'
import { UsersRepository } from '../../features/users/users.repository.js'
import { PinoLogger } from 'nestjs-pino'

@Processor(BALANCE_RESET_QUEUE)
export class BalanceResetProcessor {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly logger: PinoLogger,
  ) {}

  @Process(BALANCE_RESET_JOB)
  async process() {
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
  }
}
