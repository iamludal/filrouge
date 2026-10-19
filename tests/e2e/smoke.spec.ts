import { expect, test } from '@playwright/test'

test('app shell loads without CSP violations nor external requests', async ({ page, baseURL }) => {
  const violations: string[] = []
  const external: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && /Content Security Policy/i.test(message.text())) {
      violations.push(message.text())
    }
  })
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== new URL(baseURL!).origin) {
      external.push(request.url())
    }
  })

  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Filrouge' })).toBeVisible()
  expect(violations).toEqual([])
  expect(external).toEqual([])
})
