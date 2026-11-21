import { Module } from '@nestjs/common'
import { JwtVerificationModule } from '@app/common'
import { RefreshTokensModule } from '../features/refresh-tokens/refresh-tokens.module.js'
import { TokensService } from './tokens.service.js'

@Module({
  imports: [RefreshTokensModule, JwtVerificationModule],
  providers: [TokensService],
  exports: [JwtVerificationModule, TokensService, RefreshTokensModule],
})
export class TokensModule {}
