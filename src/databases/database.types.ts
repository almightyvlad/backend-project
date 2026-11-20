import type { ColumnType, Generated, Insertable } from 'kysely'

export type Database = {
  users: UserTable
  refresh_tokens: RefreshTokenTable
  avatars: AvatarsTable
}

interface UserTable {
  id: Generated<number>
  login: string
  password: string
  email: string
  age: number
  description: string
  deleted_at: ColumnType<Date | null, Date | null | undefined, Date | null>
  balance: Generated<string>
}

export interface RefreshTokenTable {
  id: Generated<number>
  user_id: number
  token_hash: string
  expires_at: Date
}

export interface AvatarsTable {
  id: Generated<number>
  user_id: number
  filename: string
  object_key: string
  uploaded_at: Generated<Date>
  deleted_at: ColumnType<Date | null, Date | null | undefined, Date | null>
}

export type NewUser = Insertable<Omit<UserTable, 'id' | 'deleted_at'>>
