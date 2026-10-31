import type { Request } from 'express'

export interface AuthenticatedRequest extends Request {
  user: {
    sub: number
  }
}
