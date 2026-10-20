/// <reference lib="dom" />
import { expect, test, type Locator, type Page } from '@playwright/test'
import { addEntityAt, createInvestigation } from './helpers.js'

// A valid 1×1 PNG.
const png = {
  name: 'capture.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  ),
}

const LONG_TAG = 'x'.repeat(100)
const LONG_SOURCE = `https://exemple.test/${'chemin-'.repeat(20)}`
const LONG_NOTES = `Voir ${'https://exemple.test/'.padEnd(150, 'a')}\n\n\`\`\`\n${'code '.repeat(40)}\n\`\`\``

/** Fills an entity with every kind of content that used to widen the panel. */
async function fillWithLongContent(page: Page, panel: Locator) {
  await panel.getByLabel('Fiabilité de la source').click()
  await page.getByRole('option', { name: 'F – Fiabilité indéterminée' }).click()
  await panel.getByLabel(`Crédibilité de l'information`).click()
  await page.getByRole('option', { name: '6 – Véracité indéterminée' }).click()

  await panel.getByRole('button', { name: 'date de naissance' }).click()
  await panel.getByLabel('Ajouter des tags').fill(LONG_TAG)
  await panel.getByLabel('Ajouter des tags').press('Enter')

  await panel.getByRole('button', { name: 'Écrire' }).click()
  await panel.getByLabel('Notes (Markdown)').fill(LONG_NOTES)
  await panel.getByRole('button', { name: 'Aperçu' }).click()

  await panel.getByRole('button', { name: 'Ajouter une source' }).click()
  await page.getByRole('menuitem', { name: 'Nouvelle source' }).click()
  const dialog = page.getByRole('dialog', { name: 'Nouvelle source' })
  await dialog.getByLabel('Titre').fill(LONG_SOURCE)
  await dialog.getByTestId('screenshot-input').setInputFiles(png)
  await dialog.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(dialog).toBeHidden()
}

/** The container never scrolls sideways and none of its content sticks out of it. */
async function expectFits(container: Locator) {
  const overflow = await container.evaluate((root) => {
    const right = root.getBoundingClientRect().right
    const sticking = [...root.querySelectorAll('*')]
      .filter((el) => el.getBoundingClientRect().right > right + 0.5)
      .map((el) => el.outerHTML.slice(0, 80))
    return { scroll: root.scrollWidth - root.clientWidth, sticking }
  })
  expect(overflow).toEqual({ scroll: 0, sticking: [] })
}

test('the side panel wraps long content instead of scrolling sideways', async ({ page }) => {
  await createInvestigation(page, 'Panneau')
  await addEntityAt(page, 150, 150, 'Damien Verlac')
  const panel = page.getByRole('complementary', { name: 'Panneau de détail' })
  await expect(panel.getByLabel('Libellé')).toHaveValue('Damien Verlac')

  await fillWithLongContent(page, panel)

  await expect(panel.getByLabel('Valeur de date de naissance')).toBeVisible()
  await expect(panel.getByText(LONG_TAG)).toBeVisible()
  await expect(panel.getByText(LONG_SOURCE)).toBeVisible()
  await expectFits(panel)
})

test('the mobile drawer wraps long content instead of scrolling sideways', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await createInvestigation(page, 'Tiroir')
  await addEntityAt(page, 150, 150, 'Damien Verlac')
  const drawer = page.getByRole('region', { name: 'Panneau de détail' })
  await drawer.getByRole('button', { name: 'Déplier le panneau' }).click()

  await fillWithLongContent(page, drawer)

  await expect(drawer.getByText(LONG_SOURCE)).toBeVisible()
  await expectFits(drawer)
})
