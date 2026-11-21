import { TransferNotification } from "@app/common"

export interface SendNotificationDto {
    userId: number
    payload: TransferNotification
}