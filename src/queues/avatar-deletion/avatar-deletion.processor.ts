import { Process, Processor } from '@nestjs/bull'
import type { Job } from 'bull'
import {
  AVATAR_DELETION_JOB,
  AVATAR_DELETION_QUEUE,
} from './avatar-deletion.constants.js'
import type { AvatarDeletionPayload } from './types/avatar-deletion-payload.js'
import { StorageService } from '../../storage/storage.service.js'
import { AvatarDeletionRepository } from './avatar-deletion.repository.js'
import { PinoLogger } from 'nestjs-pino'

@Processor(AVATAR_DELETION_QUEUE)
export class AvatarDeletionProcessor {
  constructor(
    private readonly storageService: StorageService,
    private readonly avatarDeletionRepository: AvatarDeletionRepository,
    private readonly logger: PinoLogger,
  ) {}

  @Process(AVATAR_DELETION_JOB)
  async process(job: Job<AvatarDeletionPayload>) {
    this.logger.info(
      { jobId: job.id, avatarId: job.data.id },
      'Avatar cleanup started',
    )
    try {
      await this.storageService.deleteFile(job.data.objectKey)
      await this.avatarDeletionRepository.hardDelete(
        job.data.id,
        job.data.objectKey,
      )
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
  }
}
