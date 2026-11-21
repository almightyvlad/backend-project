import type { Request } from 'express'
import type { AccessTokenPayload } from '../jwt/verify-access-token.js'

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload
}
