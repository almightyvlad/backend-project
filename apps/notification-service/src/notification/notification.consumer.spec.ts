import { PinoLogger } from 'nestjs-pino'
import type { KafkaContext } from '@nestjs/microservices'
import { ClsService } from 'nestjs-cls'
import { REQUEST_ID_KEY } from '@app/common'
import { NotificationConsumer } from './notification.consumer.js'
import { NotificationService } from './notification.service.js'

describe('NotificationConsumer', () => {
  const notifyTransferParticipants = vi.fn()
  const clsSet = vi.fn()
  const logger = {
    setContext: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }
  const commitOffsets = vi.fn()

  const context = {
    getMessage: () => ({
      offset: '4',
      headers: { 'x-request-id': 'req-1' },
    }),
    getConsumer: () => ({ commitOffsets }),
    getTopic: () => 'transfer-events',
    getPartition: () => 0,
  } as unknown as KafkaContext

  const consumer = new NotificationConsumer(
    { notifyTransferParticipants } as unknown as NotificationService,
    {
      run: <T>(callback: () => T) => callback(),
      set: clsSet,
    } as unknown as ClsService,
    logger as unknown as PinoLogger,
  )

  const event = {
    eventId: 'event-1',
    fromUserId: '1',
    toUserId: '2',
    amount: '10.00',
    occurredAt: '2026-11-21T00:00:00.000Z',
  }

  beforeEach(() => {
    notifyTransferParticipants.mockReset()
    clsSet.mockReset()
    commitOffsets.mockReset()
    commitOffsets.mockResolvedValue(undefined)
    logger.error.mockReset()
    logger.info.mockReset()
  })

  it('passes a valid event to the service and commits the next offset', async () => {
    await consumer.handleTransfer(event, context)

    expect(clsSet).toHaveBeenCalledWith(REQUEST_ID_KEY, 'req-1')
    expect(notifyTransferParticipants).toHaveBeenCalledWith({
      eventId: 'event-1',
      fromUserId: 1,
      toUserId: 2,
      amount: '10.00',
      occurredAt: '2026-11-21T00:00:00.000Z',
    })
    expect(commitOffsets).toHaveBeenCalledWith([
      {
        topic: 'transfer-events',
        partition: 0,
        offset: '5',
      },
    ])
  })

  it('commits a poison message without notifying anyone', async () => {
    await consumer.handleTransfer(
      { ...event, fromUserId: 'nope', toUserId: '2' },
      context,
    )

    expect(notifyTransferParticipants).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalled()
    expect(commitOffsets).toHaveBeenCalledWith([
      expect.objectContaining({ offset: '5' }),
    ])
  })
})
