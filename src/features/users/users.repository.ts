import { Kysely, sql } from 'kysely'
import type { Database, NewUser } from '../../databases/database.types.js'
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UpdateUserDto } from './dto/update-user.dto.js'
import { DATABASE_CONNECTION } from '../../databases/databases.contants.js'
import { rethrowIfUniqueViolation } from '../../common/helpers/unique-violation.helper.js'
import { TransferDto } from './dto/transfer.dto.js'

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Kysely<Database>,
  ) {}

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

      usersQuery = usersQuery.where('login', 'ilike', searchPattern)
      countQuery = countQuery.where('login', 'ilike', searchPattern)
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

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
    passwordChanged: boolean,
  ) {
    try {
      return await this.db.transaction().execute(async (trx) => {
        const updatedUser = await trx
          .updateTable('users')
          .set({
            ...(updateUserDto.login !== undefined && {
              login: updateUserDto.login,
            }),
            ...(updateUserDto.email !== undefined && {
              email: updateUserDto.email,
            }),
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

      await trx.deleteFrom('refresh_tokens').where('user_id', '=', id).execute()

      return true
    })
  }

  async getActiveUsers(
    minAge: number,
    maxAge: number,
    page: number,
    limit: number,
  ) {
    const activeUsers = this.db
      .selectFrom('users')
      .innerJoin('avatars', 'avatars.user_id', 'users.id')
      .select(['users.id', 'users.login', 'users.age', 'users.description'])
      .where('users.deleted_at', 'is', null)
      .where('avatars.deleted_at', 'is', null)
      .where('users.description', 'is not', null)
      .where('users.description', '!=', '')
      .where('users.age', '>=', minAge)
      .where('users.age', '<=', maxAge)
      .groupBy('users.id')
      .having((eb) => eb.fn.count('avatars.id'), '>', 2)
      .as('active_users')

    const latestAvatars = this.db
      .selectFrom('avatars')
      .select([
        'avatars.user_id',
        'avatars.id as avatar_id',
        'avatars.filename as avatar_filename',
        'avatars.object_key as avatar_object_key',
        'avatars.uploaded_at as avatar_uploaded_at',
      ])
      .where('avatars.deleted_at', 'is', null)
      .distinctOn('avatars.user_id')
      .orderBy('avatars.user_id')
      .orderBy('avatars.uploaded_at', 'desc')
      .orderBy('avatars.id', 'desc')
      .as('latest_avatars')

    const [items, countResult] = await Promise.all([
      this.db
        .selectFrom(activeUsers)
        .innerJoin(latestAvatars, 'latest_avatars.user_id', 'active_users.id')
        .selectAll('active_users')
        .select([
          'latest_avatars.avatar_id',
          'latest_avatars.avatar_filename',
          'latest_avatars.avatar_object_key',
          'latest_avatars.avatar_uploaded_at',
        ])
        .offset((page - 1) * limit)
        .limit(limit)
        .execute(),

      this.db
        .selectFrom(activeUsers)
        .select((eb) => eb.fn.countAll().as('total'))
        .executeTakeFirstOrThrow(),
    ])

    return {
      items,
      total: Number(countResult.total),
      page,
      limit,
    }
  }

  async transfer(transfer: TransferDto, senderId: number) {
    if (transfer.recipientId === senderId) {
      throw new BadRequestException('You cannot send money yourself')
    }

    const arr = [senderId, transfer.recipientId].sort((a, b) => a - b)

    return await this.db.transaction().execute(async (trx) => {
      const users = await trx
        .selectFrom('users')
        .select(['id', 'balance'])
        .where('deleted_at', 'is', null)
        .where('id', 'in', arr)
        .forUpdate()
        .execute()

      if (users.length !== 2) {
        throw new NotFoundException('Sender or recipient not found')
      }

      const sender = users.find((user) => user.id === senderId)
      const recipient = users.find((user) => user.id === transfer.recipientId)

      if (sender === undefined || recipient === undefined) {
        throw new NotFoundException('Sender or recipient not found')
      }

      const insufficientFunds = await trx
        .selectFrom('users')
        .select('id')
        .where('id', '=', senderId)
        .where('balance', '<', transfer.amount)
        .executeTakeFirst()

      if (insufficientFunds) {
        throw new BadRequestException('Insufficient funds')
      }

      const senderTransaction = await trx
        .updateTable('users')
        .where('deleted_at', 'is', null)
        .where('id', '=', senderId)
        .set({
          balance: sql`balance - ${transfer.amount}`,
        })
        .returning(['id', 'balance'])
        .executeTakeFirstOrThrow()

      const recipientTransaction = await trx
        .updateTable('users')
        .where('deleted_at', 'is', null)
        .where('id', '=', transfer.recipientId)
        .set({
          balance: sql`balance + ${transfer.amount}`,
        })
        .returning(['id', 'balance'])
        .executeTakeFirstOrThrow()

      return { sender: senderTransaction, recipient: recipientTransaction }
    })
  }

  async resetAllUsersBalances() {
    return await this.db
      .updateTable('users')
      .where('deleted_at', 'is', null)
      .set({
        balance: '0',
      })
      .returning(['id', 'balance'])
      .execute()
  }
}
