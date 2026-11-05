import { Module } from '@nestjs/common'
import { AvatarDeletionService } from './avatar-deletion/avatar-deletion.service.js'
import { BullModule } from '@nestjs/bull'
import { AVATAR_DELETION_QUEUE } from './avatar-deletion/avatar-deletion.constants.js'
import { AvatarDeletionProcessor } from './avatar-deletion/avatar-deletion.processor.js'
import { StorageModule } from '../storage/storage.module.js'
import { DatabasesModule } from '../databases/databases.module.js'
import { BALANCE_RESET_QUEUE } from './balance-reset/balance-reset.constants.js'
import { BalanceResetService } from './balance-reset/balance-reset.service.js'
import { AvatarDeletionRepository } from './avatar-deletion/avatar-deletion.repository.js'

@Module({
  imports: [
    BullModule.registerQueue({
      name: AVATAR_DELETION_QUEUE,
    }),
    BullModule.registerQueue({
      name: BALANCE_RESET_QUEUE,
    }),
    StorageModule,
    DatabasesModule,
  ],
  providers: [
    AvatarDeletionService,
    AvatarDeletionProcessor,
    AvatarDeletionRepository,
    BalanceResetService,
  ],
  exports: [AvatarDeletionService, BalanceResetService],
})
export class QueuesModule {}
