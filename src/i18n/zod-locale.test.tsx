import { render } from '@testing-library/react'
import { z } from 'zod'
import { parseExport } from '@/domain/export-format'
import { LocaleProvider } from '@/i18n/locale'
import { renderWithLocale } from '@/test/render-with-locale'

const messageFor = async () => {
  const result = await parseExport(JSON.stringify({ format: 42 }))
  if (result.ok) throw new Error('expected a refusal')
  return result.errors.find((error) => error.code === 'schema')?.value
}

describe('validator language', () => {
  it('words schema errors in English', async () => {
    renderWithLocale(<span />, 'en')
    expect(await messageFor()).toMatch(/Invalid input/)
  })

  it('words schema errors in French', async () => {
    render(<LocaleProvider>{null}</LocaleProvider>)
    expect(await messageFor()).toMatch(/Entrée invalide/)
  })

  it('keeps the JIT disabled', () => {
    renderWithLocale(<span />, 'en')
    expect(z.config().jitless).toBe(true)
  })
})
