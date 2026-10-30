import { Kysely, sql } from 'kysely'
import { Database } from '../database.types.js'

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropConstraint('users_login_key')
    .execute()

  await sql`
    CREATE UNIQUE INDEX users_login_unique_active
    ON users(login)
    WHERE deleted_at IS NULL
  `.execute(db)
}

export async function down(db: Kysely<Database>): Promise<void> {
  await sql`DROP INDEX users_login_unique_active`.execute(db)

  await db.schema
    .alterTable('users')
    .addUniqueConstraint('users_login_key', ['login'])
    .execute()
}
