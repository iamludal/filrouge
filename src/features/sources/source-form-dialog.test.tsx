import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInvestigation } from '@/domain/factories'
import * as optimizer from '@/features/sources/optimize-image'
import { SourceFormDialog } from '@/features/sources/source-form-dialog'
import { useGraphStore } from '@/store/graph-store'

vi.mock('@/features/sources/optimize-image', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/sources/optimize-image')>()),
  optimizeAttachment: vi.fn(),
}))

const MB = 1024 * 1024
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function bigPng(size: number, fill = 0) {
  const bytes = new Uint8Array(size).fill(fill)
  bytes.set(PNG_HEADER)
  return new File([bytes], 'grande.png', { type: 'image/png' })
}

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])
// SHA-256 of PNG_BYTES, computed with `sha256sum`.
const PNG_SHA = '7f47b756761a46e6d4a4d96f0d8a4448f8449235009d1f3ad1493f5c773c19e8'

function renderForm(props: Partial<React.ComponentProps<typeof SourceFormDialog>> = {}) {
  render(<SourceFormDialog open onOpenChange={() => {}} {...props} />)
}

function pickFile(file: File) {
  fireEvent.change(screen.getByTestId('screenshot-input'), { target: { files: [file] } })
}

describe('SourceFormDialog', () => {
  beforeEach(() => {
    useGraphStore
      .getState()
      .load({ investigation: createInvestigation('Test'), entities: [], relations: [], sources: [] })
  })
  afterEach(() => {
    useGraphStore.getState().close()
    vi.mocked(optimizer.optimizeAttachment).mockReset()
  })

  it('refuses an empty source', async () => {
    renderForm()
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(
      await screen.findByText('Renseignez au moins un titre, une URL ou une capture'),
    ).toBeInTheDocument()
    expect(Object.keys(useGraphStore.getState().sources)).toHaveLength(0)
  })

  it('refuses a javascript: URL', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText('URL'), 'javascript:alert(1)')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('URL invalide (http ou https)')).toBeInTheDocument()
    expect(Object.keys(useGraphStore.getState().sources)).toHaveLength(0)
  })

  it('defaults the capture date to now and saves an edited date in UTC', async () => {
    renderForm()
    const field = screen.getByLabelText('Date de capture') as HTMLInputElement
    expect(field.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)

    fireEvent.change(field, { target: { value: '2026-03-03T14:05' } })
    await userEvent.type(screen.getByLabelText('Titre'), 'Profil')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    const [source] = Object.values(useGraphStore.getState().sources)
    expect(source?.capturedAt).toBe(new Date(2026, 2, 3, 14, 5).toISOString())
  })

  it('attaches a new source to the element it was created from', async () => {
    const entity = useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    renderForm({ attachTo: { type: 'entity', id: entity.id } })
    await userEvent.type(screen.getByLabelText('Titre'), 'Profil LinkedIn')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    const [source] = Object.values(useGraphStore.getState().sources)
    expect(useGraphStore.getState().entities[entity.id]?.sourceIds).toEqual([source?.id])
  })

  it('shows the fingerprint of a chosen screenshot and stores it with the source', async () => {
    renderForm()
    pickFile(new File([PNG_BYTES], 'capture.png', { type: 'image/png' }))
    const sha = await screen.findByTestId('sha256')
    expect(sha.textContent).toMatch(/^[a-f0-9]{64}$/)
    expect(sha.textContent).toBe(PNG_SHA)
    expect(screen.getByAltText('Aperçu de la capture')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    const state = useGraphStore.getState()
    const [source] = Object.values(state.sources)
    expect(source?.sha256).toBe(PNG_SHA)
    expect(state.attachments[source!.attachmentId!]?.size).toBe(PNG_BYTES.length)
  })

  it('rejects a text file renamed .png and an SVG', async () => {
    renderForm()
    pickFile(new File(['not an image'], 'capture.png', { type: 'image/png' }))
    expect(await screen.findByText('Format non pris en charge (PNG, JPEG, WebP ou GIF)')).toBeInTheDocument()
    pickFile(new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], 'a.svg', { type: 'image/svg+xml' }))
    await waitFor(() =>
      expect(screen.getByText('Format non pris en charge (PNG, JPEG, WebP ou GIF)')).toBeInTheDocument(),
    )
    expect(screen.queryByTestId('sha256')).not.toBeInTheDocument()
  })

  it('rejects a screenshot over 20 MB', async () => {
    renderForm()
    pickFile(new File([new Uint8Array(21 * 1024 * 1024)], 'grosse.png', { type: 'image/png' }))
    expect(await screen.findByText('Capture trop volumineuse (20 Mo maximum)')).toBeInTheDocument()
  })

  it('accepts an image pasted from the clipboard', async () => {
    renderForm()
    const file = new File([PNG_BYTES], 'image.png', { type: 'image/png' })
    fireEvent.paste(screen.getByLabelText('Titre'), { clipboardData: { files: [file], types: ['Files'] } })
    expect((await screen.findByTestId('sha256')).textContent).toBe(PNG_SHA)
  })

  it('leaves a text paste alone', async () => {
    renderForm()
    fireEvent.paste(screen.getByLabelText('Titre'), { clipboardData: { files: [], types: ['text/plain'] } })
    expect(screen.queryByTestId('sha256')).not.toBeInTheDocument()
  })

  it('removes and replaces the screenshot of an existing source', async () => {
    const investigationId = useGraphStore.getState().investigation!.id
    const first = {
      id: crypto.randomUUID(),
      investigationId,
      blob: new Blob([PNG_BYTES], { type: 'image/png' }),
      mime: 'image/png' as const,
      size: PNG_BYTES.length,
      sha256: PNG_SHA,
    }
    const source = useGraphStore.getState().createSource({ title: 'S' }, first)!
    renderForm({ source: useGraphStore.getState().sources[source.id] })
    expect((await screen.findByTestId('sha256')).textContent).toBe(PNG_SHA)

    await userEvent.click(screen.getByRole('button', { name: 'Retirer la capture' }))
    expect(screen.queryByTestId('sha256')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    const updated = useGraphStore.getState().sources[source.id]
    expect(updated?.attachmentId).toBeUndefined()
    expect(updated?.sha256).toBeUndefined()
  })

  describe('optimization', () => {
    it('is not offered for a small screenshot', async () => {
      renderForm()
      pickFile(bigPng(MB))
      await screen.findByTestId('sha256')
      expect(screen.queryByLabelText('Optimiser la capture')).not.toBeInTheDocument()
    })

    it('is offered for a large one, unchecked, and keeps the original bytes by default', async () => {
      renderForm()
      pickFile(bigPng(3 * MB))
      const option = await screen.findByLabelText('Optimiser la capture')
      expect(option).not.toBeChecked()
      const original = (await screen.findByTestId('sha256')).textContent

      await userEvent.type(screen.getByLabelText('Titre'), 'Grande')
      await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
      const [source] = Object.values(useGraphStore.getState().sources)
      expect(source?.sha256).toBe(original)
      expect(source?.originalSha256).toBeUndefined()
      expect(optimizer.optimizeAttachment).not.toHaveBeenCalled()
    })

    it('shows the sizes, warns about EXIF and stores both fingerprints', async () => {
      vi.mocked(optimizer.optimizeAttachment).mockImplementation(async (original) => ({
        ok: true,
        attachment: {
          ...original,
          id: crypto.randomUUID(),
          mime: 'image/webp',
          size: MB,
          sha256: 'e'.repeat(64),
          originalSha256: original.sha256,
          originalSize: original.size,
        },
      }))
      renderForm()
      pickFile(bigPng(3 * MB))
      const original = (await screen.findByTestId('sha256')).textContent
      await userEvent.click(await screen.findByLabelText('Optimiser la capture'))

      expect(await screen.findByText('3 Mo → 1 Mo')).toBeInTheDocument()
      expect(screen.getByText('Les métadonnées (EXIF) seront supprimées.')).toBeInTheDocument()
      expect(screen.getByText('Capture optimisée')).toBeInTheDocument()
      expect(screen.getByTestId('original-sha256').textContent).toBe(original)
      expect(screen.getByTestId('sha256').textContent).toBe('e'.repeat(64))

      await userEvent.type(screen.getByLabelText('Titre'), 'Optimisée')
      await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
      const [source] = Object.values(useGraphStore.getState().sources)
      expect(source?.sha256).toBe('e'.repeat(64))
      expect(source?.originalSha256).toBe(original)
    })

    it('keeps the original when optimizing gains nothing', async () => {
      vi.mocked(optimizer.optimizeAttachment).mockResolvedValue({ ok: false, reason: 'no-gain' })
      renderForm()
      pickFile(bigPng(3 * MB))
      const option = await screen.findByLabelText('Optimiser la capture')
      await userEvent.click(option)
      expect(await screen.findByText('Optimisation sans gain, original conservé')).toBeInTheDocument()
      expect(option).not.toBeChecked()
    })
  })

  describe('duplicate screenshots', () => {
    function existingSource() {
      const investigationId = useGraphStore.getState().investigation!.id
      return useGraphStore.getState().createSource(
        { title: 'Profil LinkedIn' },
        {
          id: crypto.randomUUID(),
          investigationId,
          blob: new Blob([PNG_BYTES], { type: 'image/png' }),
          mime: 'image/png',
          size: PNG_BYTES.length,
          sha256: PNG_SHA,
        },
      )!
    }
    const sameFile = () => new File([PNG_BYTES], 'copie.png', { type: 'image/png' })

    it('warns about the same file and offers the three choices', async () => {
      existingSource()
      const entity = useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
      renderForm({ attachTo: { type: 'entity', id: entity.id } })
      pickFile(sameFile())
      expect(
        await screen.findByText('Cette capture est déjà présente dans la source « Profil LinkedIn »'),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Ouvrir la source existante' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Rattacher cette source' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Ajouter quand même' })).toBeInTheDocument()
    })

    it('attaches the existing source instead of creating a new one', async () => {
      const existing = existingSource()
      const entity = useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
      renderForm({ attachTo: { type: 'entity', id: entity.id } })
      pickFile(sameFile())
      await userEvent.click(await screen.findByRole('button', { name: 'Rattacher cette source' }))
      const state = useGraphStore.getState()
      expect(state.entities[entity.id]?.sourceIds).toEqual([existing.id])
      expect(Object.keys(state.sources)).toEqual([existing.id])
    })

    it('adds anyway: both sources keep their own screenshot', async () => {
      existingSource()
      renderForm()
      pickFile(sameFile())
      await userEvent.click(await screen.findByRole('button', { name: 'Ajouter quand même' }))
      expect(screen.queryByText(/déjà présente/)).not.toBeInTheDocument()
      await userEvent.type(screen.getByLabelText('Titre'), 'Seconde')
      await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
      const sources = Object.values(useGraphStore.getState().sources)
      expect(sources).toHaveLength(2)
      expect(new Set(sources.map((s) => s.attachmentId)).size).toBe(2)
    })

    it('opens the existing source in the form', async () => {
      existingSource()
      renderForm()
      pickFile(sameFile())
      await userEvent.click(await screen.findByRole('button', { name: 'Ouvrir la source existante' }))
      expect(await screen.findByText('Modifier la source')).toBeInTheDocument()
      expect(screen.getByLabelText('Titre')).toHaveValue('Profil LinkedIn')
    })

    it('does not warn for a file differing by one byte', async () => {
      existingSource()
      renderForm()
      pickFile(new File([new Uint8Array([...PNG_BYTES.slice(0, -1), 9])], 'autre.png', { type: 'image/png' }))
      await screen.findByTestId('sha256')
      expect(screen.queryByText(/déjà présente/)).not.toBeInTheDocument()
    })
  })
})
