import { Inject, Injectable } from '@nestjs/common'
import type { Database } from './databases/database.types.js'
import { Kysely } from 'kysely'
import { DATABASE_CONNECTION } from './databases/databases.contants.js'

@Injectable()
export class AppService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: Kysely<Database>,
  ) { }

  getHello() {
    return 'Hello World!'
  }

}
