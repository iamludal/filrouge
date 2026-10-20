import type { EdgeProps } from '@xyflow/react'
import { render, screen } from '@testing-library/react'
import { createRelation } from '@/domain/factories'
import type { Confidence, Status } from '@/domain/schemas'
import { FloatingEdge } from '@/features/graph/floating-edge'
import type { RelationEdge, ViewFlags } from '@/features/graph/types'

vi.mock('@xyflow/react', () => {
  const node = { measured: { width: 144 }, internals: { positionAbsolute: { x: 0, y: 0 } } }
  return {
    BaseEdge: ({ path, className }: { path: string; className?: string }) => (
      <path data-testid="edge" d={path} className={className} />
    ),
    EdgeLabelRenderer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useInternalNode: () => node,
  }
})

function renderEdge(label: string, status: Status, confidence?: Confidence, flags: ViewFlags = {}) {
  const relation = {
    ...createRelation(crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), label, true, status),
    confidence,
  }
  const props = {
    id: relation.id,
    source: 'a',
    target: 'b',
    data: { relation, ...flags },
  } as unknown as EdgeProps<RelationEdge>
  render(
    <svg>
      <FloatingEdge {...props} />
    </svg>,
  )
}

describe('FloatingEdge', () => {
  it('dashes the line of a hypothesis only', () => {
    renderEdge('connaît', 'hypothesis')
    expect(screen.getByTestId('edge').getAttribute('class')).toContain('stroke-dasharray')
  })

  it('draws a verified relation solid', () => {
    renderEdge('connaît', 'verified')
    expect(screen.getByTestId('edge').getAttribute('class')).not.toContain('stroke-dasharray')
  })

  it('appends the grade to the label, with its description on hover', () => {
    renderEdge('connaît', 'verified', { reliability: 'C', credibility: 3 })
    const label = screen.getByText('connaît · C3')
    expect(label).toHaveAttribute('title', expect.stringContaining('Cotation C3 : source assez fiable'))
  })

  it('shows the grade alone when the label is empty', () => {
    renderEdge('', 'verified', { reliability: 'A', credibility: 1 })
    expect(screen.getByText('A1')).toBeInTheDocument()
  })

  it('fades the line and the label of a relation dimmed by the search', () => {
    renderEdge('connaît', 'verified', undefined, { dimmed: true })
    expect(screen.getByTestId('edge').getAttribute('class')).toContain('opacity-25')
    expect(screen.getByText('connaît')).toHaveClass('opacity-25')
  })

  it('draws a relation found by the search in amber', () => {
    renderEdge('connaît', 'verified', undefined, { highlighted: true })
    expect(screen.getByTestId('edge').getAttribute('class')).toContain('stroke-amber-500')
    expect(screen.getByText('connaît')).toHaveClass('border-amber-500')
    expect(screen.getByText('connaît')).not.toHaveClass('opacity-25')
  })

  it('shows no label when there is nothing to show', () => {
    renderEdge('', 'verified')
    expect(screen.queryByTitle(/./)).not.toBeInTheDocument()
  })
})
