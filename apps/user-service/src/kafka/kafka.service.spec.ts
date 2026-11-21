import { Test, TestingModule } from '@nestjs/testing'
import type { TransferNotification } from '@app/common'
import { TRANSFER_EVENTS_TOPIC } from '@app/common'
import { KAFKA_SERVICE } from './kafka.constants.js'
import { KafkaService } from './kafka.service.js'

describe('KafkaService', () => {
  let service: KafkaService
  const emit = vi.fn()

  beforeEach(async () => {
    emit.mockReset()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaService,
        {
          provide: KAFKA_SERVICE,
          useValue: {
            connect: vi.fn(),
            close: vi.fn(),
            emit,
          },
        },
      ],
    }).compile()

    service = module.get(KafkaService)
  })

  it('publishes a transfer event to the transfer topic', () => {
    const event: TransferNotification = {
      eventId: 'event-1',
      fromUserId: '1',
      toUserId: '2',
      amount: '10.00',
      occurredAt: '2026-11-21T00:00:00.000Z',
    }

    service.publishTransfer(event)

    expect(emit).toHaveBeenCalledWith(TRANSFER_EVENTS_TOPIC, event)
  })
})
