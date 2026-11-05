import { Test, TestingModule } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StorageService } from '../../storage/storage.service.js'
import { AvatarDeletionProcessor } from './avatar-deletion.processor.js'
import type { AvatarDeletionPayload } from './types/avatar-deletion-payload.js'
import type { Job } from 'bull'
import { AvatarDeletionRepository } from './avatar-deletion.repository.js'
import { PinoLogger } from 'nestjs-pino'

describe('AvatarDeletionProcessor', () => {
  let processor: AvatarDeletionProcessor
  let avatarDeletionRepository: AvatarDeletionRepository

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AvatarDeletionRepository,
          useValue: { hardDelete: vi.fn() },
        },
        AvatarDeletionProcessor,
        {
          provide: StorageService,
          useValue: {
            deleteFile: vi.fn(),
          },
        },
        {
          provide: PinoLogger,
          useValue: { info: vi.fn(), error: vi.fn() },
        },
      ],
    }).compile()

    processor = module.get<AvatarDeletionProcessor>(AvatarDeletionProcessor)
    avatarDeletionRepository = module.get<AvatarDeletionRepository>(
      AvatarDeletionRepository,
    )
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(processor).toBeDefined()
  })

  it('should delete avatar from storage', async () => {
    const deleteFile = vi.mocked(processor['storageService'].deleteFile)

    deleteFile.mockResolvedValue(undefined)

    const job = {
      data: {
        id: 1,
        objectKey: 'avatars/test.png',
      },
    } as Job<AvatarDeletionPayload>

    await processor.process(job)

    expect(deleteFile).toHaveBeenCalledWith('avatars/test.png')
    expect(deleteFile).toHaveBeenCalledOnce()
    expect(avatarDeletionRepository.hardDelete).toHaveBeenCalledWith(
      1,
      'avatars/test.png',
    )
  })

  it('should throw error if storage deletion fails', async () => {
    const error = new Error('MinIO deletion failed')

    const deleteFile = vi.mocked(processor['storageService'].deleteFile)

    deleteFile.mockRejectedValue(error)

    const job = {
      data: {
        id: 1,
        objectKey: 'avatars/test.png',
      },
    } as Job<AvatarDeletionPayload>

    await expect(processor.process(job)).rejects.toThrow(error)
    expect(avatarDeletionRepository.hardDelete).not.toHaveBeenCalled()
  })
})
