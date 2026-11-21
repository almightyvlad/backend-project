import { Test, TestingModule } from '@nestjs/testing'
import type { TransferNotification } from '@app/common'
import { REQUEST_ID_HEADER, TRANSFER_EVENTS_TOPIC } from '@app/common'
import { ClsService } from 'nestjs-cls'
import { KAFKA_SERVICE } from './kafka.constants.js'
import { KafkaService } from './kafka.service.js'

describe('KafkaService', () => {
  let service: KafkaService
  const emit = vi.fn()
  const cls = {
    isActive: vi.fn(() => true),
    get: vi.fn(() => 'req-1'),
  }

  beforeEach(async () => {
    emit.mockReset()
    cls.isActive.mockReset()
    cls.isActive.mockReturnValue(true)
    cls.get.mockReset()
    cls.get.mockReturnValue('req-1')

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
        {
          provide: ClsService,
          useValue: cls,
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

    expect(emit).toHaveBeenCalledWith(TRANSFER_EVENTS_TOPIC, {
      value: event,
      headers: { [REQUEST_ID_HEADER]: 'req-1' },
    })
  })
})
