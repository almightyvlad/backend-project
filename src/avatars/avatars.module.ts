import { Module } from '@nestjs/common'
import { StorageModule } from '../storage/storage.module.js'
import { AvatarsController } from './avatars.controller.js'
import { AvatarsService } from './avatars.service.js'
import { AvatarsRepository } from './avatars.repository.js'
import { DatabasesModule } from '../databases/databases.module.js'
import { QueuesModule } from '../queues/queues.module.js'

@Module({
  imports: [StorageModule, DatabasesModule, QueuesModule],
  controllers: [AvatarsController],
  providers: [AvatarsService, AvatarsRepository],
  exports: [AvatarsService, AvatarsRepository],
})
export class AvatarsModule {}
