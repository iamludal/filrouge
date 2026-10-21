import { DEFAULT_DISPLAY } from '@/domain/display-options'
import { useDisplayStore } from '@/store/display-store'
import { useViewStore } from '@/store/view-store'

const KEY = 'filrouge:display'

beforeEach(() => {
  localStorage.clear()
  useDisplayStore.setState({ options: DEFAULT_DISPLAY })
  localStorage.clear()
})

/** Loads the store module again, as a page reload would. */
async function reload() {
  vi.resetModules()
  const module = await import('@/store/display-store')
  return module.useDisplayStore
}

describe('display store', () => {
  it('shows everything when nothing is stored', async () => {
    const store = await reload()
    expect(store.getState().options).toEqual(DEFAULT_DISPLAY)
  })

  it('toggles an option and persists it', async () => {
    useDisplayStore.getState().toggle('ratings')
    expect(useDisplayStore.getState().options.ratings).toBe(false)
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toMatchObject({ ratings: false })
    const store = await reload()
    expect(store.getState().options).toEqual({ ...DEFAULT_DISPLAY, ratings: false })
  })

  it('resets the menu options and persists them', () => {
    useDisplayStore.getState().toggle('ratings')
    useDisplayStore.getState().reset()
    expect(useDisplayStore.getState().options).toEqual(DEFAULT_DISPLAY)
    expect(JSON.parse(localStorage.getItem(KEY) ?? '{}')).toEqual(DEFAULT_DISPLAY)
  })

  it('leaves the mini-map as it is when resetting', () => {
    useDisplayStore.getState().toggle('minimap')
    useDisplayStore.getState().toggle('ratings')
    useDisplayStore.getState().reset()
    expect(useDisplayStore.getState().options).toEqual({ ...DEFAULT_DISPLAY, minimap: false })
  })

  it('falls back to the defaults on invalid JSON', async () => {
    localStorage.setItem(KEY, '{nope')
    const store = await reload()
    expect(store.getState().options).toEqual(DEFAULT_DISPLAY)
  })

  it('falls back to the defaults on a value that is not an object', async () => {
    localStorage.setItem(KEY, '42')
    const store = await reload()
    expect(store.getState().options).toEqual(DEFAULT_DISPLAY)
  })

  it('is left alone when an investigation view is reset', () => {
    useDisplayStore.getState().toggle('entityLabels')
    useViewStore.getState().reset()
    expect(useDisplayStore.getState().options.entityLabels).toBe(false)
  })
})
