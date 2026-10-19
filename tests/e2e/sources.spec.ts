/// <reference lib="dom" />
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { addEntityAt, connect, createInvestigation } from './helpers.js'

// A valid 1×1 PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)
const PNG_SHA = createHash('sha256').update(PNG).digest('hex')
const png = { name: 'capture.png', mimeType: 'image/png', buffer: PNG }

async function selectEntity(page: Page, name: string) {
  await page.locator('.react-flow__node', { hasText: name }).click()
}

/** Clicks the middle of the straight edge between two entities. */
async function selectEdge(page: Page, from: string, to: string) {
  const a = await page.locator('.react-flow__node', { hasText: from }).boundingBox()
  const b = await page.locator('.react-flow__node', { hasText: to }).boundingBox()
  if (!a || !b) throw new Error('missing geometry')
  // Edges join the 48px circles at the top of each node.
  await page.mouse.click((a.x + a.width / 2 + b.x + b.width / 2) / 2, (a.y + b.y) / 2 + 24)
  await expect(page.getByRole('heading', { name: 'Relation', exact: true })).toBeVisible()
}

async function addSourceTo(page: Page, title: string) {
  await page.getByRole('button', { name: 'Ajouter une source' }).click()
  await page.getByRole('menuitem', { name: 'Nouvelle source' }).click()
  const dialog = page.getByRole('dialog', { name: 'Nouvelle source' })
  await dialog.getByLabel('Titre').fill(title)
  await dialog.getByTestId('screenshot-input').setInputFiles(png)
  await expect(dialog.getByTestId('sha256')).toHaveText(PNG_SHA)
  await dialog.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(dialog).toBeHidden()
}

function watchLeaks(page: Page, baseURL: string) {
  const leaks: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && /Content Security Policy/i.test(message.text())) {
      leaks.push(message.text())
    }
  })
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== new URL(baseURL).origin) {
      leaks.push(request.url())
    }
  })
  return leaks
}

test('sources: create with a screenshot, reuse, reload, detach and delete', async ({ page, baseURL }) => {
  const leaks = watchLeaks(page, baseURL!)
  await createInvestigation(page, 'Preuves')
  await addEntityAt(page, 150, 150, 'A')
  await addEntityAt(page, 450, 150, 'B')
  await connect(page, 'A', 'B', 'connaît')

  await selectEntity(page, 'A')
  await addSourceTo(page, 'Profil LinkedIn')
  await expect(page.getByRole('list', { name: 'Sources attachées' })).toContainText('Profil LinkedIn')

  // Reuse the same source on the relation.
  await selectEdge(page, 'A', 'B')
  await page.getByRole('button', { name: 'Ajouter une source' }).click()
  await page.getByRole('menuitem', { name: 'Source existante' }).click()
  await page.getByRole('option', { name: 'Profil LinkedIn' }).click()
  await expect(page.getByRole('list', { name: 'Sources attachées' })).toContainText('Profil LinkedIn')

  await expect(page.getByRole('status')).toHaveText('Enregistré')
  await page.reload()

  // The screenshot and its fingerprint come back from IndexedDB.
  await selectEntity(page, 'A')
  await page.getByRole('button', { name: 'Profil LinkedIn Avec capture', exact: true }).click()
  const editDialog = page.getByRole('dialog', { name: 'Modifier la source' })
  await expect(editDialog.getByTestId('sha256')).toHaveText(PNG_SHA)
  await expect(editDialog.getByAltText('Aperçu de la capture')).toBeVisible()
  await editDialog.getByRole('button', { name: 'Annuler' }).click()

  await page.getByRole('button', { name: 'Sources (1)' }).click()
  await expect(page.getByRole('list', { name: 'Sources de l’enquête' })).toContainText('2 utilisations')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  // Detach from the relation (shared: no question), then from A (last reference).
  await selectEdge(page, 'A', 'B')
  await page.getByRole('button', { name: 'Retirer Profil LinkedIn' }).click()
  await expect(page.getByRole('alertdialog')).toBeHidden()
  await selectEntity(page, 'A')
  await page.getByRole('button', { name: 'Retirer Profil LinkedIn' }).click()
  const confirm = page.getByRole('alertdialog')
  await confirm.getByLabel('Supprimer aussi la source et sa capture').check()
  await confirm.getByRole('button', { name: 'Retirer' }).click()
  await expect(page.getByRole('button', { name: 'Sources (0)' })).toBeVisible()

  expect(leaks).toEqual([])
})

test('sources: Ctrl+V on the graph creates a source from a pasted image', async ({ page }) => {
  await createInvestigation(page, 'Collage')
  await addEntityAt(page, 150, 150, 'A')

  // Nothing selected: a hint.
  await page.locator('.react-flow__pane').click({ position: { x: 600, y: 400 } })
  const paste = () =>
    page.evaluate(async (base64) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
      const data = new DataTransfer()
      data.items.add(new File([bytes], 'image.png', { type: 'image/png' }))
      document.body.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
      )
    }, PNG.toString('base64'))
  await paste()
  await expect(
    page.getByText('Sélectionnez une entité ou une relation pour y coller une capture'),
  ).toBeVisible()

  await selectEntity(page, 'A')
  await paste()
  const dialog = page.getByRole('dialog', { name: 'Nouvelle source' })
  await expect(dialog.getByTestId('sha256')).toHaveText(PNG_SHA)
  await dialog.getByLabel('Titre').fill('Story Instagram')
  await dialog.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByRole('list', { name: 'Sources attachées' })).toContainText('Story Instagram')
})

test('export with screenshots round-trips the bytes; files from before screenshots still import', async ({
  page,
}) => {
  await createInvestigation(page, 'Sauvegarde')
  await addEntityAt(page, 150, 150, 'A')
  await selectEntity(page, 'A')
  await addSourceTo(page, 'Capture')
  await expect(page.getByRole('status')).toHaveText('Enregistré')

  const exportAs = async (include: boolean) => {
    await page.getByRole('button', { name: 'Exporter' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByLabel(/Inclure les captures/)).toBeChecked()
    await dialog.getByLabel(/Inclure les captures/).setChecked(include)
    const download = page.waitForEvent('download')
    await dialog.getByRole('button', { name: 'Exporter' }).click()
    const file = await (await download).path()
    return { file, json: JSON.parse(await readFile(file, 'utf8')) }
  }

  const without = await exportAs(false)
  expect(without.json.attachments).toEqual([])
  expect(without.json.sources[0].sha256).toBe(PNG_SHA)
  expect(without.json.sources[0].attachmentId).toBeUndefined()

  const withShots = await exportAs(true)
  expect(withShots.json.attachments).toHaveLength(1)
  expect(withShots.json.attachments[0].sha256).toBe(PNG_SHA)

  await page.getByRole('link', { name: 'Retour aux enquêtes' }).click()
  await page.getByRole('button', { name: 'Actions pour Sauvegarde' }).click()
  await page.getByRole('menuitem', { name: 'Supprimer' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Supprimer' }).click()

  await page.getByTestId('import-input').setInputFiles(withShots.file)
  await page.getByRole('link', { name: /Sauvegarde/ }).click()
  await selectEntity(page, 'A')
  await page.getByRole('button', { name: 'Capture Avec capture', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Modifier la source' })
  await expect(dialog.getByAltText('Aperçu de la capture')).toBeVisible()
  const download = page.waitForEvent('download')
  await dialog.getByRole('button', { name: 'Télécharger la capture' }).click()
  const bytes = await readFile(await (await download).path())
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(PNG_SHA)

  // A file exported before screenshots existed has no `attachments` list.
  const id = () => crypto.randomUUID()
  const now = new Date().toISOString()
  const investigationId = id()
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
    entities: [
      {
        id: id(),
        investigationId,
        type: 'person',
        label: 'Alice',
        properties: {},
        tags: [],
        sourceIds: [],
        status: 'verified',
        position: { x: 0, y: 0 },
        createdAt: now,
        updatedAt: now,
      },
    ],
    relations: [],
    sources: [],
  }
  await page.keyboard.press('Escape')
  await page.getByRole('link', { name: 'Retour aux enquêtes' }).click()
  await page.getByTestId('import-input').setInputFiles({
    name: 'ancienne.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(legacy)),
  })
  await expect(page.getByRole('link', { name: /Ancienne/ })).toBeVisible()
})
