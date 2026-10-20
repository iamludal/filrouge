import { expect, test, type Page } from '@playwright/test'
import { addEntityAt, createInvestigation } from './helpers.js'

test.use({ timezoneId: 'Europe/Paris', locale: 'fr-FR' })

const node = (page: Page, name: string) => page.locator('.react-flow__node', { hasText: name })
const created = (page: Page) => page.getByLabel(/^Créée le /)
const edited = (page: Page) => page.getByLabel(/^Modifiée le /)

test('shows when an element was created and last edited, and ignores moves', async ({ page }) => {
  await createInvestigation(page, 'Dates')
  await addEntityAt(page, 150, 150, 'A')
  await addEntityAt(page, 450, 150, 'B')

  await node(page, 'A').click()
  await expect(created(page)).toBeVisible()
  await expect(edited(page)).toHaveCount(0)
  const createdLabel = await created(page).getAttribute('aria-label')
  expect(createdLabel).toMatch(/^Créée le \d{1,2} \p{L}+ \d{4} à \d{2}:\d{2}:\d{2}$/u)

  await created(page).hover()
  await expect(page.getByRole('tooltip').first()).toHaveText(createdLabel!)

  await page.getByLabel('Libellé').fill('Alpha')
  await expect(edited(page)).toBeVisible()

  // Moving a node is not a modification.
  const target = node(page, 'B')
  const box = (await target.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + 120, box.y + 120, { steps: 8 })
  await page.mouse.up()
  await expect(created(page)).toBeVisible()
  await expect(edited(page)).toHaveCount(0)

  await expect(page.getByRole('status')).toHaveText('Enregistré')
  await page.reload()
  await node(page, 'Alpha').click()
  await expect(created(page)).toHaveAttribute('aria-label', createdLabel!)
  await expect(edited(page)).toBeVisible()
})
