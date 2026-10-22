import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInvestigation } from '@/domain/factories'
import { LayoutMenu } from '@/features/graph-layout/layout-menu'
import { renderWithLocale } from '@/test/render-with-locale'
import { useGraphStore } from '@/store/graph-store'

const apply = vi.fn()
vi.mock('@/features/graph-layout/use-auto-layout', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/graph-layout/use-auto-layout')>()),
  useAutoLayout: () => apply,
}))

function openWith(count: number) {
  useGraphStore
    .getState()
    .load({ investigation: createInvestigation('Test'), entities: [], relations: [], sources: [] })
  for (let i = 0; i < count; i++) useGraphStore.getState().addEntity('person', { x: i * 160, y: 0 })
}

describe('LayoutMenu', () => {
  beforeEach(() => apply.mockClear())
  afterEach(() => useGraphStore.getState().close())

  it('lists the three layouts', async () => {
    openWith(3)
    render(<LayoutMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Mise en page' }))
    for (const name of ['Organique', 'Hiérarchique', 'Radial'])
      expect(await screen.findByRole('menuitem', { name })).toBeInTheDocument()
  })

  it('is translated', async () => {
    openWith(3)
    renderWithLocale(<LayoutMenu />, 'en')
    await userEvent.click(screen.getByRole('button', { name: 'Layout' }))
    for (const name of ['Organic', 'Hierarchical', 'Radial'])
      expect(await screen.findByRole('menuitem', { name })).toBeInTheDocument()
    localStorage.removeItem('filrouge:locale')
  })

  it('applies the chosen layout', async () => {
    openWith(3)
    render(<LayoutMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Mise en page' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Radial' }))
    expect(apply).toHaveBeenCalledWith('radial')
  })

  it('works with the keyboard', async () => {
    openWith(3)
    render(<LayoutMenu />)
    const user = userEvent.setup()
    screen.getByRole('button', { name: 'Mise en page' }).focus()
    await user.keyboard('{Enter}')
    await screen.findByRole('menuitem', { name: 'Organique' })
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')
    expect(apply).toHaveBeenCalledWith('radial')
  })

  it('is disabled with fewer than two entities', () => {
    openWith(1)
    render(<LayoutMenu />)
    expect(screen.getByRole('button', { name: 'Mise en page' })).toBeDisabled()
  })
})
