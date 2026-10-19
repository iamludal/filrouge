import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { graph } from '@/db/repositories/graph'
import { investigations } from '@/db/repositories/investigations'
import { ExportDialog, type PendingExport } from '@/features/import-export/export-dialog'
import { useExportInvestigation } from '@/features/import-export/use-import-export'
import { downloadText } from '@/lib/download'

vi.mock('@/lib/download', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/download')>()),
  downloadText: vi.fn(),
}))

const MB = 1024 * 1024

function pendingExport(totalSize: number, count = 2): PendingExport {
  return { id: crypto.randomUUID(), name: 'Test', baseJson: 'x'.repeat(1000), stats: { count, totalSize } }
}

describe('ExportDialog', () => {
  it('shows the estimated size with screenshots included by default', () => {
    render(<ExportDialog pending={pendingExport(30 * MB)} onCancel={() => {}} onConfirm={() => {}} />)
    expect(screen.getByLabelText('Inclure les captures (2, 30 Mo)')).toBeChecked()
    expect(screen.getByText('Taille estimée : environ 40 Mo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exporter' })).toBeEnabled()
  })

  it('blocks an export that could not be re-imported, until screenshots are excluded', async () => {
    const onConfirm = vi.fn()
    render(<ExportDialog pending={pendingExport(180 * MB)} onCancel={() => {}} onConfirm={onConfirm} />)
    expect(screen.getByRole('button', { name: 'Exporter' })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Fichier estimé à plus de 200 Mo : il ne pourrait pas être réimporté. Excluez les captures ou optimisez les plus lourdes.',
    )

    await userEvent.click(screen.getByLabelText(/Inclure les captures/))
    expect(screen.getByRole('button', { name: 'Exporter' })).toBeEnabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Exporter' }))
    expect(onConfirm).toHaveBeenCalledWith(false)
  })
})

function Harness({ id }: { id: string }) {
  const { exportInvestigation, exportDialog } = useExportInvestigation()
  return (
    <>
      <button onClick={() => void exportInvestigation(id)}>Exporter</button>
      {exportDialog}
    </>
  )
}

async function investigationWithScreenshot() {
  const investigation = await investigations.create('Avec capture')
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2])
  const attachment = {
    id: crypto.randomUUID(),
    investigationId: investigation.id,
    blob: new Blob([bytes], { type: 'image/png' }),
    mime: 'image/png' as const,
    size: bytes.length,
    sha256: 'a'.repeat(64),
  }
  await graph.applyChanges({
    investigationId: investigation.id,
    upsertEntities: [],
    upsertRelations: [],
    deleteEntityIds: [],
    deleteRelationIds: [],
    upsertSources: [
      {
        id: crypto.randomUUID(),
        investigationId: investigation.id,
        title: 'S',
        capturedAt: new Date().toISOString(),
        attachmentId: attachment.id,
        sha256: attachment.sha256,
      },
    ],
    upsertAttachments: [attachment],
  })
  return investigation
}

describe('export entry point', () => {
  beforeEach(() => vi.mocked(downloadText).mockClear())

  it('downloads right away when there is no screenshot', async () => {
    const investigation = await investigations.create('Sans capture')
    render(<Harness id={investigation.id} />)
    await userEvent.click(screen.getByRole('button', { name: 'Exporter' }))
    await vi.waitFor(() => expect(downloadText).toHaveBeenCalledOnce())
    expect(vi.mocked(downloadText).mock.calls[0]![0]).toBe('Sans-capture.filrouge.json')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('asks first when there are screenshots, and embeds them by default', async () => {
    const investigation = await investigationWithScreenshot()
    render(<Harness id={investigation.id} />)
    await userEvent.click(screen.getByRole('button', { name: 'Exporter' }))
    const dialog = await screen.findByRole('dialog')
    expect(downloadText).not.toHaveBeenCalled()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Exporter' }))

    await vi.waitFor(() => expect(downloadText).toHaveBeenCalledOnce())
    const file = JSON.parse(vi.mocked(downloadText).mock.calls[0]![1])
    expect(file.attachments).toHaveLength(1)
  })

  it('leaves the screenshots out when the box is unchecked', async () => {
    const investigation = await investigationWithScreenshot()
    render(<Harness id={investigation.id} />)
    await userEvent.click(screen.getByRole('button', { name: 'Exporter' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByLabelText(/Inclure les captures/))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Exporter' }))

    await vi.waitFor(() => expect(downloadText).toHaveBeenCalledOnce())
    const file = JSON.parse(vi.mocked(downloadText).mock.calls[0]![1])
    expect(file.attachments).toEqual([])
    expect(file.sources[0].attachmentId).toBeUndefined()
    expect(file.sources[0].sha256).toBe('a'.repeat(64))
  })
})
