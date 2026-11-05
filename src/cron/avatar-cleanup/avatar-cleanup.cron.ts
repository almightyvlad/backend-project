import { OnModuleInit } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { Inject } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import { avatarCleanupConfig } from '../../configs/avatar-cleanup.config.js'
import { AvatarCleanupService } from '../../avatars/avatar-cleanup.service.js'
import { Injectable } from '@nestjs/common'

@Injectable()
export class AvatarCleanupCron implements OnModuleInit {
  constructor(
    private readonly avatarCleanupService: AvatarCleanupService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(avatarCleanupConfig.KEY)
    private readonly config: ConfigType<typeof avatarCleanupConfig>,
  ) {}

  onModuleInit() {
    const job = new CronJob(this.config.cron, () => void this.handleCron())
    this.schedulerRegistry.addCronJob('avatar-cleanup', job)
    job.start()
  }

  async handleCron() {
    await this.avatarCleanupService.queueExpiredDeleted()
  }
}
