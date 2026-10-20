import { pngSize, sizedSvg, svgToPng } from '@/features/graph-export/png'

describe('pngSize', () => {
  it('renders a usual drawing at four times its size by default', () => {
    expect(pngSize(1200, 800)).toEqual({ width: 4800, height: 3200, scale: 4, limited: false })
  })

  it('applies the requested scale', () => {
    expect(pngSize(1200, 800, 1)).toEqual({ width: 1200, height: 800, scale: 1, limited: false })
    expect(pngSize(411, 336, 8)).toMatchObject({ width: 3288, height: 2688, limited: false })
  })

  it('limits the total area', () => {
    expect(pngSize(1200, 800, 8)).toMatchObject({ width: 5016, height: 3344, limited: true })
    const { width, height } = pngSize(6000, 6000)
    expect(width * height).toBeLessThanOrEqual(16_777_216)
    expect(width).toBe(height)
  })

  it('scales a very wide drawing down to 16,384 pixels, keeping proportions', () => {
    expect(pngSize(20_000, 1000)).toMatchObject({ width: 16_384, height: 819, limited: true })
  })
})

describe('sizedSvg', () => {
  it('sets the pixel size and keeps the viewBox and content', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="-10 0 100 50"><text>&lt;a&gt;</text></svg>'
    const doc = new DOMParser().parseFromString(sizedSvg(svg, 400, 200), 'image/svg+xml')
    const root = doc.documentElement
    expect([root.getAttribute('width'), root.getAttribute('height')]).toEqual(['400', '200'])
    expect(root.getAttribute('viewBox')).toBe('-10 0 100 50')
    expect(doc.querySelector('text')?.textContent).toBe('<a>')
  })

  it('rejects something that is not an SVG', () => {
    expect(() => sizedSvg('<html/>', 1, 1)).toThrow()
  })
})

describe('svgToPng', () => {
  const drawn: Array<[number, number, number, number]> = []
  let loads: 'load' | 'error' = 'load'
  let blob: Blob | null = new Blob(['png'], { type: 'image/png' })

  beforeEach(() => {
    drawn.length = 0
    loads = 'load'
    blob = new Blob(['png'], { type: 'image/png' })
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        set src(_value: string) {
          queueMicrotask(() => (loads === 'load' ? this.onload?.() : this.onerror?.()))
        }
      },
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () =>
        ({
          fillRect: (...args: [number, number, number, number]) => drawn.push(args),
          drawImage: () => {},
          set fillStyle(_value: string) {},
        }) as unknown as CanvasRenderingContext2D,
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(blob))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('draws on a canvas of the PNG size at the requested scale', async () => {
    await svgToPng('<svg xmlns="http://www.w3.org/2000/svg"/>', 1200, 800, 1)
    expect(drawn).toEqual([[0, 0, 1200, 800]])
  })

  it('draws on a canvas of the PNG size and returns the encoded blob', async () => {
    await expect(svgToPng('<svg xmlns="http://www.w3.org/2000/svg"/>', 1200, 800)).resolves.toBe(blob)
    expect(drawn).toEqual([[0, 0, 4800, 3200]])
  })

  it('rejects when the image fails to load', async () => {
    loads = 'error'
    await expect(svgToPng('<svg xmlns="http://www.w3.org/2000/svg"/>', 100, 100)).rejects.toThrow()
  })

  it('rejects when the browser yields no PNG', async () => {
    blob = null
    await expect(svgToPng('<svg xmlns="http://www.w3.org/2000/svg"/>', 100, 100)).rejects.toThrow()
  })
})
