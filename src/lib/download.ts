/** Triggers a local file download. No network involved: the blob URL is revoked right after. */
export function downloadText(filename: string, content: string, mime = 'application/json'): void {
  downloadBlob(filename, new Blob([content], { type: mime }))
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Keeps letters (any script), digits, dashes and underscores. */
export function safeFilename(name: string, extension: string): string {
  const base = name
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}_-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return `${base || 'enquete'}.${extension}`
}
