import { Test, TestingModule } from '@nestjs/testing'
import { BalanceResetController } from './balance-reset.controller.js'
import { BalanceResetService } from './balance-reset.service.js'
import { vi } from 'vitest'

describe('BalanceResetController', () => {
  let controller: BalanceResetController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BalanceResetController],
      providers: [{ provide: BalanceResetService, useValue: { add: vi.fn() } }],
    }).compile()

    controller = module.get<BalanceResetController>(BalanceResetController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
