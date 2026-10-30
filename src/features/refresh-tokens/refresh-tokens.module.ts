import { Module } from '@nestjs/common'
import { RefreshTokensRepository } from './refresh-tokens.repository.js'
import { RefreshTokensService } from './refresh-tokens.service.js'
import { DatabasesModule } from '../../databases/databases.module.js'

@Module({
  imports: [DatabasesModule],
  providers: [RefreshTokensRepository, RefreshTokensService],
  exports: [RefreshTokensService],
})
export class RefreshTokensModule {}
