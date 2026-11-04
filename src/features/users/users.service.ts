import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import type { CreateUserDto } from './dto/create-user.dto.js'
import { UsersRepository } from './users.repository.js'
import { UpdateUserDto } from './dto/update-user.dto.js'
import { TokensService } from '../../auth/tokens.service.js'
import { hashPassword } from '../../auth/helpers/password.helper.js'
import { PinoLogger } from 'nestjs-pino'
import { RedisService } from '../../redis/redis.service.js'
import { TransferDto } from './dto/transfer.dto.js'
import { AvatarsService } from '../../avatars/avatars.service.js'

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly tokensService: TokensService,
    private readonly redisService: RedisService,
    private readonly logger: PinoLogger,
    private readonly avatarsService: AvatarsService,
  ) {
    this.logger.setContext(UsersService.name)
  }

  async getUsers(page: number, limit: number, login?: string) {
    const key = `users:${page}:${limit}:${login ?? 'all'}`

    const cache = await this.redisService.get(key)

    if (cache !== null) {
      return JSON.parse(cache)
    }

    const users = await this.repository.getUsers(page, limit, login)

    await this.redisService.set(key, JSON.stringify(users))

    return users
  }

  async createUser(user: CreateUserDto) {
    const createdUser = await this.repository.createUser({
      ...user,
      password: await hashPassword(user.password),
    })

    return this.tokensService.issueTokens(createdUser.id)
  }

  async findByLogin(login: string) {
    const user = await this.repository.findByLogin(login)

    if (!user) {
      throw new UnauthorizedException('Login does not exists')
    }

    return user
  }

  async findById(id: number) {
    const key = `user:${id}`

    const cache = await this.redisService.get(key)

    if (cache !== null) {
      return JSON.parse(cache)
    }

    const user = await this.repository.findById(id)

    if (!user) {
      throw new NotFoundException('User not found')
    }

    await this.redisService.set(key, JSON.stringify(user))

    return user
  }

  async updateUser(user: UpdateUserDto, currentUserId: number) {
    await this.findById(currentUserId)

    if (Object.keys(user).length === 0) {
      throw new BadRequestException('At least one field must be provided')
    }

    const updatedUser = { ...user }

    const passwordChanged = Boolean(user.password)

    if (user.password) {
      updatedUser.password = await hashPassword(user.password)
    }

    return this.repository.updateUser(
      currentUserId,
      updatedUser,
      passwordChanged,
    )
  }

  async softDeleteUser(currentUserId: number) {
    await this.findById(currentUserId)

    const deletedUser = await this.repository.softDeleteUser(currentUserId)

    if (!deletedUser) {
      throw new NotFoundException('User not found')
    }

    await this.avatarsService.deleteAllByUserId(currentUserId)
  }

  async getActiveUsers(
    minAge: number,
    maxAge: number,
    page: number,
    limit: number,
  ) {
    return await this.repository.getActiveUsers(minAge, maxAge, page, limit)
  }

  async transfer(transfer: TransferDto, senderId: number) {
    return await this.repository.transfer(transfer, senderId)
  }
}
