import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { addEntityAt, connect, createInvestigation } from './helpers.js'

const node = (page: Page, name: string) => page.locator('.react-flow__node', { hasText: name })

/** Exports an image; a PNG goes through the scale dialog, at its default scale unless given. */
async function exportImage(page: Page, format: 'PNG' | 'SVG', scale?: string) {
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter' }).click()
  await page.getByRole('menuitem', { name: format }).click()
  if (format === 'PNG') {
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('radio', { name: /^4× \(recommandé\)/ })).toBeChecked()
    if (scale) await dialog.getByRole('radio', { name: new RegExp(`^${scale}`) }).check()
    await dialog.getByRole('button', { name: 'Exporter' }).click()
    await expect(dialog).toBeHidden()
  }
  const download = await downloadPromise
  return { filename: download.suggestedFilename(), bytes: await readFile(await download.path()) }
}

async function buildGraph(page: Page) {
  await createInvestigation(page, 'Opération Fil Rouge')
  await addEntityAt(page, 120, 120, 'Alice')
  await addEntityAt(page, 420, 120, 'Bob')
  await addEntityAt(page, 270, 320, 'Carole')
  await connect(page, 'Alice', 'Bob', 'connaît')
  await connect(page, 'Bob', 'Carole', 'emploie', { hypothesis: false })

  const panel = page.getByRole('complementary')
  await node(page, 'Alice').click()
  await panel.getByRole('combobox', { name: 'Fiabilité de la source' }).click()
  await page.getByRole('option', { name: 'B – Habituellement fiable' }).click()
  await panel.getByRole('combobox', { name: `Crédibilité de l'information` }).click()
  await page.getByRole('option', { name: '2 – Probablement vraie' }).click()
  await expect(node(page, 'Alice').getByText('B2')).toBeVisible()
}

test('image formats are disabled until the graph has an entity, JSON never is', async ({ page }) => {
  await createInvestigation(page, 'Vide')
  await page.getByRole('button', { name: 'Exporter' }).click()
  await expect(page.getByRole('menuitem', { name: 'JSON' })).toBeEnabled()
  await expect(page.getByRole('menuitem', { name: 'PNG' })).toBeDisabled()
  await expect(page.getByRole('menuitem', { name: 'SVG' })).toBeDisabled()
  await page.keyboard.press('Escape')

  await addEntityAt(page, 150, 150, 'Alice')
  await page.getByRole('button', { name: 'Exporter' }).click()
  await expect(page.getByRole('menuitem', { name: 'PNG' })).toBeEnabled()
  await expect(page.getByRole('menuitem', { name: 'SVG' })).toBeEnabled()
})

test('exports the whole graph as SVG, including unsaved edits, whatever the view', async ({ page }) => {
  await buildGraph(page)

  // Rename without waiting for the autosave, then zoom in so that part of the graph is off screen.
  await node(page, 'Alice').click()
  await page.getByLabel('Libellé').fill('Alice Martin')
  for (let i = 0; i < 3; i++) await page.locator('.react-flow__controls-zoomin').click()
  const { filename, bytes } = await exportImage(page, 'SVG')
  const svg = bytes.toString('utf8')

  expect(filename).toBe('Opération-Fil-Rouge.svg')
  expect(svg).toContain('<svg')
  for (const text of ['Alice Martin', 'Bob', 'Carole', 'connaît', 'emploie', 'B2'])
    expect(svg).toContain(`>${text}<`)
  expect(svg).not.toMatch(/foreignObject|<script|<image/)
  expect(svg).not.toMatch(/\bhref\b/)
})

test('exports a PNG of the whole graph, white and independent of theme and selection', async ({ page }) => {
  await buildGraph(page)
  const { bytes: svgBytes } = await exportImage(page, 'SVG')
  const svg = svgBytes.toString('utf8')
  const width = Number(/<svg[^>]* width="(\d+)"/.exec(svg)![1])
  const height = Number(/<svg[^>]* height="(\d+)"/.exec(svg)![1])

  await page.mouse.click(700, 500) // nothing selected
  const plain = await exportImage(page, 'PNG')
  expect(plain.filename).toBe('Opération-Fil-Rouge.png')
  expect([...plain.bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  expect([plain.bytes.readUInt32BE(16), plain.bytes.readUInt32BE(20)]).toEqual([width * 4, height * 4])

  const small = await exportImage(page, 'PNG', '1×')
  expect([small.bytes.readUInt32BE(16), small.bytes.readUInt32BE(20)]).toEqual([width, height])

  // Cancelling the dialog downloads nothing.
  let downloads = 0
  page.on('download', () => downloads++)
  await page.getByRole('button', { name: 'Exporter' }).click()
  await page.getByRole('menuitem', { name: 'PNG' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Annuler' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await page.waitForTimeout(500)
  expect(downloads).toBe(0)

  await node(page, 'Alice').click()
  await node(page, 'Bob').click({ modifiers: ['ControlOrMeta'] })
  const selected = await exportImage(page, 'PNG')
  expect(selected.bytes.equals(plain.bytes)).toBe(true)

  await page.getByRole('button', { name: 'Changer de thème' }).click()
  await page.getByRole('menuitemradio', { name: 'Sombre' }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  const dark = await exportImage(page, 'PNG')
  const corner = await page.evaluate(async (base64) => {
    const bitmap = await createImageBitmap(
      new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: 'image/png' }),
    )
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')!
    context.drawImage(bitmap, 0, 0)
    return Array.from(context.getImageData(0, 0, 1, 1).data)
  }, dark.bytes.toString('base64'))
  expect(corner).toEqual([255, 255, 255, 255])
})
