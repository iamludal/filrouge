import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { addEntityAt, connect, createInvestigation, exportJson } from './helpers.js'

const node = (page: Page, name: string) => page.locator('.react-flow__node', { hasText: name })
const displayButton = (page: Page) => page.getByRole('button', { name: 'Affichage' })
const dot = (page: Page) => page.getByTestId('display-dot')

async function toggle(page: Page, option: string) {
  await displayButton(page).click()
  await page.getByRole('menuitemcheckbox', { name: option }).click()
  await page.keyboard.press('Escape')
}

/** Alice (graded B2, important) –connaît (graded C3)→ Bob. */
async function buildGraph(page: Page, name = 'Affichage') {
  await createInvestigation(page, name)
  await addEntityAt(page, 120, 120, 'Alice')
  await addEntityAt(page, 420, 120, 'Bob')
  await connect(page, 'Alice', 'Bob', 'connaît')

  const panel = page.getByRole('complementary')
  await node(page, 'Alice').click()
  await panel.getByRole('combobox', { name: 'Fiabilité de la source' }).click()
  await page.getByRole('option', { name: 'B – Habituellement fiable' }).click()
  await panel.getByRole('combobox', { name: `Crédibilité de l'information` }).click()
  await page.getByRole('option', { name: '2 – Probablement vraie' }).click()
  await panel.getByRole('button', { name: 'Important' }).click()
  await expect(node(page, 'Alice').getByText('B2')).toBeVisible()
  await expect(node(page, 'Alice').getByRole('img', { name: 'Important' })).toBeVisible()
  // Deselect so that nothing is highlighted.
  await page.locator('.react-flow__pane').click({ position: { x: 300, y: 450 } })
}

test('hides and shows labels, ratings and the important mark from the menu', async ({ page }) => {
  await buildGraph(page)
  const edgeLabel = page.getByText('connaît')
  await expect(edgeLabel).toBeVisible()
  await expect(dot(page)).toHaveCount(0)

  await toggle(page, 'Libellés des entités')
  await expect(node(page, 'Alice').getByText('Alice')).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'Alice' })).toBeVisible()
  await expect(dot(page)).toBeVisible()

  await toggle(page, 'Cotations')
  await expect(node(page, 'Alice').getByText('B2')).toHaveCount(0)
  await expect(edgeLabel).toBeVisible()

  await toggle(page, 'Marque « Important »')
  await expect(page.getByRole('img', { name: 'Important' })).toHaveCount(0)

  await toggle(page, 'Libellés des relations')
  await expect(edgeLabel).toHaveCount(0)

  await displayButton(page).click()
  await page.getByRole('menuitem', { name: `Réinitialiser l'affichage` }).click()
  await page.keyboard.press('Escape')
  await expect(node(page, 'Alice').getByText('Alice')).toBeVisible()
  await expect(node(page, 'Alice').getByText('B2')).toBeVisible()
  await expect(node(page, 'Alice').getByRole('img', { name: 'Important' })).toBeVisible()
  await expect(edgeLabel).toBeVisible()
  await expect(dot(page)).toHaveCount(0)
})

test('hides the rating of a relation but keeps its label', async ({ page }) => {
  await buildGraph(page)
  await page.locator('.react-flow__edge').first().click({ force: true })
  const panel = page.getByRole('complementary')
  await panel.getByRole('combobox', { name: 'Fiabilité de la source' }).click()
  await page.getByRole('option', { name: 'C – Assez fiable' }).click()
  await panel.getByRole('combobox', { name: `Crédibilité de l'information` }).click()
  await page.getByRole('option', { name: '3 – Possiblement vraie' }).click()
  await expect(page.getByText('connaît · C3')).toBeVisible()

  await toggle(page, 'Cotations')
  await expect(page.getByText('connaît · C3')).toHaveCount(0)
  await expect(page.getByText('connaît', { exact: true })).toBeVisible()
})

test('toggles the mini-map from the zoom controls only, apart from the menu options', async ({ page }) => {
  await buildGraph(page)
  const minimap = page.getByRole('img', { name: 'Mini-carte' })
  await expect(minimap).toBeVisible()

  await page.getByRole('button', { name: 'Masquer la mini-carte' }).click()
  await expect(minimap).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Afficher la mini-carte' })).toBeVisible()
  // No dot, and no item in the menu.
  await expect(dot(page)).toHaveCount(0)
  await displayButton(page).click()
  await expect(page.getByRole('menuitemcheckbox', { name: 'Mini-carte' })).toHaveCount(0)
  // The reset leaves the mini-map hidden.
  await page.getByRole('menuitemcheckbox', { name: 'Cotations' }).click()
  await page.getByRole('menuitem', { name: `Réinitialiser l'affichage` }).click()
  await page.keyboard.press('Escape')
  await expect(minimap).toHaveCount(0)

  await page.getByRole('button', { name: 'Afficher la mini-carte' }).click()
  await expect(minimap).toBeVisible()
  // The zoom controls stay while the mini-map is hidden.
  await expect(page.locator('.react-flow__controls-zoomin')).toBeVisible()
})

test('keeps the choice after a reload and for every investigation', async ({ page }) => {
  await buildGraph(page, 'Première')
  await toggle(page, 'Cotations')
  await page.reload()
  await expect(node(page, 'Alice')).toBeVisible()
  await expect(node(page, 'Alice').getByText('B2')).toHaveCount(0)
  await expect(dot(page)).toBeVisible()

  await createInvestigation(page, 'Seconde')
  await addEntityAt(page, 150, 150, 'Zoé')
  await displayButton(page).click()
  await expect(page.getByRole('menuitemcheckbox', { name: 'Cotations' })).not.toBeChecked()
})

test('shows everything again when the stored preference is corrupted', async ({ page }) => {
  await buildGraph(page)
  await expect(page.getByRole('status')).toHaveText('Enregistré')
  await page.evaluate(() => localStorage.setItem('filrouge:display', '{nope'))
  await page.reload()
  await expect(node(page, 'Alice').getByText('B2')).toBeVisible()
  await expect(node(page, 'Alice').getByText('Alice')).toBeVisible()
  await expect(dot(page)).toHaveCount(0)
})

test('is not part of the investigation: JSON unchanged and not undoable', async ({ page }) => {
  await buildGraph(page)
  const exportOnce = async () => {
    const downloadPromise = page.waitForEvent('download')
    await exportJson(page)
    return (await readFile(await (await downloadPromise).path())).toString('utf8')
  }
  const before = JSON.parse(await exportOnce())

  await toggle(page, 'Libellés des entités')
  await toggle(page, 'Cotations')
  const after = JSON.parse(await exportOnce())
  expect(after.entities.map((e: { label: string }) => e.label).sort()).toEqual(['Alice', 'Bob'])
  expect({ ...after, exportedAt: null }).toEqual({ ...before, exportedAt: null })

  // Undo reverts the last edit (the importance mark), not the display.
  await page.getByRole('button', { name: 'Annuler' }).click()
  await displayButton(page).click()
  await expect(page.getByRole('menuitemcheckbox', { name: 'Cotations' })).not.toBeChecked()
  await expect(page.getByRole('menuitemcheckbox', { name: 'Libellés des entités' })).not.toBeChecked()
})

test('the exported SVG follows the display options', async ({ page }) => {
  await buildGraph(page)
  const exportSvg = async () => {
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Exporter' }).click()
    await page.getByRole('menuitem', { name: 'SVG' }).click()
    return (await readFile(await (await downloadPromise).path())).toString('utf8')
  }
  const full = await exportSvg()
  for (const text of ['Alice', 'Bob', 'connaît', 'B2']) expect(full).toContain(`>${text}<`)
  expect(full).toContain('data-flag')

  await toggle(page, 'Libellés des entités')
  await toggle(page, 'Cotations')
  await toggle(page, 'Marque « Important »')
  const plain = await exportSvg()
  expect(plain).not.toContain('>Alice<')
  expect(plain).not.toContain('>Bob<')
  expect(plain).not.toContain('>B2<')
  expect(plain).not.toContain('data-flag')
  expect(plain).toContain('>connaît<')
})
