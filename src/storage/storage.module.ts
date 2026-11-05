import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { S3Client } from '@aws-sdk/client-s3'
import {
  MINIO_ENDPOINT,
  MINIO_REGION,
  MINIO_ROOT_PASSWORD,
  MINIO_ROOT_USER,
} from './storage.constants.js'
import { StorageService } from './storage.service.js'

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: S3Client,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new S3Client({
          endpoint: config.getOrThrow<string>(MINIO_ENDPOINT),
          region: config.getOrThrow<string>(MINIO_REGION),
          credentials: {
            accessKeyId: config.getOrThrow<string>(MINIO_ROOT_USER),
            secretAccessKey: config.getOrThrow<string>(MINIO_ROOT_PASSWORD),
          },
          forcePathStyle: true,
        })
      },
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
