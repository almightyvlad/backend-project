import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { RedisService } from './redis.service.js'
import { redisConfig } from '../configs/redis.config.js'

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
