import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { createInvestigation } from '@/domain/factories'
import { ExportMenu } from '@/features/graph-export/export-menu'
import { svgToPng } from '@/features/graph-export/png'
import { downloadBlob } from '@/lib/download'
import { useGraphStore } from '@/store/graph-store'

vi.mock('@/lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/download')>()),
  downloadBlob: vi.fn(),
}))
vi.mock('@/features/graph-export/png', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/graph-export/png')>()),
  svgToPng: vi.fn(),
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

function setup(entities = 0) {
  useGraphStore.getState().load({
    investigation: createInvestigation('Opération Fil Rouge'),
    entities: [],
    relations: [],
    sources: [],
  })
  for (let i = 0; i < entities; i++)
    useGraphStore.getState().addEntity('person', { x: i * 200, y: 0 }, `E${i}`)
  const onExportJson = vi.fn()
  render(<ExportMenu onExportJson={onExportJson} />)
  return { onExportJson }
}

async function open() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Exporter' }))
  return user
}

async function choose(item: 'JSON' | 'PNG' | 'SVG') {
  const user = await open()
  await user.click(await screen.findByRole('menuitem', { name: item }))
}

const item = (name: string) => screen.findByRole('menuitem', { name })

describe('ExportMenu', () => {
  afterEach(() => {
    useGraphStore.getState().close()
    vi.clearAllMocks()
  })

  it('hands the JSON export to the caller', async () => {
    const { onExportJson } = setup()
    await choose('JSON')
    expect(onExportJson).toHaveBeenCalledOnce()
  })

  it('disables the image formats on an empty graph, but not JSON', async () => {
    setup()
    await open()
    expect(await item('JSON')).not.toHaveAttribute('aria-disabled')
    expect(await item('PNG')).toHaveAttribute('aria-disabled', 'true')
    expect(await item('SVG')).toHaveAttribute('aria-disabled', 'true')
  })

  it('enables the image formats once an entity exists', async () => {
    setup()
    useGraphStore.getState().addEntity('person', { x: 0, y: 0 }, 'A')
    await open()
    expect(await item('PNG')).not.toHaveAttribute('aria-disabled')
    expect(await item('SVG')).not.toHaveAttribute('aria-disabled')
  })

  it('downloads an SVG named after the investigation, with unsaved edits', async () => {
    setup(1)
    const entity = Object.values(useGraphStore.getState().entities)[0]!
    useGraphStore.getState().updateEntity(entity.id, { label: 'Renommé' })
    await choose('SVG')
    const [filename, blob] = vi.mocked(downloadBlob).mock.calls[0] as [string, Blob]
    expect(filename).toBe('Opération-Fil-Rouge.svg')
    expect(blob.type).toContain('image/svg+xml')
    expect(await blob.text()).toContain('Renommé')
  })

  it('opens the PNG dialog and downloads at the selected scale', async () => {
    setup(2)
    const png = new Blob(['png'], { type: 'image/png' })
    vi.mocked(svgToPng).mockResolvedValue(png)
    await choose('PNG')
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('radio', { name: /4× \(recommandé\)/ })).toBeChecked()
    expect(svgToPng).not.toHaveBeenCalled()

    const user = userEvent.setup()
    await user.click(within(dialog).getByRole('radio', { name: /^1×/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Exporter' }))
    await waitFor(() => expect(downloadBlob).toHaveBeenCalledWith('Opération-Fil-Rouge.png', png))
    const [svg, width, height, scale] = vi.mocked(svgToPng).mock.calls[0]!
    expect(svg).toContain('E0')
    expect(width).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
    expect(scale).toBe(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('downloads nothing when the PNG dialog is cancelled, and reopens on 4×', async () => {
    setup(1)
    await choose('PNG')
    const user = userEvent.setup()
    await user.click(within(await screen.findByRole('dialog')).getByRole('radio', { name: /^8×/ }))
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(svgToPng).not.toHaveBeenCalled()
    expect(downloadBlob).not.toHaveBeenCalled()

    await choose('PNG')
    expect(await screen.findByRole('radio', { name: /^4×/ })).toBeChecked()
  })

  it('shows an error and downloads nothing when the PNG cannot be rendered', async () => {
    setup(1)
    vi.mocked(svgToPng).mockRejectedValue(new Error('boom'))
    await choose('PNG')
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Exporter' }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Impossible d’exporter l’image'))
    expect(downloadBlob).not.toHaveBeenCalled()
  })
})
