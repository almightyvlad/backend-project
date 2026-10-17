import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import type { CreateUserDto } from './dto/create-user.dto/create-user.dto.js'
import bcrypt from 'bcrypt'
import { LoginDto } from '../../auth/dto/login.dto.js'
import { UsersRepository } from './users.repository.js'
import { UpdateUserDto } from './dto/update-user.dto/update-user.dto.js'

@Injectable()
export class UsersService {
  constructor(private repository: UsersRepository) {}

  async searchUserByLogin(login: string, page: number, limit: number) {
    return await this.repository.searchByLogin(login, page, limit)
  }

  async getUsers(page: number, limit: number, login?: string) {
    if (login) {
      return await this.searchUserByLogin(login, page, limit)
    }

    return await this.repository.getUsers(page, limit)
  }

  async createUser(user: CreateUserDto) {
    try {
      const userWithHash = {
        ...user,
        password: await bcrypt.hash(user.password, 10),
      }

      return await this.repository.createUser(userWithHash)
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        if (error.code === '23505') {
          throw new ConflictException('Login or email already exists')
        }
      }

      throw error
    }
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

  async updateUser(id: number, user: UpdateUserDto, currentUserId: number) {
    try {
      await this.findById(id)

      if (id !== currentUserId) {
        throw new ForbiddenException('You can only update your own profile')
      }

      const updatedUser = { ...user }

      if (user.password) {
        updatedUser.password = await bcrypt.hash(user.password, 10)
      }

      return await this.repository.updateUser(id, updatedUser)
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        if (error.code === '23505') {
          throw new ConflictException('Login or email already exists')
        }
      }

      throw error
    }
  }

  async softDeleteUser(id: number, currentUserId: number) {
    await this.findById(id)

    if (id !== currentUserId) {
      throw new ForbiddenException('You can only delete your own profile')
    }

    await this.repository.softDeleteUser(id)

    return { message: 'User deleted successfully' }
  }
}
