import { OnModuleInit } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { Inject } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import { avatarCleanupConfig } from '../../configs/avatar-cleanup.config.js'
import { AvatarCleanupService } from '../../avatars/avatar-cleanup.service.js'
import { Injectable } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { ClsService } from 'nestjs-cls'
import { randomUUID } from 'crypto'
import { REQUEST_ID_KEY } from '@app/common'

@Injectable()
export class AvatarCleanupCron implements OnModuleInit {
  constructor(
    private readonly avatarCleanupService: AvatarCleanupService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly logger: PinoLogger,
    private readonly cls: ClsService,
    @Inject(avatarCleanupConfig.KEY)
    private readonly config: ConfigType<typeof avatarCleanupConfig>,
  ) {
    this.logger.setContext(AvatarCleanupCron.name)
  }

  onModuleInit() {
    const job = new CronJob(this.config.cron, () => {
      void this.handleCron()
    })
    this.schedulerRegistry.addCronJob('avatar-cleanup', job)
    job.start()
  }

  async handleCron() {
    try {
      await this.cls.run(async () => {
        this.cls.set(REQUEST_ID_KEY, randomUUID())
        await this.avatarCleanupService.enqueueCleanup()
        this.logger.info('Avatar cleanup queued')
      })
    } catch (error) {
      this.logger.error({ err: error }, 'Avatar cleanup cron failed')
    }
  }
}
