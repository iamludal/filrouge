import { render } from '@testing-library/react'
import { SafeMarkdown } from '@/lib/markdown'
import { safeUrl } from '@/lib/url'

describe('safeUrl', () => {
  it('keeps http(s) and mailto, drops everything else', () => {
    expect(safeUrl('https://example.org')).toBe('https://example.org')
    expect(safeUrl('mailto:a@b.c')).toBe('mailto:a@b.c')
    expect(safeUrl('javascript:alert(1)')).toBe('')
    expect(safeUrl(' JaVaScRiPt:alert(1)')).toBe('')
    expect(safeUrl('data:text/html,<script>')).toBe('')
  })
})

describe('SafeMarkdown', () => {
  it('renders formatting and safe links with noopener', () => {
    const { container } = render(<SafeMarkdown>{'**gras** [site](https://example.org)'}</SafeMarkdown>)
    expect(container.querySelector('strong')?.textContent).toBe('gras')
    const link = container.querySelector('a')!
    expect(link.getAttribute('href')).toBe('https://example.org')
    expect(link.getAttribute('rel')).toContain('noreferrer')
  })

  it('neutralizes raw HTML, javascript: links and remote images', () => {
    const hostile = [
      '<img src=x onerror=alert(1)>',
      '<script>alert(1)</script>',
      '[clic](javascript:alert(1))',
      '![pixel](https://tracker.example/p.png)',
    ].join('\n\n')
    const { container } = render(<SafeMarkdown>{hostile}</SafeMarkdown>)
    expect(container.querySelector('img, script')).toBeNull()
    expect(container.querySelector('a')).toBeNull()
    expect(container.innerHTML).not.toContain('onerror')
    expect(container.textContent).toContain('clic')
  })
})
