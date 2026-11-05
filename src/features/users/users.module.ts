import { forwardRef, Module } from '@nestjs/common'
import { UsersController } from './users.controller.js'
import { UsersService } from './users.service.js'
import { DatabasesModule } from '../../databases/databases.module.js'
import { UsersRepository } from './users.repository.js'
import { AuthModule } from '../../auth/auth.module.js'
import { RedisModule } from '../../redis/redis.module.js'
import { AvatarsModule } from '../../avatars/avatars.module.js'

@Module({
  imports: [
    forwardRef(() => AuthModule),
    DatabasesModule,
    RedisModule,
    AvatarsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersRepository, UsersService],
})
export class UsersModule {}
