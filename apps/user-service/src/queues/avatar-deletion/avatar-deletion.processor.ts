import { Process, Processor } from '@nestjs/bull'
import type { Job } from 'bull'
import {
  AVATAR_CLEANUP_JOB,
  AVATAR_DELETION_JOB,
  AVATAR_DELETION_QUEUE,
} from './avatar-deletion.constants.js'
import type { AvatarDeletionPayload } from './types/avatar-deletion-payload.js'
import type { AvatarCleanupPayload } from './types/avatar-cleanup-payload.js'
import { StorageService } from '../../storage/storage.service.js'
import { AvatarDeletionRepository } from './avatar-deletion.repository.js'
import { PinoLogger } from 'nestjs-pino'
import { ClsService } from 'nestjs-cls'
import { REQUEST_ID_KEY } from '@app/common'
import { Inject } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import { avatarCleanupConfig } from '../../configs/avatar-cleanup.config.js'
import { AvatarsRepository } from '../../avatars/avatars.repository.js'
import { AvatarDeletionService } from './avatar-deletion.service.js'

@Processor(AVATAR_DELETION_QUEUE)
export class AvatarDeletionProcessor {
  constructor(
    private readonly storageService: StorageService,
    private readonly avatarDeletionRepository: AvatarDeletionRepository,
    private readonly avatarsRepository: AvatarsRepository,
    private readonly avatarDeletionService: AvatarDeletionService,
    private readonly logger: PinoLogger,
    private readonly cls: ClsService,
    @Inject(avatarCleanupConfig.KEY)
    private readonly config: ConfigType<typeof avatarCleanupConfig>,
  ) {
    this.logger.setContext(AvatarDeletionProcessor.name)
  }

  @Process(AVATAR_DELETION_JOB)
  async process(job: Job<AvatarDeletionPayload>) {
    return this.cls.run(async () => {
      this.cls.set(REQUEST_ID_KEY, job.data.requestId)

      this.logger.info(
        { jobId: job.id, avatarId: job.data.id },
        'Avatar cleanup started',
      )
      try {
        await this.storageService.deleteFile(job.data.objectKey)

        if (job.data.id !== undefined) {
          await this.avatarDeletionRepository.hardDelete(
            job.data.id,
            job.data.objectKey,
          )
        }

        this.logger.info(
          { jobId: job.id, avatarId: job.data.id },
          'Avatar cleanup completed',
        )
      } catch (error) {
        this.logger.error(
          { err: error, jobId: job.id, avatarId: job.data.id },
          'Avatar cleanup failed',
        )
        throw error
      }
    })
  }

  @Process(AVATAR_CLEANUP_JOB)
  async processCleanup(job: Job<AvatarCleanupPayload>) {
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
