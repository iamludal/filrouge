import { expect, type Page } from '@playwright/test'

export async function addEntityAt(page: Page, x: number, y: number, name: string) {
  const pane = page.locator('.react-flow__pane')
  await pane.dblclick({ position: { x, y } })
  const dialog = page.getByRole('dialog', { name: 'Nouvelle entité' })
  await dialog.getByLabel('Libellé').fill(name)
  await dialog.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await expect(dialog).toBeHidden()
  await expect(page.locator('.react-flow__node', { hasText: name })).toBeVisible()
}

export async function connect(
  page: Page,
  from: string,
  to: string,
  relationLabel: string,
  { hypothesis = true }: { hypothesis?: boolean } = {},
) {
  const source = page.locator('.react-flow__node', { hasText: from })
  const target = page.locator('.react-flow__node', { hasText: to })
  await source.hover()
  const handle = await source.locator('.react-flow__handle.source').boundingBox()
  const targetBox = await target.boundingBox()
  if (!handle || !targetBox) throw new Error('missing geometry')
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await page.mouse.down()
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 20, { steps: 10 })
  await page.mouse.up()
  const dialog = page.getByRole('dialog', { name: 'Nouvelle relation' })
  await dialog.getByLabel('Libellé').fill(relationLabel)
  if (!hypothesis) await dialog.getByRole('switch', { name: 'Hypothèse' }).click()
  await dialog.getByRole('button', { name: 'Créer la relation' }).click()
  await expect(dialog).toBeHidden()
}

export async function createInvestigation(page: Page, name: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Nouvelle enquête' }).click()
  await page.getByLabel('Nom').fill(name)
  await page.getByRole('button', { name: 'Créer', exact: true }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
}

/** Starts the JSON export from the graph view's "Exporter" menu. */
export async function exportJson(page: Page) {
  await page.getByRole('button', { name: 'Exporter' }).click()
  await page.getByRole('menuitem', { name: 'JSON' }).click()
}
