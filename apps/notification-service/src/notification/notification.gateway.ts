import { verifyAccessToken, type TransferNotification } from '@app/common'
import { JwtService } from '@nestjs/jwt'
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { PinoLogger } from 'nestjs-pino'
import { Server, Socket } from 'socket.io'

@WebSocketGateway()
export class NotificationGateway {
  @WebSocketServer()
  server: Server

  constructor(
    private readonly jwtService: JwtService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(NotificationGateway.name)
  }

  handleConnection(client: Socket) {
    const auth: unknown = client.handshake.auth
    const token = readHandshakeToken(auth)

    if (token === undefined) {
      client.disconnect()
      return
    }

    try {
      const payload = verifyAccessToken(this.jwtService, token)
      client.join(`user:${payload.sub}`)
    } catch {
      client.disconnect()
      return
    }

    client.emit('welcome', { message: 'Welcome!' })
  }

  sendNotification(userId: number, payload: TransferNotification) {
    this.server.to(`user:${userId}`).emit('notification', payload)
  }

  handleDisconnect(client: Socket) {
    this.logger.info({ clientId: client.id }, 'Client disconnected')
  }
}

function readHandshakeToken(auth: unknown): string | undefined {
  if (!isRecord(auth)) {
    return undefined
  }

  const token = auth.token

  if (typeof token !== 'string' || token.length === 0) {
    return undefined
  }

  return token
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
