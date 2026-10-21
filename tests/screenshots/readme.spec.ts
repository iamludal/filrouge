import { expect, test, type Page } from '@playwright/test'

const LEVANTE = 'examples/demo-operation-levante.json'
const BIKE_SHOP = 'examples/demo-fake-bike-shop.json'
const out = (name: string) => `docs/images/${name}.png`

async function importDemos(page: Page, files: string[]) {
  await page.goto('/')
  // Toasts ("Investigation imported") would cover part of every shot.
  await page.addStyleTag({ content: '[data-sonner-toaster] { display: none !important; }' })
  for (const file of files) await page.getByTestId('import-input').setInputFiles(file)
  await expect(page.getByRole('link', { name: /Operation Levante/ })).toBeVisible()
}

async function openLevante(page: Page, { zoomIn = 0 } = {}) {
  await page.getByRole('link', { name: /Operation Levante/ }).click()
  await expect(page.locator('.react-flow__node')).toHaveCount(25)
  await page.addStyleTag({ content: '[data-sonner-toaster] { display: none !important; }' })
  for (let i = 0; i < zoomIn; i++) await page.locator('.react-flow__controls-zoomin').click()
  // Let the initial fitView, zoom transitions and edge rendering settle.
  await page.waitForTimeout(800)
}

async function selectEntity(page: Page, label: string) {
  await page.locator('.react-flow__node', { hasText: label }).click()
  const panel = page.getByRole('complementary', { name: 'Detail panel' })
  await expect(panel.getByRole('tab', { name: 'Details', selected: true })).toBeVisible()
  return panel
}

test('home', async ({ page }) => {
  await importDemos(page, [BIKE_SHOP, LEVANTE])
  await expect(page.getByRole('link', { name: /Fake bike shop/ })).toBeVisible()
  await page.screenshot({ path: out('home') })
})

for (const scheme of ['light', 'dark'] as const) {
  test(`graph ${scheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await importDemos(page, [LEVANTE])
    await openLevante(page, { zoomIn: 1 })
    await selectEntity(page, 'Damien Verlac')
    await page.screenshot({ path: out(`graph-${scheme}`) })
  })
}

test.describe('secondary shots', () => {
  // Keeps the README images light: only the hero needs full 2x sharpness.
  test.use({ deviceScaleFactor: 1.5 })

  test('pivot tools', async ({ page }) => {
    await importDemos(page, [LEVANTE])
    await openLevante(page, { zoomIn: 1 })
    const panel = await selectEntity(page, 'dverlac@mail.example')
    await panel.getByRole('tab', { name: /Tools/ }).click()
    await expect(panel.getByRole('tab', { name: /Tools/, selected: true })).toBeVisible()
    await page.screenshot({ path: out('pivot-tools') })
  })
})

test('mobile @mobile', async ({ page }) => {
  await importDemos(page, [LEVANTE])
  await openLevante(page, { zoomIn: 5 })
  await page.locator('.react-flow__node', { hasText: 'Photo of 18/05' }).tap()
  await expect(page.getByRole('region', { name: 'Detail panel' })).toBeVisible()
  await page.waitForTimeout(500)
  await page.screenshot({ path: out('mobile') })
})
