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


@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly tokensService: TokensService
  ) { }

  async getUsers(page: number, limit: number, login?: string) {
    return this.repository.getUsers(page, limit, login)
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
    const user = await this.repository.findById(id)

    if (!user) {
      throw new NotFoundException('User not found')
    }

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

    return this.repository.updateUser(currentUserId, updatedUser, passwordChanged)
  }

  async softDeleteUser(currentUserId: number) {
    await this.findById(currentUserId)

    await this.repository.softDeleteUser(currentUserId)

    return { message: 'User deleted successfully' }
  }
}
