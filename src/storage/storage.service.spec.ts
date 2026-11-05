import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { StorageService } from './storage.service.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('StorageService', () => {
  let service: StorageService
  let s3Client: S3Client

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: S3Client,
          useValue: {
            send: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: vi.fn().mockReturnValue('test-bucket'),
          },
        },
      ],
    }).compile()

    service = module.get<StorageService>(StorageService)
    s3Client = module.get<S3Client>(S3Client)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('uploadFile', () => {
    it('should send PutObjectCommand with correct parameters', async () => {
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
      } as Express.Multer.File

      await service.uploadFile(file, 'avatars/test.png')

      expect(s3Client.send).toHaveBeenCalledWith(expect.any(PutObjectCommand))

      const command = vi.mocked(s3Client.send).mock.calls[0][0]

      expect(command).toBeInstanceOf(PutObjectCommand)
      expect(command.input).toEqual({
        Body: file.buffer,
        ContentType: file.mimetype,
        Bucket: 'test-bucket',
        Key: 'avatars/test.png',
      })
    })
  })

  describe('deleteFile', () => {
    it('should send DeleteObjectCommand with correct parameters', async () => {
      await service.deleteFile('avatars/test.png')

      expect(s3Client.send).toHaveBeenCalledWith(
        expect.any(DeleteObjectCommand),
      )

      const command = vi.mocked(s3Client.send).mock.calls[0][0]

      expect(command).toBeInstanceOf(DeleteObjectCommand)
      expect(command.input).toEqual({
        Bucket: 'test-bucket',
        Key: 'avatars/test.png',
      })
    })
  })
})
