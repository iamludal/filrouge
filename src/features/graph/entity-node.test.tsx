import { ReactFlowProvider, type NodeProps } from '@xyflow/react'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createEntity } from '@/domain/factories'
import { ENTITY_COLORS, importantTint } from '@/domain/entity-appearance'
import type { Confidence, Entity, Status } from '@/domain/schemas'
import { EntityNode } from '@/features/graph/entity-node'
import type { EntityNode as EntityNodeType, ViewFlags } from '@/features/graph/types'

function renderNode(
  status: Status,
  confidence?: Confidence,
  flags: ViewFlags = {},
  selected = false,
  extra: Partial<Entity> = {},
) {
  const entity = {
    ...createEntity(crypto.randomUUID(), 'person', { x: 0, y: 0 }, 'Alice'),
    status,
    confidence,
    ...extra,
  }
  const props = {
    id: entity.id,
    data: { entity, ...flags },
    selected,
  } as unknown as NodeProps<EntityNodeType>
  render(
    <ReactFlowProvider>
      <EntityNode {...props} />
    </ReactFlowProvider>,
  )
}

const circle = () => screen.getByTitle('Alice').firstElementChild as HTMLElement

describe('EntityNode', () => {
  it('draws a dashed circle for a hypothesis and a solid one when verified', () => {
    renderNode('hypothesis')
    expect(circle()).toHaveClass('border-dashed')
  })

  it('keeps a solid circle for a verified entity', () => {
    renderNode('verified')
    expect(circle()).not.toHaveClass('border-dashed')
  })

  it('shows the grade badge with its description', () => {
    renderNode('verified', { reliability: 'B', credibility: 2 })
    const badge = screen.getByText('B2')
    const description = 'Cotation B2 : source habituellement fiable, information probablement vraie'
    expect(badge).toHaveAttribute('title', description)
    expect(screen.getByRole('img', { name: description })).toBe(badge)
  })

  it('fades a node dimmed by the search, which still receives clicks', async () => {
    const onClick = vi.fn()
    renderNode('verified', undefined, { dimmed: true })
    const node = screen.getByTitle('Alice')
    expect(node).toHaveClass('opacity-25')
    node.addEventListener('click', onClick)
    await userEvent.click(node)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('rings a node found by the search, unless it is selected', () => {
    renderNode('verified', undefined, { highlighted: true })
    expect(circle()).toHaveClass('ring-amber-400/70')
    expect(screen.getByTitle('Alice')).not.toHaveClass('opacity-25')
  })

  it('keeps the selection ring on a selected result', () => {
    renderNode('verified', undefined, { highlighted: true }, true)
    expect(circle()).not.toHaveClass('ring-amber-400/70')
    expect(circle()).toHaveClass('ring-ring/40')
  })

  it('shows no badge when ungraded', () => {
    renderNode('verified')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('gives the connection handle of a selected node a 44 px touch hit area, and none otherwise', () => {
    renderNode('verified', undefined, {}, true)
    const handle = screen.getByLabelText('Créer une relation depuis Alice')
    expect(handle.className).toContain('pointer-coarse:before:size-11')
    cleanup()
    renderNode('verified')
    expect(screen.getByLabelText('Créer une relation depuis Alice').className).not.toContain(
      'pointer-coarse:before:size-11',
    )
  })

  it("draws the type's colour and icon by default", () => {
    renderNode('verified')
    expect(circle()).toHaveStyle({ borderColor: ENTITY_COLORS.blue, color: ENTITY_COLORS.blue })
    expect(circle().querySelector('svg')).toHaveClass('lucide-user')
  })

  it("draws the entity's own colour and icon in place of the type's", () => {
    renderNode('verified', undefined, {}, false, { color: 'red', icon: 'skull' })
    expect(circle()).toHaveStyle({ borderColor: ENTITY_COLORS.red, color: ENTITY_COLORS.red })
    expect(circle().querySelector('svg')).toHaveClass('lucide-skull')
  })

  it('shows a flag badge named Important only on an important entity', () => {
    renderNode('verified')
    expect(screen.queryByRole('img', { name: 'Important' })).not.toBeInTheDocument()
    cleanup()
    renderNode('verified', undefined, {}, false, { important: true })
    expect(screen.getByRole('img', { name: 'Important' })).toBeInTheDocument()
  })

  it('gives an important entity a thicker border tinted with its own colour, and a 24 px flag', () => {
    renderNode('verified', undefined, {}, false, { important: true, color: 'green' })
    // Thickened outwards: the 2 px border stays and a 2 px outline of the same colour is added.
    expect(circle()).toHaveClass('border-2')
    expect(circle()).toHaveStyle({ outline: `2px solid ${ENTITY_COLORS.green}` })
    expect(importantTint(ENTITY_COLORS.green)).toBe(
      'linear-gradient(rgba(22, 163, 74, 0.18), rgba(22, 163, 74, 0.18))',
    )
    expect(circle().style.backgroundImage).toBe(importantTint(ENTITY_COLORS.green))
    expect(screen.getByRole('img', { name: 'Important' })).toHaveClass('size-6')
    cleanup()
    renderNode('verified')
    expect(circle()).toHaveClass('border-2')
    expect(circle().style.outline).toBe('')
    expect(circle().style.backgroundImage).toBe('')
  })

  it('shows the grade and the flag badges together, on opposite sides of the circle', () => {
    renderNode('verified', { reliability: 'B', credibility: 2 }, {}, false, { important: true })
    const flag = screen.getByRole('img', { name: 'Important' })
    const grade = screen.getByText('B2')
    expect(flag).toHaveClass('-left-3')
    expect(grade).toHaveClass('-right-4')
  })

  it('keeps the outline of an important hypothesis dashed, like its border', () => {
    renderNode('hypothesis', undefined, {}, false, { important: true, color: 'green' })
    expect(circle()).toHaveStyle({ outline: `2px dashed ${ENTITY_COLORS.green}` })
  })
})
