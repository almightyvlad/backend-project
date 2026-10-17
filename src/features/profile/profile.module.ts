import { Module } from '@nestjs/common'
import { ProfileController } from './profile.controller.js'
import { ProfileService } from './profile.service.js'
import { AuthModule } from '../../auth/auth.module.js'
import { AuthGuard } from '../../auth/auth.guard.js'
import { UsersModule } from '../users/users.module.js'

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [ProfileController],
  providers: [ProfileService, AuthGuard],
})
export class ProfileModule {}
