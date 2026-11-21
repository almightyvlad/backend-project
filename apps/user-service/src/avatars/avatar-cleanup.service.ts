import { Injectable } from '@nestjs/common'
import { AvatarDeletionService } from '../queues/avatar-deletion/avatar-deletion.service.js'

@Injectable()
export class AvatarCleanupService {
  constructor(private readonly avatarDeletionService: AvatarDeletionService) {}

  enqueueCleanup() {
    return this.avatarDeletionService.addCleanup()
  }
}
