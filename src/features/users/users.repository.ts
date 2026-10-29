
import { Kysely } from 'kysely'
import type { Database, NewUser } from '../../databases/database.types.js'
import { Inject, Injectable } from '@nestjs/common'
import { UpdateUserDto } from './dto/update-user.dto.js'
import { DATABASE_CONNECTION } from '../../databases/databases.contants.js'
import { rethrowIfUniqueViolation } from '../../common/helpers/unique-violation.helper.js'

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: Kysely<Database>,
  ) { }

  private escapeLikePattern(value: string) {
    return value.replace(/[\\%_]/g, '\\$&')
  }

  async getUsers(page: number, limit: number, login?: string) {
    let usersQuery = this.db
      .selectFrom('users')
      .select(['id', 'login', 'age', 'description'])
      .where('deleted_at', 'is', null)

    let countQuery = this.db
      .selectFrom('users')
      .select((eb) => eb.fn.countAll().as('total'))
      .where('deleted_at', 'is', null)

    if (login) {
      const escapedLogin = this.escapeLikePattern(login)
      const searchPattern = `%${escapedLogin}%`

      usersQuery = usersQuery.where(
        'login',
        'ilike',
        searchPattern,
      )
      countQuery = countQuery.where(
        'login',
        'ilike',
        searchPattern,
      )
    }

    const [items, countResult] = await Promise.all([
      usersQuery
        .offset((page - 1) * limit)
        .limit(limit)
        .execute(),
      countQuery.executeTakeFirstOrThrow(),
    ])

    return {
      items,
      total: Number(countResult.total),
      page,
      limit,
    }
  }

  async createUser(newUser: NewUser) {
    try {
      return await this.db
        .insertInto('users')
        .values({
          login: newUser.login,
          password: newUser.password,
          email: newUser.email,
          age: newUser.age,
          description: newUser.description,
        })
        .returning(['id', 'login'])
        .executeTakeFirstOrThrow()
    } catch (error) {
      rethrowIfUniqueViolation(error)
    }
  }

  async findByLogin(login: string) {
    return await this.db
      .selectFrom('users')
      .selectAll()
      .where('login', '=', login)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
  }

  async findById(id: number) {
    return await this.db
      .selectFrom('users')
      .select(['id', 'login', 'email', 'age', 'description'])
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
  }

  async updateUser(id: number, updateUserDto: UpdateUserDto, passwordChanged: boolean) {
    try {
      return await this.db.transaction().execute(async (trx) => {
        const updatedUser = await trx
          .updateTable('users')
          .set({
            ...(updateUserDto.login !== undefined && { login: updateUserDto.login }),
            ...(updateUserDto.email !== undefined && { email: updateUserDto.email }),
            ...(updateUserDto.age !== undefined && { age: updateUserDto.age }),
            ...(updateUserDto.description !== undefined && {
              description: updateUserDto.description,
            }),
            ...(updateUserDto.password !== undefined && {
              password: updateUserDto.password,
            }),
          })
          .where('id', '=', id)
          .where('deleted_at', 'is', null)
          .returning(['id', 'login', 'email', 'age', 'description'])
          .executeTakeFirst()

        if (passwordChanged) {
          await trx
            .deleteFrom('refresh_tokens')
            .where('user_id', '=', id)
            .execute()
        }

        return updatedUser
      })
    } catch (error) {
      rethrowIfUniqueViolation(error)
    }
  }

  async softDeleteUser(id: number) {
    return await this.db.transaction().execute(async (trx) => {
      const deletedUser = await trx
        .updateTable('users')
        .set({ deleted_at: new Date() })
        .where('id', '=', id)
        .where('deleted_at', 'is', null)
        .returning('id')
        .executeTakeFirst()

      if (!deletedUser) {
        return false
      }

      await trx
        .deleteFrom('refresh_tokens')
        .where('user_id', '=', id)
        .execute()

      return true
    })
  }
}
