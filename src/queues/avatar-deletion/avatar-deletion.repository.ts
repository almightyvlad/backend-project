import { Inject, Injectable } from '@nestjs/common'
import { Kysely } from 'kysely'
import type { Database } from '../../databases/database.types.js'
import { DATABASE_CONNECTION } from '../../databases/databases.contants.js'

@Injectable()
export class AvatarDeletionRepository {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: Kysely<Database>,
  ) {}

  async hardDelete(id: number, objectKey: string) {
    return await this.db
      .deleteFrom('avatars')
      .where('id', '=', id)
      .where('object_key', '=', objectKey)
      .where('deleted_at', 'is not', null)
      .execute()
  }
}
