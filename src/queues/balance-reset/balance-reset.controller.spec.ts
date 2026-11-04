import { Test, TestingModule } from '@nestjs/testing'
import { BalanceResetController } from './balance-reset.controller.js'

describe('BalanceResetController', () => {
  let controller: BalanceResetController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BalanceResetController],
    }).compile()

    controller = module.get<BalanceResetController>(BalanceResetController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
