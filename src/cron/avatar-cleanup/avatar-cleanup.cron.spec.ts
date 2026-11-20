import { Test, TestingModule } from '@nestjs/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AvatarCleanupService } from '../../avatars/avatar-cleanup.service.js'
import { AvatarCleanupCron } from './avatar-cleanup.cron.js'
import { SchedulerRegistry } from '@nestjs/schedule'
import { avatarCleanupConfig } from '../../configs/avatar-cleanup.config.js'
import { PinoLogger } from 'nestjs-pino'
import { ClsService } from 'nestjs-cls'

describe('AvatarCleanupCron', () => {
  let cron: AvatarCleanupCron
  let avatarCleanupService: AvatarCleanupService
  let schedulerRegistry: SchedulerRegistry
  let logger: PinoLogger

  beforeEach(async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-03T12:00:00'))

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarCleanupCron,
        {
          provide: AvatarCleanupService,
          useValue: {
            enqueueCleanup: vi.fn(),
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

    cron = module.get<AvatarCleanupCron>(AvatarCleanupCron)
    avatarCleanupService =
      module.get<AvatarCleanupService>(AvatarCleanupService)
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry)
    logger = module.get<PinoLogger>(PinoLogger)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(cron).toBeDefined()
  })

  it('should queue a single cleanup job', async () => {
    await cron.handleCron()
    expect(avatarCleanupService.enqueueCleanup).toHaveBeenCalledOnce()
  })

  it('should log cron failures instead of rejecting', async () => {
    vi.mocked(avatarCleanupService.enqueueCleanup).mockRejectedValue(
      new Error('Redis down'),
    )

    await expect(cron.handleCron()).resolves.toBeUndefined()
    expect(logger.error).toHaveBeenCalled()
  })

  it('registers the configured schedule on module initialization', () => {
    cron.onModuleInit()
    expect(schedulerRegistry.addCronJob).toHaveBeenCalledWith(
      'avatar-cleanup',
      expect.any(Object),
    )
  })
})
