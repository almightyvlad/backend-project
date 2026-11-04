import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException } from '@nestjs/common'
import { AvatarsController } from './avatars.controller.js'
import { AvatarsService } from './avatars.service.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthenticatedRequest } from '../auth/types/authenticated-request.js'

describe('AvatarsController', () => {
  let controller: AvatarsController
  let avatarsService: AvatarsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvatarsController],
      providers: [
        {
          provide: AvatarsService,
          useValue: {
            uploadAvatar: vi.fn(),
            deleteAvatar: vi.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<AvatarsController>(AvatarsController)
    avatarsService = module.get<AvatarsService>(AvatarsService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('uploadAvatar', () => {
    const request = {
      user: { sub: 1 },
    } as AuthenticatedRequest

    const file = {
      originalname: 'avatar.png',
      mimetype: 'image/png',
      buffer: Buffer.from('test'),
    } as Express.Multer.File

    it('should upload avatar for authenticated user', async () => {
      const avatar = { id: 10 }

      vi.mocked(avatarsService.uploadAvatar).mockResolvedValue(avatar as never)

      const result = await controller.uploadAvatar(request, file)

      expect(avatarsService.uploadAvatar).toHaveBeenCalledWith(1, file)
      expect(result).toEqual(avatar)
    })

    it('should throw BadRequestException when file is missing', () => {
      expect(() =>
        controller.uploadAvatar(request, undefined as never),
      ).toThrow(BadRequestException)

      expect(avatarsService.uploadAvatar).not.toHaveBeenCalled()
    })
  })

  describe('deleteAvatar', () => {
    it('should delete avatar for authenticated user', async () => {
      const avatar = { id: 10 }

      vi.mocked(avatarsService.deleteAvatar).mockResolvedValue(avatar as never)

      const result = await controller.deleteAvatar(10, {
        user: { sub: 1 },
      } as AuthenticatedRequest)

      expect(avatarsService.deleteAvatar).toHaveBeenCalledWith(10, 1)
      expect(result).toEqual(avatar)
    })
  })
})
