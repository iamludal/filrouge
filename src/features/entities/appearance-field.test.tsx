import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ENTITY_COLOR_IDS, ENTITY_ICON_IDS } from '@/domain/entity-appearance'
import { createInvestigation } from '@/domain/factories'
import { DetailPanel } from '@/features/graph/detail-panel'
import { LocaleProvider } from '@/i18n/locale'
import { useGraphStore } from '@/store/graph-store'

function setup(locale: 'fr' | 'en' = 'fr') {
  localStorage.setItem('filrouge:locale', locale)
  const { load, addEntity, setSelection } = useGraphStore.getState()
  load({ investigation: createInvestigation('Test'), entities: [], relations: [], sources: [] })
  const a = addEntity('person', { x: 0, y: 0 }, 'Alice')
  const b = addEntity('person', { x: 100, y: 0 }, 'Bob')
  act(() => setSelection({ entityIds: [a.id], relationIds: [] }))
  render(
    <LocaleProvider>
      <TooltipProvider>
        <DetailPanel />
      </TooltipProvider>
    </LocaleProvider>,
  )
  return { a, b }
}

const entity = (id: string) => useGraphStore.getState().entities[id]!
const colorButton = () => screen.getByRole('button', { name: /^(Couleur|Color) ?:/ })
const iconButton = () => screen.getByRole('button', { name: /^(Icône|Icon) ?:/ })

describe('AppearanceField', () => {
  afterEach(() => useGraphStore.getState().close())

  it('shows the Apparence field with both pickers and the toggle', () => {
    setup()
    expect(screen.getByText('Apparence')).toBeInTheDocument()
    expect(colorButton()).toHaveAccessibleName('Couleur : Couleur du type')
    expect(iconButton()).toHaveAccessibleName('Icône : Icône du type')
    expect(screen.getByRole('button', { name: 'Important', pressed: false })).toBeInTheDocument()
  })

  it('offers the type colour then the 16 palette colours, the type colour being current', async () => {
    setup()
    await userEvent.click(colorButton())
    const group = await screen.findByRole('radiogroup', { name: 'Couleur' })
    const cells = within(group).getAllByRole('radio')
    expect(cells).toHaveLength(1 + ENTITY_COLOR_IDS.length)
    expect(cells[0]).toHaveAccessibleName('Couleur du type')
    expect(cells[0]).toBeChecked()
    expect(within(group).getByRole('radio', { name: 'Rouge' })).not.toBeChecked()
    expect(within(group).getByRole('radio', { name: 'Ardoise' })).toBeInTheDocument()
  })

  it('picks a colour, closes the picker and shows the choice as current', async () => {
    const { a } = setup()
    await userEvent.click(colorButton())
    await userEvent.click(await screen.findByRole('radio', { name: 'Rouge' }))
    expect(entity(a.id).color).toBe('red')
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(colorButton()).toHaveAccessibleName('Couleur : Rouge')

    await userEvent.click(colorButton())
    expect(await screen.findByRole('radio', { name: 'Rouge' })).toBeChecked()
  })

  it("clears the colour with 'Couleur du type'", async () => {
    const { a } = setup()
    act(() => useGraphStore.getState().updateEntity(a.id, { color: 'red' }))
    await userEvent.click(colorButton())
    await userEvent.click(await screen.findByRole('radio', { name: 'Couleur du type' }))
    expect(entity(a.id)).not.toHaveProperty('color')
  })

  it('does not edit the entity when the current colour is picked again', async () => {
    const { a } = setup()
    act(() => useGraphStore.getState().updateEntity(a.id, { color: 'red' }))
    const updatedAt = entity(a.id).updatedAt
    await userEvent.click(colorButton())
    await userEvent.click(await screen.findByRole('radio', { name: 'Rouge' }))
    expect(entity(a.id).updatedAt).toBe(updatedAt)
  })

  it('picks a colour with the keyboard: Enter, arrows, Enter', async () => {
    const { a } = setup()
    colorButton().focus()
    await userEvent.keyboard('{Enter}')
    expect(await screen.findByRole('radio', { name: 'Couleur du type' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Orange' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(entity(a.id).color).toBe('orange')
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('offers the type icon then the 44 icons and picks one', async () => {
    const { a } = setup()
    await userEvent.click(iconButton())
    const group = await screen.findByRole('radiogroup', { name: 'Icône' })
    expect(within(group).getAllByRole('radio')).toHaveLength(1 + ENTITY_ICON_IDS.length)
    await userEvent.click(within(group).getByRole('radio', { name: 'Crâne' }))
    expect(entity(a.id).icon).toBe('skull')
    expect(iconButton()).toHaveAccessibleName('Icône : Crâne')
  })

  it("clears the icon with 'Icône du type'", async () => {
    const { a } = setup()
    act(() => useGraphStore.getState().updateEntity(a.id, { icon: 'skull' }))
    await userEvent.click(iconButton())
    await userEvent.click(await screen.findByRole('radio', { name: 'Icône du type' }))
    expect(entity(a.id)).not.toHaveProperty('icon')
  })

  it('marks and unmarks the entity as important', async () => {
    const { a } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Important' }))
    expect(entity(a.id).important).toBe(true)
    expect(screen.getByRole('button', { name: 'Important', pressed: true })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Important' }))
    expect(entity(a.id)).not.toHaveProperty('important')
  })

  it('refreshes the last-modified date when the appearance changes', async () => {
    const { a } = setup()
    act(() => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date(Date.parse(a.createdAt) + 60_000))
    })
    await userEvent.click(screen.getByRole('button', { name: 'Important' }))
    vi.useRealTimers()
    expect(entity(a.id).updatedAt).not.toBe(a.createdAt)
  })

  it('keeps the appearance when the type changes', async () => {
    const { a } = setup()
    act(() => useGraphStore.getState().updateEntity(a.id, { color: 'red', icon: 'skull' }))
    act(() => useGraphStore.getState().updateEntity(a.id, { type: 'email' }))
    expect(entity(a.id)).toMatchObject({ type: 'email', color: 'red', icon: 'skull' })
  })

  it('shows English names', async () => {
    setup('en')
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(colorButton()).toHaveAccessibleName('Color: Type color')
    await userEvent.click(colorButton())
    expect(await screen.findByRole('radio', { name: 'Slate' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Type color' })).toBeInTheDocument()
  })

  it('is not shown for a multiple selection', () => {
    const { a, b } = setup()
    act(() => useGraphStore.getState().setSelection({ entityIds: [a.id, b.id], relationIds: [] }))
    expect(screen.queryByText('Apparence')).not.toBeInTheDocument()
  })
})
