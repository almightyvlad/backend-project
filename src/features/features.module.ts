import { Module } from '@nestjs/common'

import { RefreshTokensModule } from './refresh-tokens/refresh-tokens.module.js'
import { ProfileModule } from './profile/profile.module.js'

@Module({
  controllers: [],
  imports: [RefreshTokensModule, ProfileModule],
})
export class FeaturesModule {}
