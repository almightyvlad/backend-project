export type CachedUser = {
  id: number
  login: string
  email: string
  age: number
  description: string
}

export type CachedUsersPage = {
  items: Array<{
    id: number
    login: string
    age: number
    description: string
  }>
  total: number
  page: number
  limit: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

function isUserListItem(
  value: unknown,
): value is CachedUsersPage['items'][number] {
  return (
    isRecord(value) &&
    isPositiveInt(value.id) &&
    typeof value.login === 'string' &&
    isPositiveInt(value.age) &&
    typeof value.description === 'string'
  )
}

export function isCachedUser(value: unknown): value is CachedUser {
  return (
    isUserListItem(value) &&
    isRecord(value) &&
    'email' in value &&
    typeof value.email === 'string'
  )
}

export function isCachedUsersPage(value: unknown): value is CachedUsersPage {
  return (
    isRecord(value) &&
    Array.isArray(value.items) &&
    value.items.every(isUserListItem) &&
    isPositiveInt(value.total) &&
    isPositiveInt(value.page) &&
    isPositiveInt(value.limit)
  )
}

export function usersListCacheKey(
  page: number,
  limit: number,
  login?: string,
): string {
  return `users:list:${JSON.stringify([page, limit, login ?? null])}`
}

export function userCacheKey(id: number): string {
  return `user:${id}`
}
