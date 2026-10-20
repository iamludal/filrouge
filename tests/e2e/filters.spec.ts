import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { addEntityAt, connect, createInvestigation } from './helpers.js'

const node = (page: Page, name: string) => page.locator('.react-flow__node', { hasText: name })
/** The element React Flow fades: the node's root, which carries the label as its title. */
const body = (page: Page, name: string) => node(page, name).locator('[title]').first()
const link = (page: Page, label: string) => page.getByText(label, { exact: true })
const filtersButton = (page: Page) => page.getByRole('button', { name: /Filtres/ })
const panel = (page: Page) => page.getByRole('complementary')
const search = (page: Page) => page.getByRole('textbox', { name: 'Rechercher dans le graphe' })
const saved = (page: Page) => expect(page.getByRole('status')).toHaveText('Enregistré')

const dimmed = (page: Page, name: string) => expect(body(page, name)).toHaveClass(/opacity-25/)
const shown = (page: Page, name: string) => expect(body(page, name)).not.toHaveClass(/opacity-25/)
const linkDimmed = (page: Page, label: string) => expect(link(page, label)).toHaveClass(/opacity-25/)
const linkShown = (page: Page, label: string) => expect(link(page, label)).not.toHaveClass(/opacity-25/)

/** Alice and Bob (Personne) linked by a hypothetical "connaît"; Bob and Courriel (Email) by a verified "utilise". */
async function buildGraph(page: Page) {
  await createInvestigation(page, 'Filtres')
  await addEntityAt(page, 150, 100, 'Alice')
  await addEntityAt(page, 450, 100, 'Bob')
  await addEntityAt(page, 300, 300, 'Courriel')
  await connect(page, 'Alice', 'Bob', 'connaît')
  await connect(page, 'Bob', 'Courriel', 'utilise', { hypothesis: false })

  await node(page, 'Courriel').click()
  await panel(page).getByRole('combobox', { name: 'Type' }).click()
  await page.getByRole('option', { name: 'Email' }).click()
  await saved(page)
}

async function addTag(page: Page, name: string, tag: string) {
  await node(page, name).click()
  await page.getByLabel('Ajouter des tags').fill(tag)
  await page.getByLabel('Ajouter des tags').press('Enter')
}

async function grade(page: Page, name: string, reliability: string, credibility: string) {
  await node(page, name).click()
  await panel(page).getByRole('combobox', { name: 'Fiabilité de la source' }).click()
  await page.getByRole('option', { name: reliability }).click()
  await panel(page).getByRole('combobox', { name: 'Crédibilité de l’information' }).click()
  await page.getByRole('option', { name: credibility }).click()
}

async function openFilters(page: Page) {
  await filtersButton(page).click()
  return page.getByRole('dialog')
}

async function closeFilters(page: Page) {
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()
}

test('filtering by type dims the others and the links to them', async ({ page }) => {
  await buildGraph(page)
  const filters = await openFilters(page)
  await expect(filters.getByRole('checkbox', { name: 'Personne (2)' })).toBeVisible()
  await expect(filters.getByRole('checkbox', { name: 'Email (1)' })).toBeVisible()
  await expect(filters.getByRole('checkbox', { name: /Domaine/ })).toHaveCount(0)

  await filters.getByRole('checkbox', { name: 'Email (1)' }).click()

  await shown(page, 'Courriel')
  await dimmed(page, 'Alice')
  await dimmed(page, 'Bob')
  await linkDimmed(page, 'connaît')
  await linkDimmed(page, 'utilise') // Bob, one of its ends, is dimmed
  await expect(filtersButton(page)).toContainText('1')
})

test('filtering by tag ignores case', async ({ page }) => {
  await buildGraph(page)
  await addTag(page, 'Alice', 'cible')
  await addTag(page, 'Bob', 'Cible')
  await saved(page)

  const filters = await openFilters(page)
  await expect(filters.getByRole('checkbox', { name: /^(Cible|cible)$/ })).toHaveCount(1)
  await filters.getByRole('checkbox', { name: /^(Cible|cible)$/ }).click()

  await shown(page, 'Alice')
  await shown(page, 'Bob')
  await dimmed(page, 'Courriel')
})

test('only verified relations, with every entity still shown', async ({ page }) => {
  await buildGraph(page)
  const filters = await openFilters(page)
  await filters
    .getByRole('group', { name: 'Statut des relations' })
    .getByRole('radio', { name: 'Vérifiés' })
    .click()

  await shown(page, 'Alice')
  await shown(page, 'Bob')
  await shown(page, 'Courriel')
  await linkDimmed(page, 'connaît')
  await linkShown(page, 'utilise')

  await filters
    .getByRole('group', { name: 'Statut des relations' })
    .getByRole('radio', { name: 'Tous' })
    .click()
  await linkShown(page, 'connaît')
  await expect(filtersButton(page)).not.toContainText(/\d/)
})

test('only hypothetical entities', async ({ page }) => {
  await buildGraph(page)
  await node(page, 'Alice').click()
  await panel(page).getByRole('switch', { name: 'Hypothèse' }).click()
  await saved(page)

  const filters = await openFilters(page)
  await filters
    .getByRole('group', { name: 'Statut des entités' })
    .getByRole('radio', { name: 'Hypothèses' })
    .click()

  await shown(page, 'Alice')
  await dimmed(page, 'Bob')
  await dimmed(page, 'Courriel')
  await linkDimmed(page, 'connaît') // Bob is dimmed
})

test('minimum confidence, and excluding ungraded elements', async ({ page }) => {
  await buildGraph(page)
  await grade(page, 'Alice', 'B — Habituellement fiable', '2 — Probablement vraie')
  await grade(page, 'Bob', 'C — Assez fiable', '1 — Confirmée')

  const filters = await openFilters(page)
  await filters.getByRole('combobox', { name: 'Fiabilité au moins' }).click()
  await page.getByRole('option', { name: 'B — Habituellement fiable' }).click()
  await shown(page, 'Alice')
  await dimmed(page, 'Bob')
  await shown(page, 'Courriel') // ungraded, still included

  await filters.getByRole('checkbox', { name: 'Inclure les éléments non cotés' }).click()
  await dimmed(page, 'Courriel')
  await shown(page, 'Alice')

  await filters.getByRole('combobox', { name: 'Crédibilité au moins' }).click()
  await page.getByRole('option', { name: '1 — Confirmée' }).click()
  await dimmed(page, 'Alice') // B2 is not credible enough
  await expect(filtersButton(page)).toContainText('1') // thresholds and ungraded are one criterion
})

test('a dimmed entity is still editable, and nothing matching is said', async ({ page }) => {
  await buildGraph(page)
  const filters = await openFilters(page)
  await filters.getByRole('checkbox', { name: 'Email (1)' }).click()
  await filters.getByRole('checkbox', { name: 'Inclure les éléments non cotés' }).click()
  await expect(page.getByText('Aucun élément ne correspond aux filtres.')).toBeVisible()
  await closeFilters(page)
  await dimmed(page, 'Alice')

  await node(page, 'Alice').click()
  await expect(page.getByLabel('Libellé')).toHaveValue('Alice')
  await page.getByLabel('Libellé').fill('Alice D.')
  await expect(node(page, 'Alice D.')).toBeVisible()
  await dimmed(page, 'Alice D.')
})

test('the badge counts the criteria and the reset clears them', async ({ page }) => {
  await buildGraph(page)
  const filters = await openFilters(page)
  await expect(filters.getByRole('button', { name: 'Réinitialiser' })).toBeDisabled()

  await filters.getByRole('checkbox', { name: 'Email (1)' }).click()
  await filters.getByRole('checkbox', { name: 'Personne (2)' }).click()
  await filters
    .getByRole('group', { name: 'Statut des relations' })
    .getByRole('radio', { name: 'Vérifiés' })
    .click()
  await expect(filtersButton(page)).toContainText('2')

  await filters.getByRole('button', { name: 'Réinitialiser' }).click()
  await expect(filtersButton(page)).not.toContainText(/\d/)
  await closeFilters(page)
  for (const name of ['Alice', 'Bob', 'Courriel']) await shown(page, name)
})

test('search results are taken among the elements that pass the filters', async ({ page }) => {
  await buildGraph(page)
  await node(page, 'Bob').click()
  await page.getByLabel('Libellé').fill('Dupont courriel')
  await search(page).fill('courriel')
  await expect(page.getByText('2 résultats')).toBeVisible()

  const filters = await openFilters(page)
  await filters.getByRole('checkbox', { name: 'Email (1)' }).click()

  await expect(page.getByText('1 résultat')).toBeVisible()
  // Playwright's hasText ignores case, so the exact title is used to tell the two nodes apart.
  await expect(page.locator('.react-flow__node [title="Courriel"]')).not.toHaveClass(/opacity-25/)
  await dimmed(page, 'Dupont courriel')
})

test('filters are reset when the investigation is reopened', async ({ page }) => {
  await buildGraph(page)
  const filters = await openFilters(page)
  await filters.getByRole('checkbox', { name: 'Email (1)' }).click()
  await dimmed(page, 'Alice')
  await closeFilters(page)

  await page.getByRole('link', { name: 'Retour aux enquêtes' }).click()
  await page.getByRole('link', { name: /Filtres/ }).click()

  await expect(node(page, 'Alice')).toBeVisible()
  await expect(filtersButton(page)).not.toContainText(/\d/)
  await shown(page, 'Alice')
})

test('filters are not part of the undo history', async ({ page }) => {
  await buildGraph(page)
  await node(page, 'Bob').click()
  await page.getByLabel('Libellé').fill('Robert')
  await saved(page)

  const filters = await openFilters(page)
  await filters.getByRole('checkbox', { name: 'Email (1)' }).click()
  await closeFilters(page)
  await page.locator('.react-flow__pane').click({ position: { x: 20, y: 450 } })

  await page.keyboard.press('Control+z')
  await expect(node(page, 'Bob')).toBeVisible()
  await expect(node(page, 'Robert')).toHaveCount(0)
  await expect(filtersButton(page)).toContainText('1')
  await dimmed(page, 'Alice')
})

test('the SVG export draws every entity whatever the filters', async ({ page }) => {
  await buildGraph(page)
  const filters = await openFilters(page)
  await filters.getByRole('checkbox', { name: 'Email (1)' }).click()
  await closeFilters(page)
  await dimmed(page, 'Alice')

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter' }).click()
  await page.getByRole('menuitem', { name: 'SVG' }).click()
  const svg = (await readFile(await (await download).path())).toString('utf8')

  for (const label of ['Alice', 'Bob', 'Courriel', 'connaît', 'utilise']) expect(svg).toContain(label)
  expect(svg).not.toContain('opacity')
})
