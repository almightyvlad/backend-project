import { Process, Processor } from '@nestjs/bull'
import type { Job } from 'bull'
import {
  AVATAR_DELETION_JOB,
  AVATAR_DELETION_QUEUE,
} from './avatar-deletion.constants.js'
import type { AvatarDeletionPayload } from './types/avatar-deletion-payload.js'
import { StorageService } from '../../storage/storage.service.js'

@Processor(AVATAR_DELETION_QUEUE)
export class AvatarDeletionProcessor {
  constructor(private readonly storageService: StorageService) {}

  @Process(AVATAR_DELETION_JOB)
  async process(job: Job<AvatarDeletionPayload>) {
    await this.storageService.deleteFile(job.data.objectKey)
  }
}
