import type { TFunction } from 'i18next'

const CODE_TO_KEY: Record<string, string> = {
  QUOTA_EXCEEDED: 'errors.quota_exceeded',
  FILE_TOO_LARGE: 'errors.file_too_large',
  UNSUPPORTED_FORMAT: 'errors.unsupported_format',
  PDF_INVALID: 'errors.pdf_invalid',
  EMPTY_TEXT: 'errors.empty_text',
  YOUTUBE_NO_TRANSCRIPT: 'errors.youtube_no_transcript',
  NOT_READY: 'errors.not_ready',
  MESSAGE_TOO_LONG: 'errors.message_too_long',
  INVALID_EMAIL: 'errors.invalid_email',
  PASSWORD_TOO_SHORT: 'errors.password_too_short',
}

/** True when the backend rejected the request because the AI quota is used up. */
export const isQuotaError = (err: any) =>
  err?.response?.status === 403 && (err?.response?.data?.quota_exceeded || err?.response?.data?.code === 'QUOTA_EXCEEDED')

/** True when the backend returns 429 Too Many Requests (rate limited). */
export const isRateLimitError = (err: any) => err?.response?.status === 429

/**
 * Turn an axios error into a user-facing, translated message.
 * Known error codes are translated; otherwise the server message (or a fallback) is used.
 */
export function getApiErrorMessage(err: any, t: TFunction, fallbackKey = 'common.generic_error'): string {
  // Rate limit (429)
  if (isRateLimitError(err)) {
    return err?.response?.data?.message || t('errors.rate_limited')
  }
  if (isQuotaError(err)) {
    const { estimated, remaining } = err?.response?.data || {}
    if (typeof estimated === 'number' && estimated > 0) {
      const loc = document.documentElement.lang === 'en' ? 'en-US' : 'vi-VN'
      return t('errors.quota_needed', {
        estimated: Number(estimated).toLocaleString(loc),
        remaining: Number(remaining || 0).toLocaleString(loc),
      })
    }
    return t('errors.quota_exceeded')
  }
  const code = err?.response?.data?.code
  if (code && CODE_TO_KEY[code]) return t(CODE_TO_KEY[code])
  if (!err?.response) return t('errors.server')
  return err?.response?.data?.message || t(fallbackKey)
}

/** Format a timestamp relative to now, e.g. "3 hours ago" / "3 giờ trước". */
export function formatRelativeTime(value: string | Date | null | undefined, locale: string): string {
  if (!value) return ''
  const date = new Date(value)
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const abs = Math.abs(diffSec)
  if (abs < 60) return rtf.format(diffSec, 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day')
  return date.toLocaleDateString(locale)
}
