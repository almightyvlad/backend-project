import { Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common'
import { ConfigService, ConfigType } from '@nestjs/config'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { Database } from './database.types.js'
import { databaseConfig } from '../configs/database.config.js'
import { DATABASE_CONNECTION } from './databases.contants.js'

const connectionProvider = {
  provide: DATABASE_CONNECTION,
  useFactory: (config: ConfigType<typeof databaseConfig>) => {
    const db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool({
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.user,
          password: config.password,
        }),
      }),
    })

    return db
  },
  inject: [databaseConfig.KEY],
}

@Injectable()
class DatabaseShutdown implements OnApplicationShutdown {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Kysely<Database>
  ) { }

  async onApplicationShutdown() {
    await this.db.destroy()
  }

}

@Module({
  exports: [connectionProvider.provide],
  providers: [connectionProvider, DatabaseShutdown],
})
export class DatabasesModule { }
