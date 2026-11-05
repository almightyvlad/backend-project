import { Test, TestingModule } from '@nestjs/testing'
import { BalanceResetService } from './balance-reset.service.js'
import { getQueueToken } from '@nestjs/bull'
import { BALANCE_RESET_QUEUE } from './balance-reset.constants.js'
import { vi } from 'vitest'

describe('BalanceResetService', () => {
  let service: BalanceResetService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BalanceResetService,
        {
          provide: getQueueToken(BALANCE_RESET_QUEUE),
          useValue: { add: vi.fn() },
        },
      ],
    }).compile()

    service = module.get<BalanceResetService>(BalanceResetService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
