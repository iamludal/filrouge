import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

const lang = (page: Page) => page.evaluate(() => document.documentElement.lang)

async function pickLanguage(page: Page, name: 'Français' | 'English') {
  await page.getByRole('button', { name: /^(Changer de langue|Change language)$/ }).click()
  await page.getByRole('menuitemradio', { name }).click()
}

test.describe('browser in English', () => {
  test.use({ locale: 'en-US' })

  test('shows the interface in English with lang="en"', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'New investigation' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Investigations' })).toBeVisible()
    await expect(page.getByText('Nouvelle enquête')).toHaveCount(0)
    expect(await lang(page)).toBe('en')
    await expect(page).toHaveTitle('Filrouge')
  })

  test('remembers a language chosen in the menu after a reload', async ({ page }) => {
    await page.goto('/')
    await pickLanguage(page, 'Français')
    await expect(page.getByRole('button', { name: 'Nouvelle enquête' })).toBeVisible()
    expect(await lang(page)).toBe('fr')
    await page.reload()
    await expect(page.getByRole('button', { name: 'Nouvelle enquête' })).toBeVisible()
    expect(await lang(page)).toBe('fr')
  })
})

test.describe('browser in an unsupported language', () => {
  test.use({ locale: 'de-DE' })

  test('falls back to English', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'New investigation' })).toBeVisible()
    expect(await lang(page)).toBe('en')
  })
})

test.describe('browser in French', () => {
  test.use({ locale: 'fr-FR' })

  test('shows the interface in French, then in English once chosen, and keeps it after a reload', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Nouvelle enquête' })).toBeVisible()
    expect(await lang(page)).toBe('fr')
    await pickLanguage(page, 'English')
    await expect(page.getByRole('button', { name: 'New investigation' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('button', { name: 'New investigation' })).toBeVisible()
    expect(await lang(page)).toBe('en')
  })

  test('switching mid-edit keeps the investigation, the selection and the undo history', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Nouvelle enquête' }).click()
    await page.getByLabel('Nom').fill('Langues')
    await page.getByRole('button', { name: 'Créer', exact: true }).click()
    await page.locator('.react-flow__pane').dblclick({ position: { x: 200, y: 200 } })
    await page.getByRole('dialog').getByLabel('Libellé').fill('Alice')
    await page.getByRole('dialog').getByRole('button', { name: 'Ajouter', exact: true }).click()
    const alice = page.locator('.react-flow__node', { hasText: 'Alice' })
    await alice.click()
    await expect(page.getByRole('complementary')).toContainText('Personne')

    await pickLanguage(page, 'English')

    await expect(page.getByRole('complementary')).toContainText('Person')
    await expect(page.getByRole('complementary')).not.toContainText('Personne')
    await expect(page.getByLabel('Label')).toHaveValue('Alice')
    await expect(alice).toBeVisible()
    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.locator('.react-flow__node')).toHaveCount(0)
  })

  test('an export is identical before and after a switch, except for its timestamp', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Nouvelle enquête' }).click()
    await page.getByLabel('Nom').fill('Export')
    await page.getByRole('button', { name: 'Créer', exact: true }).click()
    await page.locator('.react-flow__pane').dblclick({ position: { x: 200, y: 200 } })
    await page.getByRole('dialog').getByLabel('Libellé').fill('Alice')
    await page.getByRole('dialog').getByRole('button', { name: 'Ajouter', exact: true }).click()
    await expect(page.getByRole('status')).toHaveText('Enregistré')

    const exportOnce = async (menu: string) => {
      const download = page.waitForEvent('download')
      await page.getByRole('button', { name: menu, exact: true }).click()
      await page.getByRole('menuitem', { name: 'JSON' }).click()
      return JSON.parse(await readFile(await (await download).path(), 'utf8')) as Record<string, unknown>
    }
    const before = await exportOnce('Exporter')
    await pickLanguage(page, 'English')
    const after = await exportOnce('Export')

    const strip = ({ exportedAt: _, ...rest }: Record<string, unknown>) => rest
    expect(strip(after)).toEqual(strip(before))
  })

  test('an invalid import is explained in the active language', async ({ page }) => {
    await page.goto('/')
    await pickLanguage(page, 'English')
    await page.getByTestId('import-input').setInputFiles({
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{nope'),
    })
    await expect(page.getByText('Import refused: invalid file')).toBeVisible()
    await expect(page.getByText('The file is not valid JSON')).toBeVisible()
  })
})
