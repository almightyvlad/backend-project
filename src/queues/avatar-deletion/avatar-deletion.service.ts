import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import {
  AVATAR_CLEANUP_JOB,
  AVATAR_DELETION_JOB,
  AVATAR_DELETION_QUEUE,
} from './avatar-deletion.constants.js'
import type { JobOptions, Queue } from 'bull'
import type { AvatarDeletionPayload } from './types/avatar-deletion-payload.js'
import type { AvatarCleanupPayload } from './types/avatar-cleanup-payload.js'
import { ClsService } from 'nestjs-cls'
import { randomUUID } from 'crypto'
import { REQUEST_ID_KEY } from '../../common/request-context.js'

const defaultJobOptions: JobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: true,
  removeOnFail: false,
}

@Injectable()
export class AvatarDeletionService {
  constructor(
    @InjectQueue(AVATAR_DELETION_QUEUE)
    private readonly deletionQueue: Queue,
    private readonly cls: ClsService,
  ) {}

  currentRequestId() {
    if (this.cls.isActive()) {
      const requestId = this.cls.get<string | undefined>(REQUEST_ID_KEY)
      if (requestId) {
        return requestId
      }
    }

    return randomUUID()
  }

  add(
    id: number | undefined,
    objectKey: string,
    requestId = this.currentRequestId(),
  ) {
    const payload: AvatarDeletionPayload = {
      ...(id !== undefined && { id }),
      objectKey,
      requestId,
    }

    return this.deletionQueue.add(
      AVATAR_DELETION_JOB,
      payload,
      defaultJobOptions,
    )
  }

  addCleanup(requestId = this.currentRequestId()) {
    const payload: AvatarCleanupPayload = { requestId }

    return this.deletionQueue.add(
      AVATAR_CLEANUP_JOB,
      payload,
      defaultJobOptions,
    )
  }
}
