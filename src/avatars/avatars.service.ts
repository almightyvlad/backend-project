import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AvatarsRepository } from './avatars.repository.js'
import { StorageService } from '../storage/storage.service.js'
import { randomUUID } from 'crypto'
import { PinoLogger } from 'nestjs-pino'
import { AvatarDeletionService } from '../queues/avatar-deletion/avatar-deletion.service.js'

@Injectable()
export class AvatarsService {
  constructor(
    private readonly avatarsRepository: AvatarsRepository,
    private readonly storageService: StorageService,
    private readonly logger: PinoLogger,
    private readonly avatarDeletionService: AvatarDeletionService,
  ) {
    this.logger.setContext(AvatarsService.name)
  }

  async uploadAvatar(userId: number, file: Express.Multer.File) {
    if ((await this.avatarsRepository.countActiveByUserId(userId)) >= 5) {
      throw new ConflictException('User has 5 or more avatars')
    }

    const objectKey = randomUUID()

    await this.storageService.uploadFile(file, objectKey)

    try {
      const avatar = await this.avatarsRepository.create({
        user_id: userId,
        filename: file.originalname,
        object_key: objectKey,
      })

      this.logger.info({ userId, avatarId: avatar.id }, 'Avatar uploaded')

      return avatar
    } catch (error) {
      try {
        await this.storageService.deleteFile(objectKey)
      } catch (cleanupError) {
        this.logger.error(
          { err: cleanupError, objectKey },
          'Failed to clean up uploaded avatar',
        )
      }

      this.logger.error(
        { err: error, userId, objectKey },
        'Failed to save avatar',
      )

      throw error
    }
  }

  async deleteAvatar(id: number, userId: number) {
    const avatar = await this.avatarsRepository.findActiveById(id, userId)
    if (!avatar) {
      throw new NotFoundException('Active avatar not found')
    }

    const deletedAvatar = await this.avatarsRepository.softDelete(id, userId)

    if (!deletedAvatar) {
      throw new NotFoundException('Active avatar not found')
    }

    await this.avatarDeletionService.add(avatar.id, avatar.object_key)

    this.logger.info({ userId, avatarId: id }, 'Avatar deleted')

    return deletedAvatar
  }

  async deleteAllByUserId(userId: number) {
    const avatars = await this.avatarsRepository.softDeleteAllByUserId(userId)

    for (const avatar of avatars) {
      await this.avatarDeletionService.add(avatar.id, avatar.object_key)
      this.logger.info({ userId, avatarId: avatar.id }, 'Avatar deleted')
    }

    return avatars.length
  }

  async findExpiredDeleted(date: Date) {
    return await this.avatarsRepository.findExpiredDeleted(date)
  }
}
