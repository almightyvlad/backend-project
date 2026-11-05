import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { PinoLogger } from 'nestjs-pino'
import { AvatarsService } from './avatars.service.js'
import { AvatarsRepository } from './avatars.repository.js'
import { StorageService } from '../storage/storage.service.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('file-type', () => ({
  fileTypeFromBuffer: vi.fn().mockResolvedValue({ mime: 'image/png' }),
}))

describe('AvatarsService', () => {
  let service: AvatarsService
  let avatarsRepository: AvatarsRepository
  let storageService: StorageService
  let logger: PinoLogger

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarsService,
        {
          provide: AvatarsRepository,
          useValue: {
            createWithLimit: vi.fn(),
            findActiveById: vi.fn(),
            softDelete: vi.fn(),
            softDeleteAllByUserId: vi.fn(),
          },
        },
        {
          provide: StorageService,
          useValue: {
            uploadFile: vi.fn(),
            deleteFile: vi.fn().mockResolvedValue(undefined),
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
      ],
    }).compile()

    service = module.get<AvatarsService>(AvatarsService)
    avatarsRepository = module.get<AvatarsRepository>(AvatarsRepository)
    storageService = module.get<StorageService>(StorageService)
    logger = module.get<PinoLogger>(PinoLogger)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('uploadAvatar', () => {
    const userId = 1
    const file = {
      originalname: 'avatar.png',
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      mimetype: 'image/png',
    } as Express.Multer.File

    it('should upload avatar and save it in repository', async () => {
      vi.mocked(avatarsRepository.createWithLimit).mockImplementation(
        async () => {
          return {
            id: 10,
            user_id: userId,
            filename: file.originalname,
            object_key: 'test-key',
            uploaded_at: new Date(),
            deleted_at: null,
          }
        },
      )

      await service.uploadAvatar(userId, file)

      expect(storageService.uploadFile).toHaveBeenCalledWith(
        file,
        expect.any(String),
      )
      expect(avatarsRepository.createWithLimit).toHaveBeenCalledWith({
        user_id: userId,
        filename: file.originalname,
        object_key: expect.any(String),
      })
      expect(logger.info).toHaveBeenCalled()
    })

    it('should throw ConflictException when user has 5 avatars', async () => {
      vi.mocked(avatarsRepository.createWithLimit).mockResolvedValue(undefined)

      await expect(service.uploadAvatar(userId, file)).rejects.toThrow(
        ConflictException,
      )

      expect(storageService.uploadFile).toHaveBeenCalledOnce()
      expect(storageService.deleteFile).toHaveBeenCalledOnce()
      expect(avatarsRepository.createWithLimit).toHaveBeenCalledOnce()
    })

    it('should delete uploaded file when repository create fails', async () => {
      const error = new Error('Database error')

      vi.mocked(avatarsRepository.createWithLimit).mockImplementation(
        async () => {
          throw error
        },
      )

      await expect(service.uploadAvatar(userId, file)).rejects.toThrow(error)

      expect(storageService.uploadFile).toHaveBeenCalled()
      expect(storageService.deleteFile).toHaveBeenCalledWith(expect.any(String))
      expect(logger.error).not.toHaveBeenCalled()
    })

    it('should log cleanup error when deleting uploaded file fails', async () => {
      const error = new Error('Database error')

      vi.mocked(avatarsRepository.createWithLimit).mockImplementation(
        async () => {
          throw error
        },
      )
      vi.mocked(storageService.deleteFile).mockRejectedValue(
        new Error('MinIO error'),
      )

      await expect(service.uploadAvatar(userId, file)).rejects.toThrow(error)

      expect(logger.error).toHaveBeenCalledOnce()
    })
  })

  describe('deleteAvatar', () => {
    const avatar = {
      id: 10,
      object_key: 'avatar-key',
    }

    it('should soft delete avatar without deleting its file immediately', async () => {
      vi.mocked(avatarsRepository.findActiveById).mockResolvedValue(
        avatar as never,
      )
      vi.mocked(avatarsRepository.softDelete).mockResolvedValue(avatar as never)

      await service.deleteAvatar(avatar.id, 1)

      expect(avatarsRepository.softDelete).toHaveBeenCalledWith(avatar.id, 1)
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
    })
  })

  describe('deleteAllByUserId', () => {
    it('should soft delete all avatars without queueing immediate deletion', async () => {
      const avatars = [
        { id: 1, object_key: 'key-1' },
        { id: 2, object_key: 'key-2' },
      ]

      vi.mocked(avatarsRepository.softDeleteAllByUserId).mockResolvedValue(
        avatars as never,
      )

      const result = await service.deleteAllByUserId(1)

      expect(result).toBe(2)
    })

    it('should return 0 when user has no avatars', async () => {
      vi.mocked(avatarsRepository.softDeleteAllByUserId).mockResolvedValue([])

      const result = await service.deleteAllByUserId(1)

      expect(result).toBe(0)
    })
  })
})
