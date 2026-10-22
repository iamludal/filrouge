import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { addEntityAt, connect, createInvestigation, exportJson } from './helpers.js'

type Positions = Record<string, { x: number; y: number }>

const node = (page: Page, name: string) => page.locator('.react-flow__node', { hasText: name })

/** Stored positions by entity label, read from the JSON export. */
async function stored(page: Page): Promise<Positions> {
  const download = page.waitForEvent('download')
  await exportJson(page)
  const file = JSON.parse((await readFile(await (await download).path())).toString('utf8')) as {
    entities: { label: string; position: { x: number; y: number } }[]
  }
  return Object.fromEntries(file.entities.map((entity) => [entity.label, entity.position]))
}

async function layout(page: Page, name: string) {
  await page.getByRole('button', { name: 'Mise en page' }).click()
  await page.getByRole('menuitem', { name }).click()
}

const distance = (p: Positions, a: string, b: string) => Math.hypot(p[a]!.x - p[b]!.x, p[a]!.y - p[b]!.y)

/** Waits until the stored positions differ from `before`. */
async function movedFrom(page: Page, before: Positions): Promise<Positions> {
  let after: Positions = before
  await expect
    .poll(async () => {
      after = await stored(page)
      return JSON.stringify(after) !== JSON.stringify(before)
    })
    .toBe(true)
  return after
}

/** A → B → C, and D alone, every entity added on one row. */
async function buildChain(page: Page, name: string) {
  await createInvestigation(page, name)
  await addEntityAt(page, 120, 300, 'Alpha')
  await addEntityAt(page, 320, 300, 'Bravo')
  await addEntityAt(page, 520, 300, 'Charlie')
  await addEntityAt(page, 720, 300, 'Delta')
  await connect(page, 'Alpha', 'Bravo', 'connaît')
  await connect(page, 'Bravo', 'Charlie', 'connaît')
  await page.locator('.react-flow__pane').click({ position: { x: 300, y: 500 } })
}

test('applies a layout on the grid, undone in one step, kept after a reload', async ({ page }) => {
  await buildChain(page, 'Organique')
  const before = await stored(page)

  await layout(page, 'Organique')
  const after = await movedFrom(page, before)
  for (const { x, y } of Object.values(after)) {
    expect(Math.abs(x % 16)).toBe(0)
    expect(Math.abs(y % 16)).toBe(0)
  }
  // Delta has no relation: it is placed apart from the Alpha–Bravo–Charlie group.
  expect(distance(after, 'Alpha', 'Bravo')).toBeLessThan(distance(after, 'Alpha', 'Delta'))

  await page.keyboard.press('ControlOrMeta+z')
  await expect.poll(async () => JSON.stringify(await stored(page))).toBe(JSON.stringify(before))

  await layout(page, 'Organique')
  const again = await movedFrom(page, before)
  expect(again).toEqual(after)
  await page.reload()
  await expect(node(page, 'Alpha')).toBeVisible()
  expect(await stored(page)).toEqual(after)
})

test('hierarchical layout follows the relations from top to bottom', async ({ page }) => {
  await buildChain(page, 'Hiérarchique')
  const before = await stored(page)
  await layout(page, 'Hiérarchique')
  const after = await movedFrom(page, before)
  expect(after.Alpha!.y).toBeLessThan(after.Bravo!.y)
  expect(after.Bravo!.y).toBeLessThan(after.Charlie!.y)
})

test('lays out only the selected entities', async ({ page }) => {
  await buildChain(page, 'Sélection')
  const before = await stored(page)
  await node(page, 'Alpha').click()
  await node(page, 'Bravo').click({ modifiers: ['ControlOrMeta'] })
  await node(page, 'Charlie').click({ modifiers: ['ControlOrMeta'] })

  await layout(page, 'Hiérarchique')
  const after = await movedFrom(page, before)
  expect(after.Delta).toEqual(before.Delta)
  expect(after.Alpha!.y).toBeLessThan(after.Charlie!.y)
})

test('radial layout centres the selected entity', async ({ page }) => {
  await buildChain(page, 'Radial')
  const before = await stored(page)
  await node(page, 'Bravo').click()

  await layout(page, 'Radial')
  const after = await movedFrom(page, before)
  expect(
    Math.abs(distance(after, 'Bravo', 'Alpha') - distance(after, 'Bravo', 'Charlie')),
  ).toBeLessThanOrEqual(24)
})

test('the layout menu works with the keyboard', async ({ page }) => {
  await buildChain(page, 'Clavier')
  const before = await stored(page)
  await page.getByRole('button', { name: 'Mise en page' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('menuitem', { name: 'Organique' })).toBeFocused()
  // The menu ignores arrow keys during its opening animation.
  await page.waitForTimeout(200)
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('menuitem', { name: 'Radial' })).toBeFocused()
  await page.keyboard.press('Enter')
  await movedFrom(page, before)
})

test('moves the entities at once when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await buildChain(page, 'Sans animation')
  const transform = () => node(page, 'Alpha').evaluate((element) => (element as HTMLElement).style.transform)
  const start = await transform()

  await layout(page, 'Organique')
  await expect.poll(transform, { intervals: [10] }).not.toBe(start)
  const first = await transform()
  await page.waitForTimeout(500)
  expect(await transform()).toBe(first)
})

test('loads the layout code on first use only, with no request outside the app', async ({
  page,
  baseURL,
}) => {
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  await buildChain(page, 'Réseau')
  expect(requests.some((url) => url.includes('elk-worker'))).toBe(false)

  const before = await stored(page)
  for (const name of ['Organique', 'Hiérarchique', 'Radial']) {
    const previous = await stored(page)
    await layout(page, name)
    if (name === 'Organique') await movedFrom(page, before)
    else await expect.poll(async () => JSON.stringify(await stored(page))).not.toBe(JSON.stringify(previous))
  }
  expect(requests.some((url) => url.includes('elk-worker'))).toBe(true)
  const origin = new URL(baseURL!).origin
  expect(
    requests.filter((url) => !url.startsWith(origin) && !url.startsWith('blob:') && !url.startsWith('data:')),
  ).toEqual([])
})
