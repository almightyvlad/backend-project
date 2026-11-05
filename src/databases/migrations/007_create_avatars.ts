import { Kysely, sql } from 'kysely'
import { Database } from '../database.types.js'

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('avatars')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) =>
      col.notNull().references('users.id'),
    )
    .addColumn('filename', 'varchar', (col) => col.notNull())
    .addColumn('object_key', 'varchar', (col) => col.notNull().unique())
    .addColumn('uploaded_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamptz')
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.dropTable('avatars').execute()
}
