import { Kysely } from 'kysely'
import type { Database } from '../../databases/database.types.js'
import { Inject, Injectable } from '@nestjs/common'
import { DATABASE_CONNECTION } from '../../databases/databases.contants.js'

@Injectable()
export class RefreshTokensRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Kysely<Database>,
  ) { }

  async createRefreshToken(userId: number, tokenHash: string, expiresAt: Date) {
    return await this.db
      .insertInto('refresh_tokens')
      .values({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt })
      .execute()
  }

  async getRefreshToken(tokenHash: string) {
    return await this.db
      .selectFrom('refresh_tokens')
      .innerJoin('users', 'users.id', 'refresh_tokens.user_id')
      .selectAll('refresh_tokens')
      .where('refresh_tokens.token_hash', '=', tokenHash)
      .where('users.deleted_at', 'is', null)
      .executeTakeFirst()
  }

  async deleteRefreshToken(tokenHash: string) {
    return await this.db
      .deleteFrom('refresh_tokens')
      .where('token_hash', '=', tokenHash)
      .execute()
  }

  async replaceRefreshToken(
    oldTokenHash: string,
    userId: number,
    newTokenHash: string,
    expiresAt: Date,
  ) {
    return await this.db.transaction().execute(async (trx) => {
      const deletedRows = await trx
        .deleteFrom('refresh_tokens')
        .where('token_hash', '=', oldTokenHash)
        .execute()

      if (deletedRows[0]?.numDeletedRows === 0n) {
        return false
      }

      await trx
        .insertInto('refresh_tokens')
        .values({
          user_id: userId,
          token_hash: newTokenHash,
          expires_at: expiresAt,
        })
        .execute()

      return true
    })
  }
}
