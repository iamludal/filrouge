import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { addEntityAt, connect, exportJson } from './helpers.js'

const COUNT = 10
const label = (index: number) => `Entité ${String(index).padStart(2, '0')}`

async function exportCurrent(page: Page) {
  const downloadPromise = page.waitForEvent('download')
  await exportJson(page)
  const download = await downloadPromise
  const path = await download.path()
  return { path, json: JSON.parse(await readFile(path, 'utf8')) }
}

test('v0.1 acceptance: create, persist across reload, export, delete, re-import identically', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Nouvelle enquête' }).click()
  await page.getByLabel('Nom').fill('Opération Fil Rouge')
  await page.getByRole('button', { name: 'Créer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Opération Fil Rouge' })).toBeVisible()

  for (let i = 0; i < COUNT; i++) {
    await addEntityAt(page, 100 + (i % 5) * 180, 100 + Math.floor(i / 5) * 220, label(i + 1))
  }
  await page.screenshot({ path: 'test-results/mvp-graph.png' })
  for (let i = 1; i < COUNT; i++) {
    await connect(page, label(i), label(i + 1), `lien ${i}`)
  }
  await expect(page.locator('.react-flow__node')).toHaveCount(COUNT)
  await expect(page.locator('.react-flow__edge')).toHaveCount(COUNT - 1)

  // Edit details, including Markdown notes, then let the autosave catch up.
  await page.locator('.react-flow__node', { hasText: label(1) }).click()
  await page.getByRole('button', { name: 'Écrire' }).click()
  await page.getByLabel('Notes (Markdown)').fill('**important** <img src=x onerror=alert(1)>')
  await page.getByLabel('Ajouter des tags').fill('cible')
  await page.getByLabel('Ajouter des tags').press('Enter')
  await expect(page.getByRole('status')).toHaveText('Enregistré')

  await page.reload()
  await expect(page.locator('.react-flow__node')).toHaveCount(COUNT)
  await expect(page.locator('.react-flow__edge')).toHaveCount(COUNT - 1)
  await page.locator('.react-flow__node', { hasText: label(1) }).click()
  await expect(page.getByRole('list', { name: 'Tags' })).toContainText('cible')
  await expect(page.getByTestId('notes-preview').locator('strong')).toHaveText('important')
  await expect(page.getByTestId('notes-preview').locator('img')).toHaveCount(0)

  const original = await exportCurrent(page)
  expect(original.json.entities).toHaveLength(COUNT)
  expect(original.json.relations).toHaveLength(COUNT - 1)

  await page.getByRole('link', { name: 'Retour aux enquêtes' }).click()
  await page.getByRole('button', { name: 'Actions pour Opération Fil Rouge' }).click()
  await page.getByRole('menuitem', { name: 'Supprimer' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Supprimer' }).click()
  await expect(page.getByText('Aucune enquête pour le moment')).toBeVisible()

  await page.getByTestId('import-input').setInputFiles(original.path)
  await page.getByRole('link', { name: /Opération Fil Rouge/ }).click()
  await expect(page.locator('.react-flow__node')).toHaveCount(COUNT)
  await expect(page.locator('.react-flow__edge')).toHaveCount(COUNT - 1)

  const reimported = await exportCurrent(page)
  const strip = ({ exportedAt: _, ...rest }: Record<string, unknown>) => rest
  expect(strip(reimported.json)).toEqual(strip(original.json))
})

test('import rejects an invalid file cleanly', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('import-input').setInputFiles({
    name: 'evil.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({ format: 'filrouge.investigation', schemaVersion: 1, entities: 'nope' }),
    ),
  })
  await expect(page.getByText('Import refusé : fichier invalide')).toBeVisible()
  await expect(page.getByText('Aucune enquête pour le moment')).toBeVisible()
})

test('deleting an entity with the Delete key removes its relations', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Nouvelle enquête' }).click()
  await page.getByLabel('Nom').fill('Suppression')
  await page.getByRole('button', { name: 'Créer', exact: true }).click()
  await addEntityAt(page, 150, 150, 'A')
  await addEntityAt(page, 450, 150, 'B')
  await connect(page, 'A', 'B', 'connaît')
  await expect(page.locator('.react-flow__edge')).toHaveCount(1)

  await page.locator('.react-flow__node', { hasText: 'A' }).click()
  await page.keyboard.press('Delete')
  await expect(page.locator('.react-flow__node')).toHaveCount(1)
  await expect(page.locator('.react-flow__edge')).toHaveCount(0)
})
