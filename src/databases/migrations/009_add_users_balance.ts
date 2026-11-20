import { Kysely, sql } from 'kysely'
import { Database } from '../database.types.js'

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('balance', sql`numeric(12,2)`, (col) =>
      col
        .notNull()
        .defaultTo(0.0)
        .check(sql`balance >= 0`),
    )
    .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
  await db.schema.alterTable('users').dropColumn('balance').execute()
}
