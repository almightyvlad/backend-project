export function parseCachedValue<T>(
  raw: string | null,
  isValid: (value: unknown) => value is T,
): T | null {
  if (raw === null) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return isValid(parsed) ? parsed : null
  } catch {
    return null
  }
}
