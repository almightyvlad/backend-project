import { Test, TestingModule } from '@nestjs/testing'
import { BalanceResetService } from './balance-reset.service.js'

describe('BalanceResetService', () => {
  let service: BalanceResetService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BalanceResetService],
    }).compile()

    service = module.get<BalanceResetService>(BalanceResetService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
