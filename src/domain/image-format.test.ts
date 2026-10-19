import { detectImageMime } from '@/domain/image-format'

const bytes = (...values: number[]) => new Uint8Array(values)
const text = (value: string) => new TextEncoder().encode(value)

describe('detectImageMime', () => {
  it('detects PNG, JPEG, GIF and WebP from content', () => {
    expect(detectImageMime(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0))).toBe('image/png')
    expect(detectImageMime(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg')
    expect(detectImageMime(text('GIF89a....'))).toBe('image/gif')
    expect(detectImageMime(text('GIF87a....'))).toBe('image/gif')
    expect(detectImageMime(new Uint8Array([...text('RIFF'), 1, 2, 3, 4, ...text('WEBPVP8 ')]))).toBe(
      'image/webp',
    )
  })

  it('rejects SVG and text renamed .png', () => {
    expect(detectImageMime(text('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull()
    expect(detectImageMime(text('<?xml version="1.0"?><svg/>'))).toBeNull()
    expect(detectImageMime(text('not an image at all'))).toBeNull()
  })

  it('rejects RIFF containers that are not WebP', () => {
    expect(detectImageMime(new Uint8Array([...text('RIFF'), 1, 2, 3, 4, ...text('WAVEfmt ')]))).toBeNull()
  })

  it('rejects truncated headers and empty input', () => {
    expect(detectImageMime(bytes())).toBeNull()
    expect(detectImageMime(bytes(0x89, 0x50, 0x4e))).toBeNull()
    expect(detectImageMime(bytes(0xff, 0xd8))).toBeNull()
    expect(detectImageMime(text('RIFF'))).toBeNull()
  })
})
