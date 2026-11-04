import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import {
  AVATAR_DELETION_JOB,
  AVATAR_DELETION_QUEUE,
} from './avatar-deletion.constants.js'
import type { JobOptions, Queue } from 'bull'

@Injectable()
export class AvatarDeletionService {
  constructor(
    @InjectQueue(AVATAR_DELETION_QUEUE)
    private readonly deletionQueue: Queue,
  ) {}

  add(id: number, objectKey: string) {
    const options: JobOptions = {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }

    return this.deletionQueue.add(
      AVATAR_DELETION_JOB,
      {
        id,
        objectKey,
      },
      options,
    )
  }
}
