/**
 * Production-safe logging utility
 * Only logs to console in development mode
 * Can be extended to send errors to monitoring services
 */

const isDev = import.meta.env.DEV

export const logger = {
  /** Log debug messages (dev only) */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args)
    }
  },

  /** Log info messages (dev only) */
  info: (...args: unknown[]) => {
    if (isDev) {
      console.info('[INFO]', ...args)
    }
  },

  /** Log warnings (dev only) */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn('[WARN]', ...args)
    }
  },

  /** Log errors - always logs in dev, can send to monitoring in prod */
  error: (message: string, error?: unknown) => {
    if (isDev) {
      console.error('[ERROR]', message, error)
    }
    // TODO: Send to error monitoring service in production
    // e.g., Sentry, LogRocket, etc.
  },
}
