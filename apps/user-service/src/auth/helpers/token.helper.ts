import { createHash, randomBytes } from 'crypto'
import ms, { type StringValue } from 'ms'

export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function generateRefreshToken(expiresIn: StringValue) {
  const hex = randomBytes(32).toString('hex')

  return {
    hex,
    hash: hashToken(hex),
    expires: new Date(Date.now() + ms(expiresIn)),
  }
}
