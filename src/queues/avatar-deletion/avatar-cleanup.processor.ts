import { Process, Processor } from '@nestjs/bull'
import type { Job } from 'bull'
import {
  AVATAR_CLEANUP_JOB,
  AVATAR_DELETION_QUEUE,
} from './avatar-deletion.constants.js'
import type { AvatarCleanupPayload } from './types/avatar-cleanup-payload.js'
import { Inject } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import { avatarCleanupConfig } from '../../configs/avatar-cleanup.config.js'
import { AvatarsRepository } from '../../avatars/avatars.repository.js'
import { AvatarDeletionService } from './avatar-deletion.service.js'
import { PinoLogger } from 'nestjs-pino'
import { ClsService } from 'nestjs-cls'
import { REQUEST_ID_KEY } from '../../common/request-context.js'

@Processor(AVATAR_DELETION_QUEUE)
export class AvatarCleanupProcessor {
  constructor(
    private readonly avatarsRepository: AvatarsRepository,
    private readonly avatarDeletionService: AvatarDeletionService,
    private readonly logger: PinoLogger,
    private readonly cls: ClsService,
    @Inject(avatarCleanupConfig.KEY)
    private readonly config: ConfigType<typeof avatarCleanupConfig>,
  ) {
    this.logger.setContext(AvatarCleanupProcessor.name)
  }

  @Process(AVATAR_CLEANUP_JOB)
  async process(job: Job<AvatarCleanupPayload>) {
    return this.cls.run(async () => {
      this.cls.set(REQUEST_ID_KEY, job.data.requestId)

      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - this.config.retentionDays)

      const avatars = await this.avatarsRepository.findExpiredDeleted(cutoff)

      for (const avatar of avatars) {
        await this.avatarDeletionService.add(
          avatar.id,
          avatar.object_key,
          job.data.requestId,
        )
      }

      this.logger.info(
        { count: avatars.length, jobId: job.id },
        'Avatar cleanup jobs queued',
      )

      return { queued: avatars.length }
    })
  }
}
