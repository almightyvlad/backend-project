import { Module } from '@nestjs/common'
import { ConfigModule, ConfigType } from '@nestjs/config'
import { S3Client } from '@aws-sdk/client-s3'
import { storageConfig } from '../configs/storage.config.js'
import { StorageService } from './storage.service.js'

@Module({
  imports: [ConfigModule.forFeature(storageConfig)],
  providers: [
    {
      provide: S3Client,
      inject: [storageConfig.KEY],
      useFactory: (config: ConfigType<typeof storageConfig>) => {
        return new S3Client({
          endpoint: config.endpoint,
          region: config.region,
          credentials: {
            accessKeyId: config.accessKey,
            secretAccessKey: config.secretKey,
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
