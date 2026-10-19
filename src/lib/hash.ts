const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'))

/** SHA-256 of the exact bytes, as 64 lowercase hex characters. Computed locally. */
export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('Calcul d’empreinte indisponible')
  const view = data instanceof Uint8Array ? data : new Uint8Array(data)
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', view as BufferSource))
  let hex = ''
  for (const byte of digest) hex += HEX[byte]
  return hex
}
