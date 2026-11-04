import { Inject, Injectable } from '@nestjs/common'
import { Insertable, Kysely } from 'kysely'
import { AvatarsTable, Database } from '../databases/database.types.js'
import { DATABASE_CONNECTION } from '../databases/databases.contants.js'

@Injectable()
export class AvatarsRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Kysely<Database>,
  ) {}

  async countActiveByUserId(userId: number) {
    const result = await this.db
      .selectFrom('avatars')
      .select((eb) => eb.fn.countAll().as('total'))
      .where('user_id', '=', userId)
      .where('deleted_at', 'is', null)
      .executeTakeFirstOrThrow()

    return Number(result.total)
  }

  async create(avatar: Insertable<AvatarsTable>) {
    return await this.db
      .insertInto('avatars')
      .values(avatar)
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  async findActiveById(id: number, userId: number) {
    return await this.db
      .selectFrom('avatars')
      .selectAll()
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
  }

  async softDelete(id: number, userId: number) {
    const deletedAvatar = await this.db
      .updateTable('avatars')
      .set({ deleted_at: new Date() })
      .where('id', '=', id)
      .where('user_id', '=', userId)
      .where('deleted_at', 'is', null)
      .returning('id')
      .executeTakeFirst()

    if (!deletedAvatar) {
      return false
    }

    return true
  }

  async findExpiredDeleted(date: Date) {
    return await this.db
      .selectFrom('avatars')
      .selectAll()
      .where('deleted_at', 'is not', null)
      .where('deleted_at', '<=', date)
      .execute()
  }

  async softDeleteAllByUserId(userId: number) {
    return await this.db
      .updateTable('avatars')
      .set({ deleted_at: new Date() })
      .where('user_id', '=', userId)
      .where('deleted_at', 'is', null)
      .returning(['id', 'object_key'])
      .execute()
  }
}
