import { Injectable } from '@nestjs/common'

export type { BalanceTransferCompletedEvent } from '@app/common'

@Injectable()
export class NotificationServiceService {
  getHello(): string {
    return 'Hello World!'
  }
}
