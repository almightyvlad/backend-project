import { Inject, Injectable } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import { PinoLogger } from 'nestjs-pino'
import { avatarCleanupConfig } from '../configs/avatar-cleanup.config.js'
import { AvatarDeletionService } from '../queues/avatar-deletion/avatar-deletion.service.js'
import { AvatarsRepository } from './avatars.repository.js'

@Injectable()
export class AvatarCleanupService {
  constructor(
    private readonly avatarsRepository: AvatarsRepository,
    private readonly avatarDeletionService: AvatarDeletionService,
    private readonly logger: PinoLogger,
    @Inject(avatarCleanupConfig.KEY)
    private readonly config: ConfigType<typeof avatarCleanupConfig>,
  ) {
    this.logger.setContext(AvatarCleanupService.name)
  }

  async queueExpiredDeleted() {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - this.config.retentionDays)

    const avatars = await this.avatarsRepository.findExpiredDeleted(cutoff)
    for (const avatar of avatars) {
      await this.avatarDeletionService.add(avatar.id, avatar.object_key)
    }

    this.logger.info({ count: avatars.length }, 'Avatar cleanup jobs queued')
    return { queued: avatars.length }
  }
}
