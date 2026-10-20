import { pinWindowScroll } from '@/app/window-scroll'

describe('pinWindowScroll', () => {
  let stop: () => void
  let scrollTo: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    stop = pinWindowScroll(window)
  })

  afterEach(() => {
    stop()
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  const scrolledBy = (y: number) => Object.defineProperty(window, 'scrollY', { value: y, configurable: true })

  it('turns off the browser scroll restoration', () => {
    expect(history.scrollRestoration).toBe('manual')
  })

  it('puts a moved window back at the top, on scroll and on page show', () => {
    scrolledBy(46)
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('pageshow'))
    expect(scrollTo).toHaveBeenCalledTimes(2)
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it('does nothing when the window is already at the top', () => {
    window.dispatchEvent(new Event('scroll'))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('lets the window move while a field is edited, and resets it once the field is left', async () => {
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    scrolledBy(120)
    window.dispatchEvent(new Event('scroll'))
    expect(scrollTo).not.toHaveBeenCalled()

    input.blur()
    await vi.waitFor(() => expect(scrollTo).toHaveBeenCalledWith(0, 0))
  })

  it('does not reset when focus moves from one field to another', async () => {
    const first = document.createElement('input')
    const second = document.createElement('textarea')
    document.body.append(first, second)
    first.focus()
    scrolledBy(120)
    second.focus()
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('stops listening once stopped', () => {
    stop()
    scrolledBy(46)
    window.dispatchEvent(new Event('scroll'))
    expect(scrollTo).not.toHaveBeenCalled()
  })
})
