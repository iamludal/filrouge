import { readFile } from 'node:fs/promises'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { addEntityAt, connect, createInvestigation } from './helpers.js'

const node = (page: Page, name: string) => page.locator('.react-flow__node', { hasText: name })
const circle = (page: Page, name: string) => node(page, name).locator('div.rounded-full').first()
const edgePath = (page: Page, index: number) => page.locator('.react-flow__edge-path').nth(index)

async function pick(panel: Locator, selector: string, option: string) {
  await panel.getByRole('combobox', { name: selector }).click()
  await panel.page().getByRole('option', { name: option }).click()
}

async function exportCurrent(page: Page) {
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter' }).click()
  const path = await (await downloadPromise).path()
  return { path, json: JSON.parse(await readFile(path, 'utf8')) }
}

test('status and Admiralty grades: edit, render, persist and round-trip', async ({ page }) => {
  await createInvestigation(page, 'Cotation')
  await addEntityAt(page, 120, 120, 'Alice')
  await addEntityAt(page, 420, 120, 'Bob')
  await addEntityAt(page, 270, 320, 'Carole')

  // Defaults: entities verified (solid), relations hypotheses (dashed).
  await connect(page, 'Alice', 'Bob', 'connaît')
  const panel = page.getByRole('complementary')
  await expect(circle(page, 'Alice')).toHaveCSS('border-top-style', 'solid')
  await expect(edgePath(page, 0)).toHaveCSS('stroke-dasharray', '6px, 4px')

  // The new relation is selected: its link label carries the grade.
  await pick(panel, 'Fiabilité de la source', 'C — Assez fiable')
  await pick(panel, 'Crédibilité de l’information', '3 — Possiblement vraie')
  await expect(page.getByText('connaît · C3')).toBeVisible()

  // A relation can be created verified from the dialog.
  await connect(page, 'Bob', 'Carole', 'emploie', { hypothesis: false })
  await expect(edgePath(page, 1)).not.toHaveCSS('stroke-dasharray', '6px, 4px')

  // Entity: hypothesis on (dashed), then off again (solid).
  await node(page, 'Alice').click()
  await panel.getByRole('switch', { name: 'Hypothèse' }).click()
  await expect(circle(page, 'Alice')).toHaveCSS('border-top-style', 'dashed')
  await panel.getByRole('switch', { name: 'Hypothèse' }).click()
  await expect(circle(page, 'Alice')).toHaveCSS('border-top-style', 'solid')

  // Grading in two steps completes the missing half first.
  await expect(node(page, 'Alice').getByRole('img')).toHaveCount(0)
  await pick(panel, 'Fiabilité de la source', 'B — Habituellement fiable')
  await expect(node(page, 'Alice').getByText('B6')).toBeVisible()
  await pick(panel, 'Crédibilité de l’information', '2 — Probablement vraie')
  await expect(node(page, 'Alice').getByText('B2')).toBeVisible()
  await expect(panel.getByText('Cotation : B2')).toBeVisible()

  // The graded entity can still start a relation.
  await connect(page, 'Alice', 'Carole', 'suit')

  await expect(page.getByRole('status')).toHaveText('Enregistré')
  await page.reload()
  await expect(node(page, 'Alice').getByText('B2')).toBeVisible()
  await expect(page.getByText('connaît · C3')).toBeVisible()
  await expect(edgePath(page, 0)).toHaveCSS('stroke-dasharray', '6px, 4px')

  // Clearing the grade removes the badge.
  await node(page, 'Alice').click()
  await panel.getByRole('button', { name: 'Effacer la cotation' }).click()
  await expect(node(page, 'Alice').getByRole('img')).toHaveCount(0)
  await pick(panel, 'Fiabilité de la source', 'A — Totalement fiable')
  await pick(panel, 'Crédibilité de l’information', '1 — Confirmée')

  // Export, delete, re-import: statuses and grades are unchanged.
  await expect(page.getByRole('status')).toHaveText('Enregistré')
  const original = await exportCurrent(page)
  const alice = original.json.entities.find((e: { label: string }) => e.label === 'Alice')
  expect(alice).toMatchObject({ status: 'verified', confidence: { reliability: 'A', credibility: 1 } })
  expect(original.json.relations.map((r: { status: string }) => r.status).sort()).toEqual([
    'hypothesis',
    'hypothesis',
    'verified',
  ])

  await page.getByRole('link', { name: 'Retour aux enquêtes' }).click()
  await page.getByRole('button', { name: 'Actions pour Cotation' }).click()
  await page.getByRole('menuitem', { name: 'Supprimer' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Supprimer' }).click()
  await page.getByTestId('import-input').setInputFiles(original.path)
  await page.getByRole('link', { name: /Cotation/ }).click()

  await expect(node(page, 'Alice').getByText('A1')).toBeVisible()
  await expect(page.getByText('connaît · C3')).toBeVisible()
  const reimported = await exportCurrent(page)
  const strip = ({ exportedAt: _, ...rest }: Record<string, unknown>) => rest
  expect(strip(reimported.json)).toEqual(strip(original.json))
})

test('a file exported by v0.1 imports with no badge and no dashed line', async ({ page }) => {
  const id = () => crypto.randomUUID()
  const now = new Date().toISOString()
  const investigationId = id()
  const [a, b] = [id(), id()]
  const entity = (entityId: string, label: string) => ({
    id: entityId,
    investigationId,
    type: 'person',
    label,
    properties: {},
    tags: [],
    sourceIds: [],
    status: 'verified',
    position: { x: entityId === a ? 0 : 300, y: 0 },
    createdAt: now,
    updatedAt: now,
  })
  const legacy = {
    format: 'filrouge.investigation',
    schemaVersion: 1,
    exportedAt: now,
    investigation: {
      id: investigationId,
      name: 'Ancienne',
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
      encrypted: false,
    },
    entities: [entity(a, 'Alice'), entity(b, 'Bob')],
    relations: [
      {
        id: id(),
        investigationId,
        from: a,
        to: b,
        label: 'connaît',
        directed: true,
        sourceIds: [],
        status: 'verified',
        createdAt: now,
        updatedAt: now,
      },
    ],
    sources: [],
  }
  await page.goto('/')
  await page.getByTestId('import-input').setInputFiles({
    name: 'ancienne.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  })
  await page.getByRole('link', { name: /Ancienne/ }).click()

  await expect(page.locator('.react-flow__node')).toHaveCount(2)
  await expect(node(page, 'Alice').getByRole('img')).toHaveCount(0)
  await expect(circle(page, 'Alice')).toHaveCSS('border-top-style', 'solid')
  await expect(edgePath(page, 0)).not.toHaveCSS('stroke-dasharray', '6px, 4px')
})
