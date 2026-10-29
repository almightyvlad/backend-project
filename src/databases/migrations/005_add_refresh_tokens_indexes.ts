
import { Kysely } from 'kysely'
import { Database } from '../database.types.js'

export async function up(db: Kysely<Database>): Promise<void> {
    await db.schema
        .createIndex('refresh_tokens_token_hash_unique')
        .unique()
        .on('refresh_tokens')
        .column('token_hash')
        .execute()

    await db.schema
        .createIndex('refresh_tokens_user_id_idx')
        .on('refresh_tokens')
        .column('user_id')
        .execute()
}

export async function down(db: Kysely<Database>): Promise<void> {
    await db.schema
        .dropIndex('refresh_tokens_user_id_idx')
        .execute()

    await db.schema
        .dropIndex('refresh_tokens_token_hash_unique')
        .execute()
}
