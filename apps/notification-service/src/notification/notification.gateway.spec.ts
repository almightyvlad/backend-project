import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { PinoLogger } from 'nestjs-pino'
import type { Server, Socket } from 'socket.io'
import type { TransferNotification } from '@app/common'
import { NotificationGateway } from './notification.gateway.js'

describe('NotificationGateway', () => {
  let gateway: NotificationGateway
  const verify = vi.fn()

  beforeEach(async () => {
    verify.mockReset()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationGateway,
        {
          provide: JwtService,
          useValue: { verify },
        },
        {
          provide: PinoLogger,
          useValue: {
            setContext: vi.fn(),
            info: vi.fn(),
            error: vi.fn(),
          },
        },
      ],
    }).compile()

    gateway = module.get(NotificationGateway)
  })

  it('disconnects a client with an invalid access token', () => {
    verify.mockImplementation(() => {
      throw new Error('bad token')
    })

    const client = {
      handshake: { auth: { token: 'not-a-jwt' } },
      disconnect: vi.fn(),
      join: vi.fn(),
      emit: vi.fn(),
    } as unknown as Socket

    gateway.handleConnection(client)

    expect(client.disconnect).toHaveBeenCalled()
    expect(client.join).not.toHaveBeenCalled()
  })

  it('joins the user room when the access token is valid', () => {
    verify.mockReturnValue({ sub: 7 })

    const client = {
      handshake: { auth: { token: 'valid-token' } },
      disconnect: vi.fn(),
      join: vi.fn(),
      emit: vi.fn(),
    } as unknown as Socket

    gateway.handleConnection(client)

    expect(client.join).toHaveBeenCalledWith('user:7')
    expect(client.disconnect).not.toHaveBeenCalled()
  })

  it('sends a notification to the user room', () => {
    const emit = vi.fn()
    const payload: TransferNotification = {
      eventId: 'event-1',
      fromUserId: '1',
      toUserId: '2',
      amount: '10.00',
      occurredAt: '2026-11-21T00:00:00.000Z',
    }

    gateway.server = {
      to: vi.fn().mockReturnValue({ emit }),
    } as unknown as Server

    gateway.sendNotification(2, payload)

    expect(gateway.server.to).toHaveBeenCalledWith('user:2')
    expect(emit).toHaveBeenCalledWith('notification', payload)
  })
})
