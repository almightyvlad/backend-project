import type { ColumnType, Generated } from 'kysely'

export type Database = {
  users: UserTable
  refresh_tokens: RefreshTokenTable
}

interface UserTable {
  id: Generated<number>
  login: string
  password: string
  email: string
  age: number
  description: string
  deleted_at: ColumnType<Date | null, Date | null | undefined, Date | null>
}

export interface RefreshTokenTable {
  id: Generated<number>
  user_id: number
  token_hash: string
  expires_at: Date
}

export type NewUser = Omit<UserTable, 'id' | 'deleted_at'>
