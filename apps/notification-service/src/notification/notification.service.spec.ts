import { PinoLogger } from 'nestjs-pino'
import type { ParsedTransferNotification } from '@app/common'
import { NotificationGateway } from './notification.gateway.js'
import { NotificationService } from './notification.service.js'

describe('NotificationService', () => {
  const sendNotification = vi.fn()
  const logger = {
    setContext: vi.fn(),
    info: vi.fn(),
  }

  const service = new NotificationService(
    { sendNotification } as unknown as NotificationGateway,
    logger as unknown as PinoLogger,
  )

  const event: ParsedTransferNotification = {
    eventId: 'event-1',
    fromUserId: 1,
    toUserId: 2,
    amount: '10.00',
    occurredAt: '2026-11-21T00:00:00.000Z',
  }

  beforeEach(() => {
    sendNotification.mockReset()
    logger.info.mockReset()
  })

  it('notifies both transfer participants', () => {
    service.notifyTransferParticipants(event)

    expect(sendNotification).toHaveBeenNthCalledWith(1, 2, {
      eventId: 'event-1',
      fromUserId: '1',
      toUserId: '2',
      amount: '10.00',
      occurredAt: '2026-11-21T00:00:00.000Z',
    })
    expect(sendNotification).toHaveBeenNthCalledWith(2, 1, {
      eventId: 'event-1',
      fromUserId: '1',
      toUserId: '2',
      amount: '10.00',
      occurredAt: '2026-11-21T00:00:00.000Z',
    })
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'event-1',
        fromUserId: 1,
        toUserId: 2,
      }),
      'Transfer notifications sent',
    )
  })
})
