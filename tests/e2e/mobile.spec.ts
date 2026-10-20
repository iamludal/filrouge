import { expect, test, type Page } from '@playwright/test'
import { addEntityAt, createInvestigation } from './helpers.js'
import { Finger } from './touch.js'

// Runs on the "mobile" project (Pixel 7: 412 × 915, touch).

const node = (page: Page, name: string) => page.locator('.react-flow__node', { hasText: name })
const drawer = (page: Page) => page.getByRole('region', { name: 'Panneau de détail' })
const handle = (page: Page) =>
  drawer(page).getByRole('button', { name: /Déplier le panneau|Replier le panneau/ })
const menuButton = (page: Page) => page.getByRole('button', { name: `Plus d'actions` })
const saved = (page: Page) => expect(page.getByRole('status', { name: 'Enregistré' })).toBeVisible()

async function openMenu(page: Page) {
  await menuButton(page).click()
}

/** A finger dragging the drawer handle vertically by `dy` pixels. */
async function dragHandle(page: Page, dy: number) {
  const box = (await handle(page).boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x, y + dy / 2, { steps: 4 })
  await page.mouse.move(x, y + dy, { steps: 4 })
  await page.mouse.up()
}

async function noHorizontalScroll(page: Page) {
  const { scroll, inner } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    inner: window.innerWidth,
  }))
  expect(scroll).toBe(inner)
}

test.describe('layout', () => {
  test('keeps the page itself from scrolling and the drawer inside the window', async ({ page }) => {
    await createInvestigation(page, 'Hauteur')
    await addEntityAt(page, 100, 150, 'Alice')
    await node(page, 'Alice').tap()
    const { scroll, inner } = await page.evaluate(() => ({
      scroll: document.documentElement.scrollHeight,
      inner: window.innerHeight,
    }))
    expect(scroll).toBeLessThanOrEqual(inner)
    const box = (await drawer(page).boundingBox())!
    expect(box.y + box.height).toBeLessThanOrEqual(inner)
    await expect(page.locator('.react-flow__controls')).toBeInViewport({ ratio: 1 })
    // A reload must not bring back a scroll offset that would shift the whole app.
    expect(await page.evaluate(() => history.scrollRestoration)).toBe('manual')
  })

  test('uses the narrow layout on a phone and the desktop one from 768 px', async ({ page }) => {
    await createInvestigation(page, 'Mise en page')
    await expect(menuButton(page)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Exporter' })).toHaveCount(0)

    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByRole('complementary')).toBeVisible()
    await expect(menuButton(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Exporter' })).toBeVisible()
  })

  test('keeps the selection when the viewport is rotated', async ({ page }) => {
    await createInvestigation(page, 'Rotation')
    await addEntityAt(page, 150, 150, 'Alice')
    await expect(drawer(page)).toBeVisible()

    await page.setViewportSize({ width: 915, height: 412 })
    await expect(page.getByRole('complementary')).toBeVisible()
    await expect(page.getByLabel('Libellé')).toHaveValue('Alice')

    await page.setViewportSize({ width: 412, height: 915 })
    await expect(drawer(page)).toContainText('Alice')
  })

  test('never scrolls horizontally at 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    for (const name of ['Première', 'Deuxième', 'Troisième']) await createInvestigation(page, name)
    await page.goto('/')
    await expect(page.getByRole('list', { name: 'Liste des enquêtes' }).getByRole('listitem')).toHaveCount(3)
    await noHorizontalScroll(page)

    await createInvestigation(page, 'Une enquête au nom vraiment très long pour vérifier la troncature')
    await noHorizontalScroll(page)
  })

  test('hides the mini-map and keeps the zoom controls', async ({ page }) => {
    await createInvestigation(page, 'Minimap')
    await expect(page.getByLabel('Mini-carte')).toHaveCount(0)
    await expect(page.locator('.react-flow__controls')).toBeVisible()
  })

  test('makes the toolbar buttons at least 44 px', async ({ page }) => {
    await createInvestigation(page, 'Cibles')
    for (const name of ['Retour aux enquêtes', 'Rechercher dans le graphe', 'Annuler', `Plus d'actions`]) {
      const box = (await page
        .getByRole(name === 'Retour aux enquêtes' ? 'link' : 'button', { name })
        .boundingBox())!
      expect(box.width, name).toBeGreaterThanOrEqual(44)
      expect(box.height, name).toBeGreaterThanOrEqual(44)
    }
  })

  test('fits dialogs in a 360 × 640 viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 })
    await createInvestigation(page, 'Dialogues')
    await addEntityAt(page, 150, 150, 'Alice')
    await handle(page).click()
    await page.getByRole('button', { name: 'Ajouter une source' }).click()
    await page.getByRole('menuitem', { name: 'Nouvelle source' }).click()

    const dialog = page.getByRole('dialog', { name: 'Nouvelle source' })
    const box = (await dialog.boundingBox())!
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(360)
    expect(box.height).toBeLessThanOrEqual(640)

    const save = dialog.getByRole('button', { name: 'Enregistrer' })
    await save.scrollIntoViewIfNeeded()
    await expect(save).toBeInViewport()
  })
})

test.describe('compact toolbar', () => {
  test('keeps the essentials in the bar and the rest in the menu', async ({ page }) => {
    await createInvestigation(page, 'Barre')
    await expect(page.getByRole('heading', { name: 'Barre' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Rechercher dans le graphe' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Annuler' })).toBeVisible()
    for (const name of [/^Filtres/, /^Sources/, 'Exporter'])
      await expect(page.getByRole('button', { name })).toHaveCount(0)

    await openMenu(page)
    for (const name of ['Rétablir', 'Filtres', 'Sources (0)', 'JSON', 'PNG', 'SVG'])
      await expect(page.getByRole('menuitem', { name })).toBeVisible()
  })

  test('shows the save status as an icon', async ({ page }) => {
    await createInvestigation(page, 'Statut')
    const status = page.getByRole('status', { name: 'Enregistré' })
    await expect(status).toBeVisible()
    await expect(status).toHaveText('')
  })

  test('exports the graph as SVG from the menu', async ({ page }) => {
    await createInvestigation(page, 'Export')
    await addEntityAt(page, 150, 150, 'Alice')
    await saved(page)
    await openMenu(page)
    const download = page.waitForEvent('download')
    await page.getByRole('menuitem', { name: 'SVG' }).click()
    expect((await download).suggestedFilename()).toMatch(/\.svg$/)
  })

  test('opens the filters in a dialog, signals them on the menu and dims the rest', async ({ page }) => {
    await createInvestigation(page, 'Filtres')
    await addEntityAt(page, 100, 150, 'Alice')
    await addEntityAt(page, 300, 150, 'Courriel')
    await handle(page).click()
    await drawer(page).getByRole('combobox', { name: 'Type' }).click()
    await page.getByRole('option', { name: 'Email' }).click()
    await saved(page)
    await page.getByRole('button', { name: 'Fermer' }).click()

    await openMenu(page)
    await page.getByRole('menuitem', { name: 'Filtres' }).click()
    const dialog = page.getByRole('dialog', { name: 'Filtres' })
    await dialog.getByRole('checkbox', { name: /Email/ }).check()
    await page.keyboard.press('Escape')

    await expect(page.getByTestId('filters-dot')).toBeVisible()
    await expect(node(page, 'Alice').locator('[title]').first()).toHaveClass(/opacity-25/)
    await expect(node(page, 'Courriel').locator('[title]').first()).not.toHaveClass(/opacity-25/)
    await openMenu(page)
    await expect(page.getByRole('menuitem', { name: /^Filtres\s*1$/ })).toBeVisible()
  })

  test('reveals the search field, finds elements and closes back to the toolbar', async ({ page }) => {
    await createInvestigation(page, 'Recherche')
    await addEntityAt(page, 100, 150, 'Alice')
    await addEntityAt(page, 300, 150, 'Bob')

    await page.getByRole('button', { name: 'Rechercher dans le graphe' }).click()
    const field = page.getByRole('textbox', { name: 'Rechercher dans le graphe' })
    await expect(field).toBeFocused()
    await field.fill('alice')
    await expect(page.getByText('1 résultat')).toBeVisible()
    await expect(node(page, 'Bob').locator('[title]').first()).toHaveClass(/opacity-25/)

    await page.getByRole('button', { name: 'Fermer la recherche' }).click()
    await expect(page.getByRole('heading', { name: 'Recherche' })).toBeVisible()
    await expect(node(page, 'Bob').locator('[title]').first()).not.toHaveClass(/opacity-25/)
  })
})

test.describe('detail drawer', () => {
  test('is hidden until something is selected, then collapsed with a summary', async ({ page }) => {
    await createInvestigation(page, 'Tiroir')
    await expect(drawer(page)).toHaveCount(0)

    await addEntityAt(page, 150, 150, 'Jean')
    await expect(drawer(page)).toBeVisible()
    await expect(handle(page)).toContainText('Personne')
    await expect(handle(page)).toContainText('Jean')
    await expect(page.getByLabel('Libellé')).toBeHidden()
  })

  test('lets the canvas above it stay usable, and hides when the canvas is tapped', async ({ page }) => {
    await createInvestigation(page, 'Canevas')
    await addEntityAt(page, 100, 150, 'Alice')
    await addEntityAt(page, 300, 150, 'Bob')
    await expect(handle(page)).toContainText('Bob')

    await node(page, 'Alice').click()
    await expect(handle(page)).toContainText('Alice')

    await page.locator('.react-flow__pane').click({ position: { x: 200, y: 400 } })
    await expect(drawer(page)).toHaveCount(0)
  })

  test('expands by tapping the handle and collapses again', async ({ page }) => {
    await createInvestigation(page, 'Dépliage')
    await addEntityAt(page, 150, 150, 'Jean')
    await handle(page).click()
    await expect(page.getByLabel('Libellé')).toHaveValue('Jean')
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'true')

    await handle(page).click()
    await expect(page.getByLabel('Libellé')).toBeHidden()
  })

  test('expands and collapses by dragging the handle, ignoring a short drag', async ({ page }) => {
    await createInvestigation(page, 'Glisser')
    await addEntityAt(page, 150, 150, 'Jean')

    await dragHandle(page, -20)
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'false')

    await dragHandle(page, -150)
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'true')
    const height = (await drawer(page).boundingBox())!.height
    expect(height).toBeLessThanOrEqual(915 * 0.85 + 1)

    await dragHandle(page, 150)
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'false')
    await expect(drawer(page)).toContainText('Jean')
  })

  test('closes with “Fermer” and by swiping down from collapsed, and restarts collapsed', async ({
    page,
  }) => {
    await createInvestigation(page, 'Fermeture')
    await addEntityAt(page, 100, 150, 'Alice')
    await addEntityAt(page, 300, 150, 'Bob')

    await handle(page).click()
    await drawer(page).getByRole('button', { name: 'Fermer' }).click()
    await expect(drawer(page)).toHaveCount(0)

    await node(page, 'Alice').click()
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'false')
    await dragHandle(page, 150)
    await expect(drawer(page)).toHaveCount(0)
  })

  test('summarises a relation and switches element while expanded', async ({ page }) => {
    await createInvestigation(page, 'Résumés')
    await addEntityAt(page, 100, 150, 'Alice')
    await addEntityAt(page, 300, 150, 'Bob')

    const source = node(page, 'Alice')
    await source.click()
    await source.hover()
    const start = (await source.locator('.react-flow__handle.source').boundingBox())!
    const end = (await node(page, 'Bob').boundingBox())!
    await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
    await page.mouse.down()
    await page.mouse.move(end.x + end.width / 2, end.y + 20, { steps: 10 })
    await page.mouse.up()
    await page.getByRole('dialog', { name: 'Nouvelle relation' }).getByLabel('Libellé').fill('connaît')
    await page.getByRole('button', { name: 'Créer la relation' }).click()

    await expect(handle(page)).toContainText('connaît')
    await expect(handle(page)).toContainText('Alice → Bob')

    await handle(page).click()
    await page.locator('.react-flow__node', { hasText: 'Bob' }).click({ force: true })
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByLabel('Libellé')).toHaveValue('Bob')
  })

  test('shows the element dates only once the drawer is expanded', async ({ page }) => {
    await createInvestigation(page, 'Dates')
    await addEntityAt(page, 150, 150, 'Jean')
    await expect(page.getByLabel(/^Créée le /)).toBeHidden()
    await handle(page).click()
    await expect(page.getByLabel(/^Créée le /)).toBeVisible()
  })

  test('saves edits made in the drawer', async ({ page }) => {
    await createInvestigation(page, 'Édition')
    await addEntityAt(page, 150, 150, 'Alice')
    await handle(page).click()
    await page.getByLabel('Libellé').fill('Alpha')
    await saved(page)
    await page.reload()
    await expect(node(page, 'Alpha')).toBeVisible()
  })
})

test.describe('touch gestures', () => {
  const newEntityDialog = (page: Page) => page.getByRole('dialog', { name: 'Nouvelle entité' })

  /** A point of the empty canvas, in viewport coordinates. */
  async function emptyPoint(page: Page, dx = 100, dy = 250) {
    const pane = (await page.locator('.react-flow__pane').boundingBox())!
    return { x: pane.x + dx, y: pane.y + dy }
  }

  test('a long press on the empty canvas adds an entity there', async ({ page }) => {
    await createInvestigation(page, 'Appui long')
    await (await Finger.on(page)).hold(await emptyPoint(page), 650)

    const dialog = newEntityDialog(page)
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Libellé').fill('Pressée')
    await dialog.getByRole('button', { name: 'Ajouter', exact: true }).click()
    await expect(node(page, 'Pressée')).toBeVisible()
    await expect(handle(page)).toContainText('Pressée')
  })

  test('a press that moves pans the view instead', async ({ page }) => {
    await createInvestigation(page, 'Glissement')
    const viewport = page.locator('.react-flow__viewport')
    const before = await viewport.getAttribute('style')

    const from = await emptyPoint(page)
    await (await Finger.on(page)).drag(from, { x: from.x + 30, y: from.y + 30 }, 6)

    await expect(viewport).not.toHaveAttribute('style', before!)
    await page.waitForTimeout(700)
    await expect(newEntityDialog(page)).toHaveCount(0)
  })

  test('a short tap on the canvas does not open the dialog', async ({ page }) => {
    await createInvestigation(page, 'Tap')
    const at = await emptyPoint(page)
    await page.touchscreen.tap(at.x, at.y)
    await page.waitForTimeout(700)
    await expect(newEntityDialog(page)).toHaveCount(0)
  })

  test('drags a relation from a selected entity with a finger, off-centre of the handle', async ({
    page,
  }) => {
    await createInvestigation(page, 'Relation tactile')
    await addEntityAt(page, 100, 150, 'Alice')
    await addEntityAt(page, 300, 150, 'Bob')
    await node(page, 'Alice').click()

    const dot = (await node(page, 'Alice').locator('.react-flow__handle.source').boundingBox())!
    const bob = (await node(page, 'Bob').boundingBox())!
    // 15 px to the side of the 12 px dot's centre: outside it, inside the 44 px touch area.
    const from = { x: dot.x + dot.width / 2 + 15, y: dot.y + dot.height / 2 }
    await (await Finger.on(page)).drag(from, { x: bob.x + bob.width / 2, y: bob.y + 20 })

    await expect(page.getByRole('dialog', { name: 'Nouvelle relation' })).toBeVisible()
  })
})

test.describe('language', () => {
  test.use({ locale: 'fr-FR' })

  test('the language menu is reachable at 360 px and English fits without horizontal scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 640 })
    await createInvestigation(page, 'Langue mobile')
    await addEntityAt(page, 100, 100, 'Alice')
    await noHorizontalScroll(page)

    const menu = page.getByRole('button', { name: 'Changer de langue' })
    await expect(menu).toBeVisible()
    await menu.tap()
    await page.getByRole('menuitemradio', { name: 'English' }).tap()

    await expect(page.getByRole('button', { name: 'More actions' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Change language' })).toBeVisible()
    await noHorizontalScroll(page)
    await node(page, 'Alice').tap()
    await expect(drawer(page).or(page.getByRole('region', { name: 'Detail panel' }))).toBeVisible()
    await noHorizontalScroll(page)
  })
})

test.describe('pivot tools', () => {
  test('makes the tools section targets at least 44 px in the drawer', async ({ page }) => {
    await createInvestigation(page, 'Outils mobile')
    await addEntityAt(page, 100, 150, 'exemple.fr')
    await node(page, 'exemple.fr').tap()
    await handle(page).click()
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'true')

    await drawer(page).getByRole('combobox', { name: 'Type' }).click()
    await page.getByRole('option', { name: 'Domaine' }).click()

    const toggle = drawer(page).getByRole('tab', { name: /^Outils/ })
    await toggle.scrollIntoViewIfNeeded()
    await toggle.click()
    const targets = {
      'onglet Outils': toggle,
      'lien crt.sh': drawer(page).getByRole('link', { name: /crt\.sh/ }),
      'case crt.sh': drawer(page).getByRole('checkbox', { name: 'Marquer crt.sh comme utilisé' }),
    }
    for (const [name, target] of Object.entries(targets)) {
      await target.scrollIntoViewIfNeeded()
      const box = (await target.boundingBox())!
      expect(box.width, name).toBeGreaterThanOrEqual(44)
      expect(box.height, name).toBeGreaterThanOrEqual(44)
    }
    await noHorizontalScroll(page)
  })

  test('keeps each tool checkbox on the line of its link at 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 })
    await createInvestigation(page, 'Lignes outils')
    await addEntityAt(page, 100, 150, 'jean@example.org')
    await node(page, 'jean@example.org').tap()
    await handle(page).click()
    await drawer(page).getByRole('combobox', { name: 'Type' }).click()
    await page.getByRole('option', { name: 'Email' }).click()
    await drawer(page)
      .getByRole('tab', { name: /^Outils/ })
      .click()

    const rows = drawer(page).getByRole('listitem')
    const count = await rows.count()
    expect(count).toBeGreaterThan(5)
    for (let index = 0; index < count; index++) {
      const row = rows.nth(index)
      await row.scrollIntoViewIfNeeded()
      const box = (await row.getByRole('checkbox').boundingBox())!
      const link = (await row.getByRole('link').boundingBox())!
      expect(Math.abs(box.y + box.height / 2 - (link.y + link.height / 2)), `row ${index}`).toBeLessThan(4)
    }
    await noHorizontalScroll(page)
  })
})

test.describe('entity appearance', () => {
  test('fits the icon picker in the screen with 44 px targets, from the expanded drawer', async ({
    page,
  }) => {
    await createInvestigation(page, 'Apparence mobile')
    await addEntityAt(page, 100, 150, 'Alice')
    await node(page, 'Alice').tap()
    await handle(page).click()
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'true')

    await drawer(page)
      .getByRole('button', { name: /^Icône ?:/ })
      .click()
    const cells = page.getByRole('radiogroup', { name: 'Icône' }).getByRole('radio')
    await expect(cells).toHaveCount(45)
    for (let index = 0; index < 45; index++) {
      const cell = cells.nth(index)
      await cell.scrollIntoViewIfNeeded()
      const box = (await cell.boundingBox())!
      // Sub-pixel rounding after scrolling: 44 px is reported as 43.99998.
      expect(box.width, `icône ${index}`).toBeGreaterThanOrEqual(43.9)
      expect(box.height, `icône ${index}`).toBeGreaterThanOrEqual(43.9)
    }
    await noHorizontalScroll(page)

    await page.getByRole('radio', { name: 'Crâne' }).tap()
    await expect(node(page, 'Alice').locator('svg.lucide-skull')).toBeVisible()
  })
})
