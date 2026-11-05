import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { Injectable, OnApplicationShutdown } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MINIO_BUCKET } from './storage.constants.js'

@Injectable()
export class StorageService implements OnApplicationShutdown {
  constructor(
    private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {}

  async uploadFile(file: Express.Multer.File, objectkey: string) {
    const input = {
      Body: file.buffer,
      ContentType: file.mimetype,
      Bucket: this.configService.getOrThrow<string>(MINIO_BUCKET),
      Key: objectkey,
    }

    const command = new PutObjectCommand(input)

    await this.s3Client.send(command)
  }

  async deleteFile(objectkey: string) {
    const input = {
      Bucket: this.configService.getOrThrow<string>(MINIO_BUCKET),
      Key: objectkey,
    }

    const command = new DeleteObjectCommand(input)

    await this.s3Client.send(command)
  }

  onApplicationShutdown() {
    this.s3Client.destroy()
  }
}
