import { expect, test } from '@playwright/test'
import { addEntityAt, connect, createInvestigation } from './helpers.js'

test('box selection (Shift+drag) selects several elements and deletes them together', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await createInvestigation(page, 'Sélection')
  await addEntityAt(page, 150, 150, 'A')
  await addEntityAt(page, 450, 150, 'B')
  await addEntityAt(page, 300, 400, 'C')
  await connect(page, 'A', 'B', 'connaît')

  const box = (await page.locator('.react-flow__pane').boundingBox())!
  await page.keyboard.down('Shift')
  await page.mouse.move(box.x + 40, box.y + 60)
  await page.mouse.down()
  await page.mouse.move(box.x + 600, box.y + 260, { steps: 12 })
  await page.mouse.up()
  await page.keyboard.up('Shift')

  await expect(page.locator('.react-flow__node.selected')).toHaveCount(2)
  await expect(page.locator('.react-flow__edge.selected')).toHaveCount(1)

  await page.keyboard.press('Delete')
  await expect(page.locator('.react-flow__node')).toHaveCount(1)
  await expect(page.locator('.react-flow__node', { hasText: 'C' })).toBeVisible()
  await expect(page.locator('.react-flow__edge')).toHaveCount(0)
  expect(errors).toEqual([])
})
