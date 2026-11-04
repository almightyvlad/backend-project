import { Test, TestingModule } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AvatarsService } from '../../avatars/avatars.service.js'
import { AvatarDeletionService } from '../../queues/avatar-deletion/avatar-deletion.service.js'
import { AvatarCleanupCron } from './avatar-cleanup.cron.js'

describe('AvatarCleanupCron', () => {
  let cron: AvatarCleanupCron
  let avatarsService: AvatarsService
  let avatarDeletionService: AvatarDeletionService

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-03T12:00:00'))

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarCleanupCron,
        {
          provide: AvatarsService,
          useValue: {
            findExpiredDeleted: vi.fn(),
          },
        },
        {
          provide: AvatarDeletionService,
          useValue: {
            add: vi.fn(),
          },
        },
      ],
    }).compile()

    cron = module.get<AvatarCleanupCron>(AvatarCleanupCron)
    avatarsService = module.get<AvatarsService>(AvatarsService)
    avatarDeletionService = module.get<AvatarDeletionService>(
      AvatarDeletionService,
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(cron).toBeDefined()
  })

  it('should add expired avatars to deletion queue', async () => {
    vi.mocked(avatarsService.findExpiredDeleted).mockResolvedValue([
      { id: 1, object_key: 'avatars/one.png' },
      { id: 2, object_key: 'avatars/two.png' },
    ] as Awaited<ReturnType<AvatarsService['findExpiredDeleted']>>)

    vi.mocked(avatarDeletionService.add).mockResolvedValue(undefined as never)

    await cron.handleCron()

    expect(avatarDeletionService.add).toHaveBeenCalledTimes(2)
    expect(avatarDeletionService.add).toHaveBeenNthCalledWith(
      1,
      1,
      'avatars/one.png',
    )
    expect(avatarDeletionService.add).toHaveBeenNthCalledWith(
      2,
      2,
      'avatars/two.png',
    )
  })

  it('should not add jobs if there are no expired avatars', async () => {
    vi.mocked(avatarsService.findExpiredDeleted).mockResolvedValue([])

    await cron.handleCron()

    expect(avatarDeletionService.add).not.toHaveBeenCalled()
  })

  it('should search for avatars deleted more than 30 days ago', async () => {
    vi.mocked(avatarsService.findExpiredDeleted).mockResolvedValue([])

    await cron.handleCron()

    const expectedDate = new Date('2026-10-04T12:00:00')

    expect(avatarsService.findExpiredDeleted).toHaveBeenCalledWith(expectedDate)
  })
})
