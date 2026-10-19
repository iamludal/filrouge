const SAFE_PROTOCOL = /^(https?:|mailto:)/i

/**
 * Only http(s) and mailto links survive; everything else (javascript:, data:, relative paths…)
 * becomes an empty string.
 */
export function safeUrl(url: string): string {
  const trimmed = url.trim()
  return SAFE_PROTOCOL.test(trimmed) ? trimmed : ''
}
