import { base64ToBytes, bytesToBase64 } from '@/lib/base64'
import { sha256Hex } from '@/lib/hash'

describe('sha256Hex', () => {
  it('matches known sha256sum vectors', async () => {
    expect(await sha256Hex(new Uint8Array())).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )
    expect(await sha256Hex(new TextEncoder().encode('abc'))).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('hashes the exact bytes of a sub-view', async () => {
    const whole = new TextEncoder().encode('xxabcxx')
    expect(await sha256Hex(whole.subarray(2, 5))).toBe(await sha256Hex(new TextEncoder().encode('abc')))
  })
})

describe('base64', () => {
  it('round-trips a multi-megabyte buffer', () => {
    const bytes = new Uint8Array(3 * 1024 * 1024 + 1)
    for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 31) % 256
    const decoded = base64ToBytes(bytesToBase64(bytes))
    expect(decoded).not.toBeNull()
    expect(decoded!.length).toBe(bytes.length)
    expect(decoded!.every((byte, i) => byte === bytes[i])).toBe(true)
  })

  it('encodes known values and rejects invalid input', () => {
    expect(bytesToBase64(new TextEncoder().encode('abc'))).toBe('YWJj')
    expect(Array.from(base64ToBytes('YWJj')!)).toEqual([97, 98, 99])
    expect(base64ToBytes('YW Jj')).toBeNull()
    expect(base64ToBytes('YWJ')).toBeNull()
    expect(base64ToBytes('****')).toBeNull()
  })
})
