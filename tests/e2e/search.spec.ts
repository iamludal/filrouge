import { expect, test, type Page } from '@playwright/test'
import { addEntityAt, connect, createInvestigation } from './helpers.js'

const node = (page: Page, name: string) => page.locator('.react-flow__node', { hasText: name })
/** The element React Flow fades: the node's root, which carries the label as its title. */
const body = (page: Page, name: string) => node(page, name).locator('[title]').first()
const circle = (page: Page, name: string) => body(page, name).locator('div').first()
const search = (page: Page) => page.getByRole('textbox', { name: 'Rechercher dans le graphe' })
const saved = (page: Page) => expect(page.getByRole('status')).toHaveText('Enregistré')

async function buildGraph(page: Page) {
  await createInvestigation(page, 'Recherche')
  await addEntityAt(page, 150, 100, 'Alice')
  await addEntityAt(page, 450, 100, 'Bob')
  await addEntityAt(page, 300, 300, 'Carole')
  await connect(page, 'Alice', 'Bob', 'connaît')
}

async function addTag(page: Page, name: string, tag: string) {
  await node(page, name).click()
  await page.getByLabel('Ajouter des tags').fill(tag)
  await page.getByLabel('Ajouter des tags').press('Enter')
}

test('results are highlighted, the rest dimmed but still editable, and edits update the results', async ({
  page,
}) => {
  await buildGraph(page)
  await search(page).fill('alice')

  await expect(page.getByText('1 résultat')).toBeVisible()
  await expect(circle(page, 'Alice')).toHaveClass(/ring-amber-400/)
  await expect(body(page, 'Alice')).not.toHaveClass(/opacity-25/)
  await expect(body(page, 'Bob')).toHaveClass(/opacity-25/)
  await expect(body(page, 'Carole')).toHaveClass(/opacity-25/)
  await expect(page.getByText('connaît', { exact: true })).toHaveClass(/opacity-25/)

  // A dimmed element is still selectable and editable, and an edit that makes it match shows at once.
  await node(page, 'Bob').click()
  await expect(page.getByLabel('Libellé')).toHaveValue('Bob')
  await page.getByLabel('Libellé').fill('Alice B.')
  await expect(page.getByText('2 résultats')).toBeVisible()
  await expect(body(page, 'Alice B.')).not.toHaveClass(/opacity-25/)
  await expect(circle(page, 'Alice B.')).not.toHaveClass(/ring-amber-400/) // selected: selection ring wins
})

test('finds text in properties, notes, tags and relation labels, ignoring case and accents', async ({
  page,
}) => {
  await buildGraph(page)

  await node(page, 'Alice').click()
  await page.getByLabel('Nouvelle propriété').fill('plateforme')
  await page.getByLabel('Nouvelle propriété').press('Enter')
  await page.getByLabel('Valeur de plateforme').fill('Télégram')
  await page.getByRole('button', { name: 'Écrire' }).click()
  await page.getByLabel('Notes (Markdown)').fill('vu à Lyon en 2021')
  await addTag(page, 'Bob', 'Suspect')
  await saved(page)

  await search(page).fill('telegram')
  await expect(page.getByText('1 résultat')).toBeVisible()
  await expect(body(page, 'Alice')).not.toHaveClass(/opacity-25/)

  await search(page).fill('LYON')
  await expect(page.getByText('1 résultat')).toBeVisible()
  await expect(body(page, 'Alice')).not.toHaveClass(/opacity-25/)

  await search(page).fill('susp')
  await expect(page.getByText('1 résultat')).toBeVisible()
  await expect(body(page, 'Bob')).not.toHaveClass(/opacity-25/)
  await expect(body(page, 'Alice')).toHaveClass(/opacity-25/)

  await search(page).fill('connait')
  await expect(page.getByText('connaît', { exact: true })).not.toHaveClass(/opacity-25/)
  await expect(body(page, 'Alice')).toHaveClass(/opacity-25/)

  await search(page).fill('introuvable')
  await expect(page.getByText('Aucun résultat')).toBeVisible()
  await expect(body(page, 'Alice')).toHaveClass(/opacity-25/)
})

test('Enter and Shift+Enter walk through the results, wrapping around', async ({ page }) => {
  await buildGraph(page)
  await addTag(page, 'Alice', 'cible')
  await addTag(page, 'Carole', 'cible')
  await saved(page)

  await search(page).fill('cible')
  await expect(page.getByText('2 résultats')).toBeVisible()

  await search(page).press('Enter')
  await expect(page.getByText('1 / 2')).toBeVisible()
  await expect(page.getByLabel('Libellé')).toHaveValue('Alice')

  await search(page).press('Enter')
  await expect(page.getByText('2 / 2')).toBeVisible()
  await expect(page.getByLabel('Libellé')).toHaveValue('Carole')

  await search(page).press('Enter')
  await expect(page.getByText('1 / 2')).toBeVisible()

  await search(page).press('Shift+Enter')
  await expect(page.getByText('2 / 2')).toBeVisible()
  await expect(page.getByLabel('Libellé')).toHaveValue('Carole')
})

test('the view centres on the current result without changing the zoom', async ({ page }) => {
  await buildGraph(page)
  await search(page).fill('carole')
  const scale = () =>
    page.locator('.react-flow__viewport').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a)
  const zoom = await scale()

  await search(page).press('Enter')
  const pane = (await page.locator('.react-flow').boundingBox())!
  await expect
    .poll(async () => {
      const b = (await circle(page, 'Carole').boundingBox())!
      return Math.abs(b.x + b.width / 2 - (pane.x + pane.width / 2))
    })
    .toBeLessThan(4)
  expect(await scale()).toBeCloseTo(zoom, 5)
})

test('navigating to a relation selects it', async ({ page }) => {
  await buildGraph(page)
  await search(page).fill('connaît')
  await search(page).press('Enter')

  await expect(page.getByText('1 / 1')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Relation' })).toBeVisible()
})

test('Ctrl+F focuses the search, Escape and the clear button empty it', async ({ page }) => {
  await buildGraph(page)

  await page.locator('.react-flow__pane').click({ position: { x: 20, y: 400 } })
  await page.keyboard.press('Control+f')
  await expect(search(page)).toBeFocused()

  await search(page).fill('alice')
  await expect(body(page, 'Bob')).toHaveClass(/opacity-25/)
  await search(page).press('Escape')
  await expect(search(page)).toHaveValue('')
  await expect(body(page, 'Bob')).not.toHaveClass(/opacity-25/)

  await search(page).fill('alice')
  await page.getByRole('button', { name: 'Effacer la recherche' }).click()
  await expect(search(page)).toHaveValue('')
  await expect(body(page, 'Bob')).not.toHaveClass(/opacity-25/)
})

test('Ctrl+F leaves the search alone while a dialog is open', async ({ page }) => {
  await buildGraph(page)
  await page.locator('.react-flow__pane').dblclick({ position: { x: 20, y: 400 } })
  await expect(page.getByRole('dialog', { name: 'Nouvelle entité' })).toBeVisible()

  await page.keyboard.press('Control+f')
  // An open dialog hides the rest of the page from the accessibility tree: look the field up by CSS.
  await expect(page.locator('input[aria-label="Rechercher dans le graphe"]')).not.toBeFocused()
})

test('the search is empty again when the investigation is reopened', async ({ page }) => {
  await buildGraph(page)
  await search(page).fill('alice')
  await expect(body(page, 'Bob')).toHaveClass(/opacity-25/)
  await saved(page)

  await page.getByRole('link', { name: 'Retour aux enquêtes' }).click()
  await page.getByRole('link', { name: /Recherche/ }).click()

  await expect(node(page, 'Bob')).toBeVisible()
  await expect(search(page)).toHaveValue('')
  await expect(body(page, 'Bob')).not.toHaveClass(/opacity-25/)
})
