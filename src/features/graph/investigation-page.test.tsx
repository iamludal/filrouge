import { act, render, screen } from '@testing-library/react'
import { Providers } from '@/app/providers'
import { investigations } from '@/db/repositories/investigations'
import { InvestigationPage } from '@/features/graph/investigation-page'
import { useGraphStore } from '@/store/graph-store'
import { mockViewport } from '@/test/viewport'

async function openInvestigation() {
  const investigation = await investigations.create('Affaire test')
  render(
    <Providers>
      <InvestigationPage id={investigation.id} />
    </Providers>,
  )
  await screen.findByRole('heading', { name: 'Affaire test' })
  const entity = act(() => useGraphStore.getState().addEntity('person', { x: 0, y: 0 }, 'Jean'))
  return entity
}

describe('InvestigationPage layout', () => {
  afterEach(() => useGraphStore.getState().close())

  it('docks the detail panel and shows the mini-map on a wide screen', async () => {
    mockViewport('wide')
    await openInvestigation()
    expect(screen.getByLabelText('Panneau de détail').tagName).toBe('ASIDE')
    expect(screen.getByLabelText('Mini-carte')).toBeInTheDocument()
  })

  it('shows a bottom drawer only while something is selected, and no mini-map, on a narrow screen', async () => {
    mockViewport('narrow')
    await openInvestigation()
    act(() => useGraphStore.getState().setSelection({ entityIds: [], relationIds: [] }))
    expect(screen.queryByLabelText('Panneau de détail')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Mini-carte')).not.toBeInTheDocument()

    const [id] = Object.keys(useGraphStore.getState().entities)
    act(() => useGraphStore.getState().setSelection({ entityIds: [id!], relationIds: [] }))
    expect(screen.getByLabelText('Panneau de détail').tagName).toBe('SECTION')
    expect(screen.getByRole('button', { name: 'Déplier le panneau' })).toBeInTheDocument()
  })
})
