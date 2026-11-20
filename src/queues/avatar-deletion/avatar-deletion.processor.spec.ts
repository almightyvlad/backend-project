import { Test, TestingModule } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StorageService } from '../../storage/storage.service.js'
import { AvatarDeletionProcessor } from './avatar-deletion.processor.js'
import type { AvatarDeletionPayload } from './types/avatar-deletion-payload.js'
import type { Job } from 'bull'
import { AvatarDeletionRepository } from './avatar-deletion.repository.js'
import { PinoLogger } from 'nestjs-pino'
import { ClsService } from 'nestjs-cls'
import { AvatarsRepository } from '../../avatars/avatars.repository.js'
import { AvatarDeletionService } from './avatar-deletion.service.js'
import { avatarCleanupConfig } from '../../configs/avatar-cleanup.config.js'
import type { AvatarCleanupPayload } from './types/avatar-cleanup-payload.js'

describe('AvatarDeletionProcessor', () => {
  let processor: AvatarDeletionProcessor
  let avatarDeletionRepository: AvatarDeletionRepository
  let avatarsRepository: AvatarsRepository
  let avatarDeletionService: AvatarDeletionService
  let cls: ClsService

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
          provide: AvatarsRepository,
          useValue: { findExpiredDeleted: vi.fn() },
        },
        {
          provide: AvatarDeletionService,
          useValue: { add: vi.fn() },
        },
        {
          provide: avatarCleanupConfig.KEY,
          useValue: { retentionDays: 7 },
        },
        {
          provide: PinoLogger,
          useValue: { setContext: vi.fn(), info: vi.fn(), error: vi.fn() },
        },
        {
          provide: ClsService,
          useValue: {
            run: vi.fn(async (fn: () => Promise<void>) => fn()),
            set: vi.fn(),
          },
        },
      ],
    }).compile()

    processor = module.get<AvatarDeletionProcessor>(AvatarDeletionProcessor)
    avatarDeletionRepository = module.get<AvatarDeletionRepository>(
      AvatarDeletionRepository,
    )
    avatarsRepository = module.get<AvatarsRepository>(AvatarsRepository)
    avatarDeletionService = module.get<AvatarDeletionService>(
      AvatarDeletionService,
    )
    cls = module.get<ClsService>(ClsService)
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
        requestId: 'req-1',
      },
    } as Job<AvatarDeletionPayload>

    await processor.process(job)

    expect(cls.set).toHaveBeenCalledWith('requestId', 'req-1')
    expect(deleteFile).toHaveBeenCalledWith('avatars/test.png')
    expect(deleteFile).toHaveBeenCalledOnce()
    expect(avatarDeletionRepository.hardDelete).toHaveBeenCalledWith(
      1,
      'avatars/test.png',
    )
  })

  it('should skip database delete for orphan files', async () => {
    const deleteFile = vi.mocked(processor['storageService'].deleteFile)
    deleteFile.mockResolvedValue(undefined)

    const job = {
      data: {
        objectKey: 'avatars/orphan.png',
        requestId: 'req-1',
      },
    } as Job<AvatarDeletionPayload>

    await processor.process(job)

    expect(deleteFile).toHaveBeenCalledWith('avatars/orphan.png')
    expect(avatarDeletionRepository.hardDelete).not.toHaveBeenCalled()
  })

  it('should throw error if storage deletion fails', async () => {
    const error = new Error('MinIO deletion failed')

    const deleteFile = vi.mocked(processor['storageService'].deleteFile)

    deleteFile.mockRejectedValue(error)

    const job = {
      data: {
        id: 1,
        objectKey: 'avatars/test.png',
        requestId: 'req-1',
      },
    } as Job<AvatarDeletionPayload>

    await expect(processor.process(job)).rejects.toThrow(error)
    expect(avatarDeletionRepository.hardDelete).not.toHaveBeenCalled()
  })

  it('should enqueue a deletion job for each expired avatar', async () => {
    vi.mocked(avatarsRepository.findExpiredDeleted).mockResolvedValue([
      { id: 1, object_key: 'a.png' },
      { id: 2, object_key: 'b.png' },
    ] as never)

    const job = {
      id: 'cleanup-1',
      data: { requestId: 'req-1' },
    } as Job<AvatarCleanupPayload>

    const result = await processor.processCleanup(job)

    expect(cls.set).toHaveBeenCalledWith('requestId', 'req-1')
    expect(avatarDeletionService.add).toHaveBeenNthCalledWith(
      1,
      1,
      'a.png',
      'req-1',
    )
    expect(avatarDeletionService.add).toHaveBeenNthCalledWith(
      2,
      2,
      'b.png',
      'req-1',
    )
    expect(result).toEqual({ queued: 2 })
  })
})
