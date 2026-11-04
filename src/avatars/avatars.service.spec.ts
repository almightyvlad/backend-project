import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { AvatarsService } from './avatars.service.js'
import { AvatarsRepository } from './avatars.repository.js'
import { StorageService } from '../storage/storage.service.js'
import { AvatarDeletionService } from '../queues/avatar-deletion/avatar-deletion.service.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('AvatarsService', () => {
  let service: AvatarsService
  let avatarsRepository: AvatarsRepository
  let storageService: StorageService
  let logger: PinoLogger
  let avatarDeletionService: AvatarDeletionService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarsService,
        {
          provide: AvatarsRepository,
          useValue: {
            countActiveByUserId: vi.fn(),
            create: vi.fn(),
            findActiveById: vi.fn(),
            softDelete: vi.fn(),
            softDeleteAllByUserId: vi.fn(),
            findExpiredDeleted: vi.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            uploadFile: vi.fn(),
            deleteFile: vi.fn(),
          },
        },
        {
          provide: PinoLogger,
          useValue: {
            setContext: vi.fn(),
            info: vi.fn(),
            error: vi.fn(),
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

    service = module.get<AvatarsService>(AvatarsService)
    avatarsRepository = module.get<AvatarsRepository>(AvatarsRepository)
    storageService = module.get<StorageService>(StorageService)
    logger = module.get<PinoLogger>(PinoLogger)
    avatarDeletionService = module.get<AvatarDeletionService>(
      AvatarDeletionService,
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('uploadAvatar', () => {
    const userId = 1
    const file = {
      originalname: 'avatar.png',
      buffer: Buffer.from('test'),
      mimetype: 'image/png',
    } as Express.Multer.File

    it('should upload avatar and save it in repository', async () => {
      vi.mocked(avatarsRepository.countActiveByUserId).mockResolvedValue(2)
      vi.mocked(avatarsRepository.create).mockResolvedValue({
        id: 10,
        user_id: userId,
        filename: file.originalname,
        object_key: 'test-key',
      } as never)

      await service.uploadAvatar(userId, file)

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        file,
        expect.any(String),
      )
      expect(avatarsRepository.create).toHaveBeenCalledWith({
        user_id: userId,
        filename: file.originalname,
        object_key: expect.any(String),
      })
      expect(logger.info).toHaveBeenCalled()
    })

    it('should throw ConflictException when user has 5 avatars', async () => {
      vi.mocked(avatarsRepository.countActiveByUserId).mockResolvedValue(5)

      await expect(service.uploadAvatar(userId, file)).rejects.toThrow(
        ConflictException,
      )

      expect(storageService.uploadFile).not.toHaveBeenCalled()
      expect(avatarsRepository.create).not.toHaveBeenCalled()
    })

    it('should delete uploaded file when repository create fails', async () => {
      const error = new Error('Database error')

      vi.mocked(avatarsRepository.countActiveByUserId).mockResolvedValue(0)
      vi.mocked(avatarsRepository.create).mockRejectedValue(error)

      await expect(service.uploadAvatar(userId, file)).rejects.toThrow(error)

      expect(storageService.uploadFile).toHaveBeenCalled()
      expect(storageService.deleteFile).toHaveBeenCalledWith(expect.any(String))
      expect(logger.error).toHaveBeenCalled()
    })

    it('should log cleanup error when deleting uploaded file fails', async () => {
      const error = new Error('Database error')

      vi.mocked(avatarsRepository.countActiveByUserId).mockResolvedValue(0)
      vi.mocked(avatarsRepository.create).mockRejectedValue(error)
      vi.mocked(storageService.deleteFile).mockRejectedValue(
        new Error('MinIO error'),
      )

      await expect(service.uploadAvatar(userId, file)).rejects.toThrow(error)

      expect(logger.error).toHaveBeenCalledTimes(2)
    })
  })

  describe('deleteAvatar', () => {
    const avatar = {
      id: 10,
      object_key: 'avatar-key',
    }

    it('should soft delete avatar and add deletion job', async () => {
      vi.mocked(avatarsRepository.findActiveById).mockResolvedValue(
        avatar as never,
      )
      vi.mocked(avatarsRepository.softDelete).mockResolvedValue(avatar as never)

      await service.deleteAvatar(avatar.id, 1)

      expect(avatarsRepository.softDelete).toHaveBeenCalledWith(avatar.id, 1)
      expect(avatarDeletionService.add).toHaveBeenCalledWith(
        avatar.id,
        avatar.object_key,
      )
      expect(logger.info).toHaveBeenCalled()
    })

    it('should throw NotFoundException when avatar does not exist', async () => {
      vi.mocked(avatarsRepository.findActiveById).mockResolvedValue(
        undefined as never,
      )

      await expect(service.deleteAvatar(avatar.id, 1)).rejects.toThrow(
        NotFoundException,
      )

      expect(avatarsRepository.softDelete).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when soft delete returns nothing', async () => {
      vi.mocked(avatarsRepository.findActiveById).mockResolvedValue(
        avatar as never,
      )
      vi.mocked(avatarsRepository.softDelete).mockResolvedValue(
        undefined as never,
      )

      await expect(service.deleteAvatar(avatar.id, 1)).rejects.toThrow(
        NotFoundException,
      )

      expect(avatarDeletionService.add).not.toHaveBeenCalled()
    })
  })

  describe('deleteAllByUserId', () => {
    it('should delete all avatars and add deletion jobs', async () => {
      const avatars = [
        { id: 1, object_key: 'key-1' },
        { id: 2, object_key: 'key-2' },
      ]

      vi.mocked(avatarsRepository.softDeleteAllByUserId).mockResolvedValue(
        avatars as never,
      )

      const result = await service.deleteAllByUserId(1)

      expect(result).toBe(2)
      expect(avatarDeletionService.add).toHaveBeenCalledTimes(2)
      expect(avatarDeletionService.add).toHaveBeenCalledWith(1, 'key-1')
      expect(avatarDeletionService.add).toHaveBeenCalledWith(2, 'key-2')
    })

    it('should return 0 when user has no avatars', async () => {
      vi.mocked(avatarsRepository.softDeleteAllByUserId).mockResolvedValue([])

      const result = await service.deleteAllByUserId(1)

      expect(result).toBe(0)
      expect(avatarDeletionService.add).not.toHaveBeenCalled()
    })
  })

  describe('findExpiredDeleted', () => {
    it('should return expired deleted avatars from repository', async () => {
      const date = new Date()
      const avatars = [{ id: 1, object_key: 'key-1' }]

      vi.mocked(avatarsRepository.findExpiredDeleted).mockResolvedValue(
        avatars as never,
      )

      const result = await service.findExpiredDeleted(date)

      expect(avatarsRepository.findExpiredDeleted).toHaveBeenCalledWith(date)
      expect(result).toEqual(avatars)
    })
  })
})
