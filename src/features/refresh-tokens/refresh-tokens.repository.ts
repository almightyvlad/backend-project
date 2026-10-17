import { Kysely } from 'kysely'
import type { Database } from '../../databases/database.types.js'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export class RefreshTokensRepository {
  constructor(
    @Inject('CONNECTION')
    private readonly db: Kysely<Database>,
  ) {}

  async createRefreshToken(userId: number, tokenHash: string, expiresAt: Date) {
    return await this.db
      .insertInto('refresh_tokens')
      .values({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt })
      .execute()
  }

  async getRefreshToken(tokenHash: string) {
    return await this.db
      .selectFrom('refresh_tokens')
      .selectAll()
      .where('token_hash', '=', tokenHash)
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
        throw new Error('Refresh token not found')
      }

      await trx
        .insertInto('refresh_tokens')
        .values({
          user_id: userId,
          token_hash: newTokenHash,
          expires_at: expiresAt,
        })
        .execute()
    })
  }
}
