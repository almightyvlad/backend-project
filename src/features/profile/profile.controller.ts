import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '../../auth/auth.guard.js'
import type { Request } from 'express'
import { UsersService } from '../users/users.service.js'
import type { AuthenticatedRequest } from '../../auth/types/authenticated-request.js'

@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Get('my')
  async getUserProfile(@Req() request: AuthenticatedRequest) {
    const sub = request.user.sub
    const profile = await this.usersService.findById(sub)

    return profile
  }
}
