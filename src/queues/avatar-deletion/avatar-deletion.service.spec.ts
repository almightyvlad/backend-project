import { Test, TestingModule } from '@nestjs/testing'
import { getQueueToken } from '@nestjs/bull'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AvatarDeletionService } from './avatar-deletion.service.js'
import {
  AVATAR_DELETION_JOB,
  AVATAR_DELETION_QUEUE,
} from './avatar-deletion.constants.js'

describe('AvatarDeletionService', () => {
  let service: AvatarDeletionService

  const queueMock = {
    add: vi.fn(),
  }

  beforeEach(async () => {
    vi.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarDeletionService,
        {
          provide: getQueueToken(AVATAR_DELETION_QUEUE),
          useValue: queueMock,
        },
      ],
    }).compile()

    service = module.get<AvatarDeletionService>(AvatarDeletionService)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should add avatar deletion job to queue', async () => {
    queueMock.add.mockResolvedValue({ id: '1' })

    await service.add(1, 'avatars/test.png')

    expect(queueMock.add).toHaveBeenCalledWith(
      AVATAR_DELETION_JOB,
      {
        id: 1,
        objectKey: 'avatars/test.png',
      },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    )
  })

  it('should return the result of queue.add', async () => {
    const job = { id: '1' }
    queueMock.add.mockResolvedValue(job)

    const result = await service.add(1, 'avatars/test.png')

    expect(result).toBe(job)
  })
})
