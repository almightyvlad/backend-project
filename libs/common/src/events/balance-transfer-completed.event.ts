export interface BalanceTransferParty {
  id: number
  balance: string
}

export interface BalanceTransferCompletedEvent {
  amount: string
  sender: BalanceTransferParty
  recipient: BalanceTransferParty
}
