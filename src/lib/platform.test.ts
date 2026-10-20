import { isApplePlatform, shortcutLabel } from '@/lib/platform'

describe('isApplePlatform', () => {
  it.each([
    [{ platform: 'MacIntel' }, true],
    [{ platform: 'iPhone' }, true],
    [{ userAgentData: { platform: 'macOS' }, platform: '' }, true],
    [{ userAgentData: { platform: 'Windows' }, platform: 'MacIntel' }, false],
    [{ platform: 'Win32' }, false],
    [{ platform: 'Linux x86_64' }, false],
    [{}, false],
  ])('reads %j as %s', (nav, expected) => {
    expect(isApplePlatform(nav)).toBe(expected)
  })
})

describe('shortcutLabel', () => {
  it('writes the macOS shortcuts with symbols', () => {
    expect(shortcutLabel('undo', true)).toBe('⌘Z')
    expect(shortcutLabel('redo', true)).toBe('⇧⌘Z')
    expect(shortcutLabel('search', true)).toBe('⌘F')
  })

  it('writes the other platforms’ shortcuts with Ctrl', () => {
    expect(shortcutLabel('undo', false)).toBe('Ctrl+Z')
    expect(shortcutLabel('redo', false)).toBe('Ctrl+Shift+Z')
    expect(shortcutLabel('search', false)).toBe('Ctrl+F')
  })
})
