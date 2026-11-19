import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { AvatarsRepository } from './avatars.repository.js'
import { StorageService } from '../storage/storage.service.js'
import { randomUUID } from 'crypto'
import { PinoLogger } from 'nestjs-pino'
import { fileTypeFromBuffer } from 'file-type'
import { isAllowedAvatarMimeType } from './avatars.constants.js'
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
    const fileType = await fileTypeFromBuffer(file.buffer)
    if (!fileType || !isAllowedAvatarMimeType(fileType.mime)) {
      throw new BadRequestException('Only JPEG and PNG files are allowed')
    }

    const objectKey = randomUUID()
    await this.storageService.uploadFile(file, objectKey)

    let avatar
    try {
      avatar = await this.avatarsRepository.createWithLimit({
        user_id: userId,
        filename: file.originalname,
        object_key: objectKey,
      })
    } catch (error) {
      await this.compensateOrphanFile(objectKey)
      throw error
    }

    if (!avatar) {
      await this.compensateOrphanFile(objectKey)
      throw new ConflictException('User has 5 or more avatars')
    }

    this.logger.info({ userId, avatarId: avatar.id }, 'Avatar uploaded')
    return avatar
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

    this.logger.info({ userId, avatarId: id }, 'Avatar deleted')

    return deletedAvatar
  }

  private async compensateOrphanFile(objectKey: string) {
    try {
      await this.storageService.deleteFile(objectKey)
    } catch (cleanupError) {
      this.logger.error(
        { err: cleanupError, objectKey },
        'Avatar cleanup failed',
      )
      await this.avatarDeletionService.add(undefined, objectKey)
    }
  }
}
