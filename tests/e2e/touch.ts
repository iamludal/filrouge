import type { CDPSession, Page } from '@playwright/test'

export interface Point {
  x: number
  y: number
}

/** A single finger, driven through the DevTools protocol: Playwright has no press-and-hold API. */
export class Finger {
  private readonly session: CDPSession

  private constructor(session: CDPSession) {
    this.session = session
  }

  static async on(page: Page) {
    return new Finger(await page.context().newCDPSession(page))
  }

  private dispatch(type: 'touchStart' | 'touchMove' | 'touchEnd', at?: Point) {
    return this.session.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: at ? [{ x: at.x, y: at.y }] : [],
    })
  }

  down(at: Point) {
    return this.dispatch('touchStart', at)
  }

  move(to: Point) {
    return this.dispatch('touchMove', to)
  }

  up() {
    return this.dispatch('touchEnd')
  }

  /** Presses `from`, moves in small steps to `to`, and releases there. */
  async drag(from: Point, to: Point, steps = 10) {
    await this.down(from)
    for (let i = 1; i <= steps; i++)
      await this.move({
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
      })
    await this.up()
  }

  /** Presses `at` and keeps the finger still for `ms` before releasing. */
  async hold(at: Point, ms: number) {
    await this.down(at)
    await new Promise((resolve) => setTimeout(resolve, ms))
    await this.up()
  }
}
