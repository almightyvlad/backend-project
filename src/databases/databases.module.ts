import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { Database } from './database.types.js'

const connectionProvider = {
  provide: 'CONNECTION',
  useFactory: (configService: ConfigService) => {
    const db = new Kysely<Database>({
      dialect: new PostgresDialect({
        pool: new Pool({
          host: configService.get('DATABASE_HOST'),
          port: Number(configService.get('DATABASE_PORT')),
          database: configService.get('DATABASE_NAME'),
          user: configService.get('DATABASE_USER'),
          password: configService.get('DATABASE_PASSWORD'),
        }),
      }),
    })

    return db
  },
  inject: [ConfigService],
}

@Module({
  exports: [connectionProvider.provide],
  providers: [connectionProvider],
})
export class DatabasesModule {}
