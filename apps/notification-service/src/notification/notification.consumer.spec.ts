import { PinoLogger } from 'nestjs-pino'
import type { KafkaContext } from '@nestjs/microservices'
import type { TransferNotification } from '@app/common'
import { NotificationConsumer } from './notification.consumer.js'
import { NotificationGateway } from './notification.gateway.js'

describe('NotificationConsumer', () => {
  const sendNotification = vi.fn()
  const logger = {
    setContext: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }
  const commitOffsets = vi.fn()

  const context = {
    getMessage: () => ({ offset: '4' }),
    getConsumer: () => ({ commitOffsets }),
    getTopic: () => 'transfer-events',
    getPartition: () => 0,
  } as unknown as KafkaContext

  const consumer = new NotificationConsumer(
    { sendNotification } as unknown as NotificationGateway,
    logger as unknown as PinoLogger,
  )

  const event: TransferNotification = {
    eventId: 'event-1',
    fromUserId: '1',
    toUserId: '2',
    amount: '10.00',
    occurredAt: '2026-11-21T00:00:00.000Z',
  }

  beforeEach(() => {
    sendNotification.mockReset()
    commitOffsets.mockReset()
    commitOffsets.mockResolvedValue(undefined)
    logger.error.mockReset()
    logger.info.mockReset()
  })

  it('notifies both transfer participants and commits the next offset', async () => {
    await consumer.handleTransfer(event, context)

    expect(sendNotification).toHaveBeenNthCalledWith(1, 2, event)
    expect(sendNotification).toHaveBeenNthCalledWith(2, 1, event)
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

    expect(sendNotification).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalled()
    expect(commitOffsets).toHaveBeenCalledWith([
      expect.objectContaining({ offset: '5' }),
    ])
  })
})
