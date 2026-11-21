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
import {
  isCachedUser,
  isCachedUsersPage,
  userCacheKey,
  usersListCacheKey,
} from './users.cache.js'
import { KafkaService } from '../../kafka/kafka.service.js'
import { TransferNotification } from '@app/common'
import { randomUUID } from 'crypto'

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly tokensService: TokensService,
    private readonly redisService: RedisService,
    private readonly logger: PinoLogger,
    private readonly kafkaService: KafkaService,
  ) {
    this.logger.setContext(UsersService.name)
  }

  async getUsers(page: number, limit: number, login?: string) {
    const key = usersListCacheKey(page, limit, login)
    const cached = await this.redisService.getJson(key, isCachedUsersPage)

    if (cached !== null) {
      return cached
    }

    const users = await this.repository.getUsers(page, limit, login)

    await this.redisService.setJson(key, users)

    return users
  }

  async createUser(user: CreateUserDto) {
    const createdUser = await this.repository.createUser({
      ...user,
      password: await hashPassword(user.password),
    })

    await this.redisService.delPattern('users:*')
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
    const key = userCacheKey(id)
    const cached = await this.redisService.getJson(key, isCachedUser)

    if (cached !== null) {
      return cached
    }

    const user = await this.repository.findById(id)

    if (!user) {
      throw new NotFoundException('User not found')
    }

    await this.redisService.setJson(key, user)

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

    const result = await this.repository.updateUser(
      currentUserId,
      updatedUser,
      passwordChanged,
    )
    await this.redisService.del(userCacheKey(currentUserId))
    await this.redisService.delPattern('users:*')
    return result
  }

  async softDeleteUser(currentUserId: number) {
    await this.findById(currentUserId)

    const deletedUser = await this.repository.softDeleteUser(currentUserId)

    if (!deletedUser) {
      throw new NotFoundException('User not found')
    }

    await this.redisService.del(userCacheKey(currentUserId))
    await this.redisService.delPattern('users:*')
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
    const result = await this.repository.transfer(transfer, senderId)

    const event: TransferNotification = {
      eventId: randomUUID(),
      fromUserId: String(senderId),
      toUserId: String(transfer.recipientId),
      amount: transfer.amount,
      occurredAt: new Date().toISOString(),
    }

    this.kafkaService.publishTransfer(event).subscribe({
      error: (error: unknown) => {
        this.logger.error(
          {
            error,
            senderId,
            recipientId: transfer.recipientId,
          },
          'Failed to publish transfer event',
        )
      },
    })

    this.logger.info(
      {
        senderId,
        recipientId: transfer.recipientId,
        amount: transfer.amount,
      },
      'Balance transfer completed',
    )
    return result
  }
}
