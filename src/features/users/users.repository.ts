import { Kysely } from 'kysely'
import type { Database, NewUser } from '../../databases/database.types.js'
import type { CreateUserDto } from './dto/create-user.dto/create-user.dto.js'
import { Inject, Injectable } from '@nestjs/common'
import { UpdateUserDto } from './dto/update-user.dto/update-user.dto.js'

@Injectable()
export class UsersRepository {
  constructor(
    @Inject('CONNECTION')
    private db: Kysely<Database>,
  ) {}

  async getUsers(page: number, limit: number) {
    return await this.db
      .selectFrom('users')
      .select(['id', 'login', 'email', 'age', 'description'])
      .where('deleted_at', 'is', null)
      .offset((page - 1) * limit)
      .limit(limit)
      .execute()
  }

  async createUser(newUser: NewUser) {
    return await this.db
      .insertInto('users')
      .values(newUser)
      .returning(['id', 'login'])
      .execute()
  }

  async findByLogin(login: string) {
    return await this.db
      .selectFrom('users')
      .selectAll()
      .where('login', '=', login)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
  }

  async searchByLogin(login: string, page: number, limit: number) {
    return await this.db
      .selectFrom('users')
      .select(['id', 'login', 'email', 'age', 'description'])
      .where('login', 'like', `%${login}%`)
      .where('deleted_at', 'is', null)
      .offset((page - 1) * limit)
      .limit(limit)
      .execute()
  }

  async findById(id: number) {
    return await this.db
      .selectFrom('users')
      .select(['id', 'login', 'email', 'age', 'description'])
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    return await this.db
      .updateTable('users')
      .set(updateUserDto)
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .returning(['id', 'login', 'email', 'age', 'description'])
      .executeTakeFirst()
  }

  async softDeleteUser(id: number) {
    await this.db
      .updateTable('users')
      .set({ deleted_at: new Date() })
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
  }
}
