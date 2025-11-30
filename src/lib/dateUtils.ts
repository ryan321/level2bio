/**
 * Converts an ISO string to datetime-local input format
 */
export function toDateTimeLocal(isoString: string | null): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  // Adjust for timezone offset to get local time
  const offset = date.getTimezoneOffset() * 60000
  const localDate = new Date(date.getTime() - offset)
  return localDate.toISOString().slice(0, 16)
}

/**
 * Formats a date for display with medium date and short time
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

/**
 * Checks if a date is in the past
 */
export function isExpired(isoString: string | null): boolean {
  if (!isoString) return false
  return new Date(isoString) < new Date()
}

/**
 * Returns the minimum datetime-local value (current time)
 */
export function getMinDateTimeLocal(): string {
  return new Date().toISOString().slice(0, 16)
}
