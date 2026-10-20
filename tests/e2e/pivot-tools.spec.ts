import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { addEntityAt, createInvestigation, exportJson } from './helpers.js'

const node = (page: Page, name: string) => page.locator('.react-flow__node', { hasText: name })
const panel = (page: Page) => page.getByRole('complementary')
const saved = (page: Page) => expect(page.getByRole('status')).toHaveText('Enregistré')
const crtsh = (page: Page) => panel(page).getByRole('checkbox', { name: 'Marquer crt.sh comme utilisé' })

async function addDomain(page: Page, name: string) {
  await addEntityAt(page, 150, 150, name)
  await node(page, name).click()
  await panel(page).getByRole('combobox', { name: 'Type' }).click()
  await page.getByRole('option', { name: 'Domaine' }).click()
  await saved(page)
}

test('checks a tool on a domain: undone and redone from the toolbar, kept after a reload and exported', async ({
  page,
}) => {
  await createInvestigation(page, 'Outils')
  await addDomain(page, 'exemple.fr')

  const tab = panel(page).getByRole('tab', { name: /^Outils/ })
  await expect(panel(page).getByRole('tab', { name: 'Détails' })).toHaveAttribute('aria-selected', 'true')
  await tab.click()

  const link = panel(page).getByRole('link', { name: /crt\.sh/ })
  await expect(link).toHaveAttribute('href', 'https://crt.sh/?q=exemple.fr')
  await expect(link).toHaveAttribute('target', '_blank')
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer')

  await crtsh(page).check()
  await expect(tab).toContainText(/^Outils\s*1 \/ /)
  const checkedDate = panel(page).locator('time[aria-label^="Utilisé le"]')
  await expect(checkedDate).toHaveCount(1)
  const checkedAt = await checkedDate.getAttribute('datetime')

  await page.getByRole('button', { name: 'Annuler' }).click()
  await expect(crtsh(page)).not.toBeChecked()
  await page.getByRole('button', { name: 'Rétablir' }).click()
  await expect(crtsh(page)).toBeChecked()
  await expect(checkedDate).toHaveAttribute('datetime', checkedAt!)
  await saved(page)

  await page.reload()
  await node(page, 'exemple.fr').click()
  await panel(page)
    .getByRole('tab', { name: /^Outils/ })
    .click()
  await expect(crtsh(page)).toBeChecked()
  await expect(panel(page).locator('time[aria-label^="Utilisé le"]')).toHaveAttribute('datetime', checkedAt!)

  const downloadPromise = page.waitForEvent('download')
  await exportJson(page)
  const file = JSON.parse(await readFile(await (await downloadPromise).path(), 'utf8'))
  expect(file.entities[0].toolChecks).toEqual([{ toolId: 'crtsh', checkedAt }])
})

test('opening a tool does not check it', async ({ page, context }) => {
  await createInvestigation(page, 'Ouverture')
  await addDomain(page, 'exemple.fr')
  await panel(page)
    .getByRole('tab', { name: /^Outils/ })
    .click()

  // The new tab is only observed, never loaded: no request leaves the test.
  await context.route('https://crt.sh/**', (route) => route.abort())
  const popup = page.waitForEvent('popup')
  await panel(page)
    .getByRole('link', { name: /crt\.sh/ })
    .click()
  await (await popup).close()

  await expect(crtsh(page)).not.toBeChecked()
})
