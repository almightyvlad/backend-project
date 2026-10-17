import { Kysely } from 'kysely'
import { Database } from '../database.types.js'

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('refresh_tokens')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) =>
      col.notNull().references('users.id').onDelete('cascade'),
    )
    .addColumn('token_hash', 'varchar(64)', (col) => col.notNull())
    .addColumn('expires_at', 'timestamptz', (col) => col.notNull())
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('refresh_tokens').execute()
}
