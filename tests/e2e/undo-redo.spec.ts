import { expect, test, type Page } from '@playwright/test'
import { addEntityAt, connect, createInvestigation } from './helpers.js'

// A valid 1×1 PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

const UNDO = 'Control+z'
const REDO = 'Control+Shift+z'

const node = (page: Page, name: string) => page.locator('.react-flow__node', { hasText: name })
const saved = (page: Page) => expect(page.getByRole('status')).toHaveText('Enregistré')

test('undo and redo a deletion together with its relations', async ({ page }) => {
  await createInvestigation(page, 'Annulation')
  await addEntityAt(page, 150, 150, 'A')
  await addEntityAt(page, 450, 150, 'B')
  await connect(page, 'A', 'B', 'connaît')

  await node(page, 'A').click()
  await page.keyboard.press('Delete')
  await expect(page.locator('.react-flow__node')).toHaveCount(1)
  await expect(page.locator('.react-flow__edge')).toHaveCount(0)

  await page.keyboard.press(UNDO)
  await expect(page.locator('.react-flow__node')).toHaveCount(2)
  await expect(page.locator('.react-flow__edge')).toHaveCount(1)

  await page.keyboard.press(REDO)
  await expect(page.locator('.react-flow__node')).toHaveCount(1)
  await expect(page.locator('.react-flow__edge')).toHaveCount(0)
})

test('undo a move puts the node back', async ({ page }) => {
  await createInvestigation(page, 'Déplacement')
  await addEntityAt(page, 150, 150, 'A')
  const target = node(page, 'A')
  const before = (await target.boundingBox())!

  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2)
  await page.mouse.down()
  await page.mouse.move(before.x + 240, before.y + 160, { steps: 8 })
  await page.mouse.up()
  const moved = (await target.boundingBox())!
  expect(Math.abs(moved.x - before.x)).toBeGreaterThan(100)

  await page.keyboard.press(UNDO)
  await expect.poll(async () => (await target.boundingBox())!.x).toBeCloseTo(before.x, 0)
  expect((await target.boundingBox())!.y).toBeCloseTo(before.y, 0)
})

test('a label typed in the panel is a single step, undone from the toolbar', async ({ page }) => {
  await createInvestigation(page, 'Saisie')
  await addEntityAt(page, 150, 150, 'A')
  await node(page, 'A').click()

  const field = page.getByLabel('Libellé')
  await field.click()
  await field.press('End')
  await field.pressSequentially(' Dupont', { delay: 30 })
  await expect(node(page, 'A Dupont')).toBeVisible()

  await page.getByRole('button', { name: 'Annuler' }).click()
  await expect(node(page, 'A Dupont')).toHaveCount(0)
  await expect(node(page, 'A')).toBeVisible()
})

test('the shortcuts leave text fields to the browser', async ({ page }) => {
  await createInvestigation(page, 'Champs')
  await addEntityAt(page, 150, 150, 'A')
  await node(page, 'A').click()
  await page.getByRole('button', { name: 'Écrire' }).click()
  const notes = page.getByLabel('Notes (Markdown)')
  await notes.fill('brouillon')

  await notes.press(UNDO)
  // Nothing was undone in the graph: there is still nothing to redo.
  await expect(page.getByRole('button', { name: 'Rétablir' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Annuler' })).toBeEnabled()
  await expect(page.locator('.react-flow__node')).toHaveCount(1)
})

test('the toolbar buttons follow the history and explain their shortcut', async ({ page }) => {
  await createInvestigation(page, 'Boutons')
  const undo = page.getByRole('button', { name: 'Annuler' })
  const redo = page.getByRole('button', { name: 'Rétablir' })
  await expect(undo).toBeDisabled()
  await expect(redo).toBeDisabled()

  // The tooltip also shows on a disabled button, which gets no pointer events: hover its wrapper.
  await undo.locator('xpath=..').hover()
  await expect(page.getByRole('tooltip')).toHaveText(/^Annuler \((Ctrl\+Z|⌘Z)\)$/)
  await page.mouse.move(600, 400)

  await addEntityAt(page, 150, 150, 'A')
  await expect(undo).toBeEnabled()
  await undo.click()
  await expect(page.locator('.react-flow__node')).toHaveCount(0)
  await expect(undo).toBeDisabled()
  await expect(redo).toBeEnabled()

  await redo.focus()
  await expect(page.getByRole('tooltip')).toHaveText(/^Rétablir \((Ctrl\+Shift\+Z|⇧⌘Z)\)$/)
  await redo.click()
  await expect(node(page, 'A')).toBeVisible()
})

test('an undone deletion is saved and survives a reload', async ({ page }) => {
  await createInvestigation(page, 'Persistance')
  await addEntityAt(page, 150, 150, 'A')
  await addEntityAt(page, 450, 150, 'B')
  await connect(page, 'A', 'B', 'connaît')
  await saved(page)

  await node(page, 'A').click()
  await page.keyboard.press('Delete')
  await expect(page.locator('.react-flow__node')).toHaveCount(1)
  await saved(page)

  await page.keyboard.press(UNDO)
  await expect(page.locator('.react-flow__node')).toHaveCount(2)
  await saved(page)

  await page.reload()
  await expect(page.locator('.react-flow__node')).toHaveCount(2)
  await expect(page.locator('.react-flow__edge')).toHaveCount(1)
})

test('a deleted source comes back with its screenshot, even once the deletion was saved', async ({
  page,
}) => {
  await createInvestigation(page, 'Preuves')
  await addEntityAt(page, 150, 150, 'A')
  await node(page, 'A').click()

  await page.getByRole('button', { name: 'Ajouter une source' }).click()
  await page.getByRole('menuitem', { name: 'Nouvelle source' }).click()
  const form = page.getByRole('dialog', { name: 'Nouvelle source' })
  await form.getByLabel('Titre').fill('Profil')
  await form
    .getByTestId('screenshot-input')
    .setInputFiles({ name: 'capture.png', mimeType: 'image/png', buffer: PNG })
  const sha = (await form.getByTestId('sha256').textContent())!
  await form.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(form).toBeHidden()
  await saved(page)

  await page.getByRole('button', { name: 'Retirer Profil' }).click()
  const confirm = page.getByRole('alertdialog')
  await confirm.getByLabel('Supprimer aussi la source et sa capture').check()
  await confirm.getByRole('button', { name: 'Retirer' }).click()
  await expect(page.getByRole('button', { name: 'Sources (0)' })).toBeVisible()
  await saved(page)

  await page.keyboard.press(UNDO)
  await expect(page.getByRole('button', { name: 'Sources (1)' })).toBeVisible()
  await saved(page)

  await page.reload()
  await node(page, 'A').click()
  await page.getByRole('button', { name: 'Profil Avec capture', exact: true }).click()
  const edit = page.getByRole('dialog', { name: 'Modifier la source' })
  await expect(edit.getByTestId('sha256')).toHaveText(sha)
  await expect(edit.getByAltText('Aperçu de la capture')).toBeVisible()
})

test('the history is dropped when the investigation is left', async ({ page }) => {
  await createInvestigation(page, 'Départ')
  await addEntityAt(page, 150, 150, 'A')
  await expect(page.getByRole('button', { name: 'Annuler' })).toBeEnabled()
  await saved(page)

  await page.getByRole('link', { name: 'Retour aux enquêtes' }).click()
  await page.getByRole('link', { name: /Départ/ }).click()
  await expect(node(page, 'A')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Annuler' })).toBeDisabled()
})
