import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { addEntityAt, createInvestigation, exportJson } from './helpers.js'

const node = (page: Page, name: string) => page.locator('.react-flow__node', { hasText: name })
const panel = (page: Page) => page.getByRole('complementary')
const saved = (page: Page) => expect(page.getByRole('status')).toHaveText('Enregistré')
const circle = (page: Page, name: string) => node(page, name).locator('div.rounded-full').first()

// Tailwind red-600 and the person type's blue-600, as the browser computes them.
const RED = 'rgb(220, 38, 38)'
const BLUE = 'rgb(37, 99, 235)'

async function style(page: Page) {
  await panel(page)
    .getByRole('button', { name: /^Couleur ?:/ })
    .click()
  await page.getByRole('radio', { name: 'Rouge' }).click()
  await panel(page)
    .getByRole('button', { name: /^Icône ?:/ })
    .click()
  await page.getByRole('radio', { name: 'Crâne' }).click()
  await panel(page).getByRole('button', { name: 'Important' }).click()
}

test('styles an entity: shown on the node, undone, kept after a reload and exported', async ({ page }) => {
  await createInvestigation(page, 'Apparence')
  await addEntityAt(page, 150, 150, 'Alice')
  await node(page, 'Alice').click()
  await expect(circle(page, 'Alice')).toHaveCSS('border-color', BLUE)
  await expect(node(page, 'Alice').getByRole('img', { name: 'Important' })).toHaveCount(0)

  await style(page)
  await expect(circle(page, 'Alice')).toHaveCSS('border-color', RED)
  await expect(circle(page, 'Alice').locator('svg.lucide-skull')).toBeVisible()
  await expect(node(page, 'Alice').getByRole('img', { name: 'Important' })).toBeVisible()
  // The history is lost on reload, so undo first: the mark, then the icon, then the colour.
  await page.getByRole('button', { name: 'Annuler' }).click()
  await expect(node(page, 'Alice').getByRole('img', { name: 'Important' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Annuler' }).click()
  await expect(circle(page, 'Alice').locator('svg.lucide-user')).toBeVisible()
  await page.getByRole('button', { name: 'Annuler' }).click()
  await expect(circle(page, 'Alice')).toHaveCSS('border-color', BLUE)
  for (let step = 0; step < 3; step++) await page.getByRole('button', { name: 'Rétablir' }).click()
  await expect(circle(page, 'Alice')).toHaveCSS('border-color', RED)
  await expect(node(page, 'Alice').getByRole('img', { name: 'Important' })).toBeVisible()
  await saved(page)

  await page.reload()
  await expect(circle(page, 'Alice')).toHaveCSS('border-color', RED)
  await expect(circle(page, 'Alice').locator('svg.lucide-skull')).toBeVisible()
  await expect(node(page, 'Alice').getByRole('img', { name: 'Important' })).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await exportJson(page)
  const file = JSON.parse(await readFile(await (await downloadPromise).path(), 'utf8'))
  expect(file.entities[0]).toMatchObject({ color: 'red', icon: 'skull', important: true })
})

test('goes back to the type colour and icon, and keeps a custom look when the type changes', async ({
  page,
}) => {
  await createInvestigation(page, 'Retour au type')
  await addEntityAt(page, 150, 150, 'Alice')
  await node(page, 'Alice').click()
  await style(page)

  await panel(page).getByRole('combobox', { name: 'Type' }).click()
  await page.getByRole('option', { name: 'Email' }).click()
  await expect(circle(page, 'Alice')).toHaveCSS('border-color', RED)
  await expect(circle(page, 'Alice').locator('svg.lucide-skull')).toBeVisible()

  await panel(page)
    .getByRole('button', { name: /^Couleur ?:/ })
    .click()
  await page.getByRole('radio', { name: 'Couleur du type' }).click()
  await panel(page)
    .getByRole('button', { name: /^Icône ?:/ })
    .click()
  await page.getByRole('radio', { name: 'Icône du type' }).click()
  // The email type is pink-600 with the mail icon.
  await expect(circle(page, 'Alice')).toHaveCSS('border-color', 'rgb(219, 39, 119)')
  await expect(circle(page, 'Alice').locator('svg.lucide-mail')).toBeVisible()
})
