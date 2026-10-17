import { Inject, Injectable } from '@nestjs/common'
import type { Database } from './databases/database.types.js'
import { Kysely } from 'kysely'

@Injectable()
export class AppService {
  constructor(
    @Inject('CONNECTION')
    private db: Kysely<Database>,
  ) {}

  getHello() {
    return 'Hello World!'
  }

  // getUsers() {
  //   return this.db.selectFrom('users').selectAll().execute()
  // }
}
