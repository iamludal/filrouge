import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { createInvestigation } from '@/domain/factories'
import { PasteScreenshot } from '@/features/sources/paste-screenshot'
import { useGraphStore } from '@/store/graph-store'

vi.mock('sonner', () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }))

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])
const image = () => new File([PNG], 'image.png', { type: 'image/png' })
const withImage = { clipboardData: { files: [image()], types: ['Files'] } }

function setup() {
  useGraphStore
    .getState()
    .load({ investigation: createInvestigation('Test'), entities: [], relations: [], sources: [] })
  const store = useGraphStore.getState()
  const a = store.addEntity('person', { x: 0, y: 0 })
  const b = store.addEntity('email', { x: 0, y: 0 })
  const relation = store.addRelation(a.id, b.id, 'utilise')!
  return { a, b, relation }
}

describe('PasteScreenshot', () => {
  beforeEach(() => vi.mocked(toast.info).mockClear())
  afterEach(() => useGraphStore.getState().close())

  it('opens the source form with the pasted image, then attaches the source to the entity', async () => {
    const { a } = setup()
    useGraphStore.getState().setSelection({ entityIds: [a.id], relationIds: [] })
    render(<PasteScreenshot />)
    fireEvent.paste(document.body, withImage)

    expect(await screen.findByText('Nouvelle source')).toBeInTheDocument()
    expect((await screen.findByTestId('sha256')).textContent).toMatch(/^[a-f0-9]{64}$/)
    await userEvent.type(screen.getByLabelText('Titre'), 'Story Instagram')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    const state = useGraphStore.getState()
    const [source] = Object.values(state.sources)
    expect(source?.title).toBe('Story Instagram')
    expect(source?.attachmentId).toBeDefined()
    expect(state.entities[a.id]?.sourceIds).toEqual([source?.id])
  })

  it('works for a selected relation', async () => {
    const { relation } = setup()
    useGraphStore.getState().setSelection({ entityIds: [], relationIds: [relation.id] })
    render(<PasteScreenshot />)
    fireEvent.paste(document.body, withImage)
    await screen.findByTestId('sha256')
    await userEvent.type(screen.getByLabelText('Titre'), 'Article')
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(useGraphStore.getState().relations[relation.id]?.sourceIds).toHaveLength(1)
  })

  it('creates nothing when the form is cancelled', async () => {
    const { a } = setup()
    useGraphStore.getState().setSelection({ entityIds: [a.id], relationIds: [] })
    render(<PasteScreenshot />)
    fireEvent.paste(document.body, withImage)
    await userEvent.click(await screen.findByRole('button', { name: 'Annuler' }))
    expect(Object.keys(useGraphStore.getState().sources)).toHaveLength(0)
    expect(useGraphStore.getState().entities[a.id]?.sourceIds).toEqual([])
  })

  it('shows a hint when nothing, or several elements, are selected', () => {
    const { a, b } = setup()
    useGraphStore.getState().setSelection({ entityIds: [], relationIds: [] })
    render(<PasteScreenshot />)
    fireEvent.paste(document.body, withImage)
    expect(toast.info).toHaveBeenCalledWith(
      'Sélectionnez une entité ou une relation pour y coller une capture',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    useGraphStore.getState().setSelection({ entityIds: [a.id, b.id], relationIds: [] })
    fireEvent.paste(document.body, withImage)
    expect(toast.info).toHaveBeenCalledTimes(2)
    expect(Object.keys(useGraphStore.getState().sources)).toHaveLength(0)
  })

  it('leaves text pastes and pastes into fields alone', () => {
    const { a } = setup()
    useGraphStore.getState().setSelection({ entityIds: [a.id], relationIds: [] })
    render(
      <>
        <PasteScreenshot />
        <input aria-label="Libellé" />
      </>,
    )
    fireEvent.paste(document.body, { clipboardData: { files: [], types: ['text/plain'] } })
    fireEvent.paste(screen.getByLabelText('Libellé'), withImage)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(toast.info).not.toHaveBeenCalled()
  })

  it('ignores a paste while a dialog is already open', () => {
    const { a } = setup()
    useGraphStore.getState().setSelection({ entityIds: [a.id], relationIds: [] })
    render(
      <>
        <PasteScreenshot />
        <div role="dialog" aria-label="Autre" />
      </>,
    )
    fireEvent.paste(document.body, withImage)
    expect(screen.queryByText('Nouvelle source')).not.toBeInTheDocument()
    expect(toast.info).not.toHaveBeenCalled()
  })
})
