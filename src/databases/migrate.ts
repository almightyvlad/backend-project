import * as path from 'path'
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { loadEnvFile } from 'process'
import type { Database } from './database.types.js'
import { FileMigrationProvider, Migrator } from 'kysely/migration'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'node:url'
import { getDatabaseConfig } from '../configs/database.config.js'

loadEnvFile()

const databaseConfig = getDatabaseConfig()

async function migrateToLatest() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: databaseConfig.host,
        port: databaseConfig.port,
        database: databaseConfig.database,
        user: databaseConfig.user,
        password: databaseConfig.password,
      }),
    }),
  })

  try {
    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: fileURLToPath(new URL('./migrations', import.meta.url)),
      }),
    })

    const { error, results } = await migrator.migrateToLatest()

    results?.forEach((it) => {
      if (it.status === 'Success') {
        console.log(`migration "${it.migrationName}" was executed successfully`)
      } else if (it.status === 'Error') {
        console.error(`failed to execute migration "${it.migrationName}"`)
      }
    })

    if (error) {
      throw error
    }
  } finally {
    await db.destroy()
  }
}

migrateToLatest().catch((error: unknown) => {
  console.error('failed to migrate')
  console.error(error)
  process.exitCode = 1
})
