import { expect, test, type Page } from '@playwright/test'
import { addEntityAt, connect, createInvestigation } from './helpers.js'

/** Shift+drag a selection rectangle between two points relative to the canvas pane. */
async function boxSelect(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const pane = (await page.locator('.react-flow__pane').boundingBox())!
  await page.keyboard.down('Shift')
  await page.mouse.move(pane.x + from.x, pane.y + from.y)
  await page.mouse.down()
  await page.mouse.move(pane.x + to.x, pane.y + to.y, { steps: 12 })
  await page.mouse.up()
  await page.keyboard.up('Shift')
}

test('box selection (Shift+drag) selects several elements and deletes them together', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await createInvestigation(page, 'Sélection')
  await addEntityAt(page, 150, 150, 'A')
  await addEntityAt(page, 450, 150, 'B')
  await addEntityAt(page, 300, 400, 'C')
  await connect(page, 'A', 'B', 'connaît')

  await boxSelect(page, { x: 40, y: 60 }, { x: 600, y: 260 })
  await expect(page.locator('.react-flow__node.selected')).toHaveCount(2)
  await expect(page.locator('.react-flow__edge.selected')).toHaveCount(1)

  await page.keyboard.press('Delete')
  await expect(page.locator('.react-flow__node')).toHaveCount(1)
  await expect(page.locator('.react-flow__node', { hasText: 'C' })).toBeVisible()
  await expect(page.locator('.react-flow__edge')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('box selection picks entities it touches, not the empty space around them', async ({ page }) => {
  await createInvestigation(page, 'Sélection partielle')
  await addEntityAt(page, 150, 150, 'A')
  const entity = page.locator('.react-flow__node', { hasText: 'A' })

  // Beside the circle (centred on the clicked point), where the empty space around a short label
  // used to belong to the node.
  await boxSelect(page, { x: 60, y: 110 }, { x: 120, y: 220 })
  await expect(entity).not.toHaveClass(/selected/)

  // Over the left half of the circle only.
  await boxSelect(page, { x: 60, y: 110 }, { x: 150, y: 160 })
  await expect(entity).toHaveClass(/selected/)
})
