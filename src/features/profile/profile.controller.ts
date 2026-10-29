import { Controller, Get, Req } from '@nestjs/common'
import { UsersService } from '../users/users.service.js'
import type { AuthenticatedRequest } from '../../auth/types/authenticated-request.js'

@Controller('profile')
export class ProfileController {
  constructor(private readonly usersService: UsersService) { }

  @Get('my')
  async getUserProfile(@Req() request: AuthenticatedRequest) {
    const sub = request.user.sub
    const profile = await this.usersService.findById(sub)

    return profile
  }
}
