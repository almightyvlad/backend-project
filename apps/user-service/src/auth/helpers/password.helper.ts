import bcrypt from 'bcrypt'
import { BCRYPT_SALT_ROUNDS } from '../auth.constants.js'

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}
