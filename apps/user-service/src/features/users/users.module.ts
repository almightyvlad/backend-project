import { Module } from '@nestjs/common'
import { UsersController } from './users.controller.js'
import { UsersService } from './users.service.js'
import { DatabasesModule } from '../../databases/databases.module.js'
import { UsersRepository } from './users.repository.js'
import { RedisModule } from '../../redis/redis.module.js'
import { TokensModule } from '../../auth/tokens.module.js'
import { KafkaModule } from '../../kafka/kafka.module.js'

@Module({
  imports: [TokensModule, DatabasesModule, RedisModule, KafkaModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersRepository, UsersService],
})
export class UsersModule { }
