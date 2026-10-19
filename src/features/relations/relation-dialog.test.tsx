import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RelationDialog } from '@/features/relations/relation-dialog'

function setup() {
  const onSubmit = vi.fn()
  render(<RelationDialog open fromLabel="A" toLabel="B" onOpenChange={() => {}} onSubmit={onSubmit} />)
  return onSubmit
}

describe('RelationDialog', () => {
  it('creates a hypothesis by default', async () => {
    const onSubmit = setup()
    expect(screen.getByRole('switch', { name: 'Hypothèse' })).toBeChecked()
    await userEvent.click(screen.getByRole('button', { name: 'Créer la relation' }))
    expect(onSubmit).toHaveBeenCalledWith('lié à', true, 'hypothesis')
  })

  it('creates a verified relation when the switch is off', async () => {
    const onSubmit = setup()
    await userEvent.click(screen.getByRole('switch', { name: 'Hypothèse' }))
    await userEvent.click(screen.getByRole('button', { name: 'Créer la relation' }))
    expect(onSubmit).toHaveBeenCalledWith('lié à', true, 'verified')
  })
})
