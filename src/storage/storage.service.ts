import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common'
import type { ConfigType } from '@nestjs/config'
import { storageConfig } from '../configs/storage.config.js'

@Injectable()
export class StorageService implements OnApplicationShutdown {
  constructor(
    private readonly s3Client: S3Client,
    @Inject(storageConfig.KEY)
    private readonly config: ConfigType<typeof storageConfig>,
  ) {}

  async uploadFile(file: Express.Multer.File, objectkey: string) {
    const input = {
      Body: file.buffer,
      ContentType: file.mimetype,
      Bucket: this.config.bucket,
      Key: objectkey,
    }

    const command = new PutObjectCommand(input)

    await this.s3Client.send(command)
  }

  async deleteFile(objectkey: string) {
    const input = {
      Bucket: this.config.bucket,
      Key: objectkey,
    }

    const command = new DeleteObjectCommand(input)

    await this.s3Client.send(command)
  }

  onApplicationShutdown() {
    this.s3Client.destroy()
  }
}
