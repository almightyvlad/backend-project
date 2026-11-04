import { Cron } from '@nestjs/schedule'
import { AvatarDeletionService } from '../../queues/avatar-deletion/avatar-deletion.service.js'
import { AvatarsService } from '../../avatars/avatars.service.js'
import { Injectable } from '@nestjs/common'

@Injectable()
export class AvatarCleanupCron {
  constructor(
    private readonly avatarsService: AvatarsService,
    private readonly avatarDeletionService: AvatarDeletionService,
  ) {}

  @Cron('0 3 * * *')
  async handleCron() {
    const date = new Date()

    date.setDate(date.getDate() - 30)

    const avatars = await this.avatarsService.findExpiredDeleted(date)

    for (const avatar of avatars) {
      await this.avatarDeletionService.add(avatar.id, avatar.object_key)
    }
  }
}
