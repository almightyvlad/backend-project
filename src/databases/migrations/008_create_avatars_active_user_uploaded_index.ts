import { Kysely, sql } from 'kysely'
import { Database } from '../database.types.js'

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createIndex('idx_avatars_active_user_uploaded')
    .on('avatars')
    .columns(['user_id', 'uploaded_at desc', 'id desc'])
    .where(sql<boolean>`deleted_at IS NULL`)
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropIndex('idx_avatars_active_user_uploaded').execute()
}
