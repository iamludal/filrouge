import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DEFAULT_DISPLAY } from '@/domain/display-options'
import { DisplayMenu } from '@/features/graph/display-menu'
import { renderWithLocale } from '@/test/render-with-locale'
import { useDisplayStore } from '@/store/display-store'

beforeEach(() => useDisplayStore.setState({ options: DEFAULT_DISPLAY }))

const FRENCH = ['Libellés des entités', 'Libellés des relations', 'Cotations', 'Marque « Important »']

async function open() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Affichage' }))
  return user
}

describe('DisplayMenu', () => {
  it('lists the four options, all checked, and a disabled reset', async () => {
    render(<DisplayMenu />)
    await open()
    for (const name of FRENCH) expect(await screen.findByRole('menuitemcheckbox', { name })).toBeChecked()
    expect(screen.getByRole('menuitem', { name: `Réinitialiser l'affichage` })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(screen.queryByTestId('display-dot')).not.toBeInTheDocument()
  })

  it('is translated', async () => {
    localStorage.setItem('filrouge:locale', 'en')
    renderWithLocale(<DisplayMenu />, 'en')
    await userEvent.click(screen.getByRole('button', { name: 'Display' }))
    for (const name of ['Entity labels', 'Relation labels', 'Ratings', 'Important mark'])
      expect(await screen.findByRole('menuitemcheckbox', { name })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Reset display' })).toBeInTheDocument()
  })

  it('has no mini-map item and ignores it for the dot', async () => {
    useDisplayStore.getState().toggle('minimap')
    render(<DisplayMenu />)
    await open()
    expect(screen.queryByRole('menuitemcheckbox', { name: 'Mini-carte' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('display-dot')).not.toBeInTheDocument()
  })

  it('toggles an option and keeps the menu open', async () => {
    render(<DisplayMenu />)
    const user = await open()
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Cotations' }))
    expect(useDisplayStore.getState().options.ratings).toBe(false)
    expect(screen.getByRole('menuitemcheckbox', { name: 'Cotations' })).not.toBeChecked()
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('shows a dot while an option is unchecked and resets them all', async () => {
    render(<DisplayMenu />)
    const user = await open()
    await user.click(await screen.findByRole('menuitemcheckbox', { name: 'Cotations' }))
    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Libellés des relations' }))
    expect(screen.getByTestId('display-dot')).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: `Réinitialiser l'affichage` }))
    expect(useDisplayStore.getState().options).toEqual(DEFAULT_DISPLAY)
    expect(screen.queryByTestId('display-dot')).not.toBeInTheDocument()
  })
})
