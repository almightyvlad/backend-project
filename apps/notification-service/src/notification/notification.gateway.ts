import { TransferNotification, verifyAccessToken } from '@app/common';
import { JwtService } from '@nestjs/jwt';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

@WebSocketGateway()
export class NotificationGateway {

  constructor(private readonly jwtService: JwtService) {
  }


  @WebSocketServer()
  server: Server

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: string): { message: string } {
    return { message: 'Message received!' }
  }

  handleConnection(client: Socket) {

    const token = client.handshake.auth.token

    if (token === undefined || typeof token !== 'string') {
      client.disconnect()
      return
    }

    try {
      const payload = verifyAccessToken(this.jwtService, token)

      const userId = payload.sub

      client.join(`user:${userId}`)
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
    console.log('Client disconnected')
  }
}
