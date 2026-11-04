import { Process, Processor } from '@nestjs/bull'
import {
  BALANCE_RESET_JOB,
  BALANCE_RESET_QUEUE,
} from './balance-reset.constants.js'
import { UsersRepository } from '../../features/users/users.repository.js'

@Processor(BALANCE_RESET_QUEUE)
export class BalanceResetProcessor {
  constructor(private readonly usersRepository: UsersRepository) {}

  @Process(BALANCE_RESET_JOB)
  async process() {
    await this.usersRepository.resetAllUsersBalances()
  }
}
