import { forwardRef, Module } from '@nestjs/common'
import { UsersController } from './users.controller.js'
import { UsersService } from './users.service.js'
import { DatabasesModule } from '../../databases/databases.module.js'
import { UsersRepository } from './users.repository.js'
import { AuthModule } from '../../auth/auth.module.js'

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  imports: [forwardRef(() => AuthModule), DatabasesModule],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
