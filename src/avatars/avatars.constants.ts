export const AVATAR_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'] as const

export const AVATAR_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export const AVATAR_MAX_ACTIVE_COUNT = 5

export type AvatarMimeType = (typeof AVATAR_ALLOWED_MIME_TYPES)[number]

export function isAllowedAvatarMimeType(mime: string): mime is AvatarMimeType {
  return (AVATAR_ALLOWED_MIME_TYPES as readonly string[]).includes(mime)
}
