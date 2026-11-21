import { ConflictException } from '@nestjs/common'

const POSTGRES_UNIQUE_VIOLATION = '23505'
const UNIQUE_LOGIN_OR_EMAIL_MESSAGE = 'Login or email already exists'

export function rethrowIfUniqueViolation(error: unknown): never {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === POSTGRES_UNIQUE_VIOLATION
  ) {
    throw new ConflictException(UNIQUE_LOGIN_OR_EMAIL_MESSAGE)
  }

  throw error
}
