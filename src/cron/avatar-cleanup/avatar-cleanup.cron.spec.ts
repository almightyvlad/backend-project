import { Test, TestingModule } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AvatarCleanupService } from '../../avatars/avatar-cleanup.service.js'
import { AvatarCleanupCron } from './avatar-cleanup.cron.js'
import { SchedulerRegistry } from '@nestjs/schedule'
import { avatarCleanupConfig } from '../../configs/avatar-cleanup.config.js'

describe('AvatarCleanupCron', () => {
  let cron: AvatarCleanupCron
  let avatarCleanupService: AvatarCleanupService
  let schedulerRegistry: SchedulerRegistry

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-03T12:00:00'))

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarCleanupCron,
        {
          provide: AvatarCleanupService,
          useValue: {
            queueExpiredDeleted: vi.fn(),
          },
        },
        {
          provide: SchedulerRegistry,
          useValue: { addCronJob: vi.fn() },
        },
        {
          provide: avatarCleanupConfig.KEY,
          useValue: { cron: '0 3 * * *', retentionDays: 7 },
        },
      ],
    }).compile()

    cron = module.get<AvatarCleanupCron>(AvatarCleanupCron)
    avatarCleanupService =
      module.get<AvatarCleanupService>(AvatarCleanupService)
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(cron).toBeDefined()
  })

  it('should queue cleanup through the avatar service', async () => {
    await cron.handleCron()
    expect(avatarCleanupService.queueExpiredDeleted).toHaveBeenCalledOnce()
  })

  it('should not scan or queue separately from the service', async () => {
    await cron.handleCron()
    expect(avatarCleanupService.queueExpiredDeleted).toHaveBeenCalledOnce()
  })

  it('registers the configured schedule on module initialization', () => {
    cron.onModuleInit()
    expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith(
      'avatar-cleanup',
      expect.any(Object),
    )
  })
})
