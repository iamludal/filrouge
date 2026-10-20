import type { EdgeProps, NodeProps } from '@xyflow/react'
import { ReactFlowProvider } from '@xyflow/react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ENTITY_TYPE_IDS } from '@/domain/entity-types'
import { createEntity, createInvestigation, createRelation } from '@/domain/factories'
import type { Confidence } from '@/domain/schemas'
import { AssessmentFields } from '@/features/assessment/assessment-fields'
import { ElementTimestamps } from '@/features/entities/element-timestamps'
import { EntityTypeSelect } from '@/features/entities/entity-type-select'
import { DetailPanel } from '@/features/graph/detail-panel'
import { EntityNode } from '@/features/graph/entity-node'
import { FloatingEdge } from '@/features/graph/floating-edge'
import type { EntityNode as EntityNodeType, RelationEdge } from '@/features/graph/types'
import { RelationDialog } from '@/features/relations/relation-dialog'
import { LocaleProvider, useI18n } from '@/i18n/locale'
import { en } from '@/i18n/messages/en'
import { useGraphStore } from '@/store/graph-store'

vi.mock('@xyflow/react', async (importOriginal) => {
  const original = await importOriginal<typeof import('@xyflow/react')>()
  const node = { measured: { width: 144 }, internals: { positionAbsolute: { x: 0, y: 0 } } }
  return {
    ...original,
    BaseEdge: ({ path }: { path: string }) => <path d={path} />,
    EdgeLabelRenderer: ({ children }: { children: ReactNode }) => <>{children}</>,
    useInternalNode: () => node,
  }
})

/** The interface in English, as for a user whose browser asks for it. */
function inEnglish(ui: ReactNode) {
  localStorage.setItem('filrouge:locale', 'en')
  return render(
    <LocaleProvider>
      <TooltipProvider>{ui}</TooltipProvider>
    </LocaleProvider>,
  )
}

const pick = async (selector: string, option: string) => {
  await userEvent.click(screen.getByRole('combobox', { name: selector }))
  await userEvent.click(await screen.findByRole('option', { name: option }))
}

describe('entities in English', () => {
  it('lists the 14 entity types with English labels', async () => {
    inEnglish(<EntityTypeSelect id="type" value="person" onChange={() => {}} />)
    await userEvent.click(screen.getByRole('combobox'))
    const options = (await screen.findAllByRole('option')).map((option) => option.textContent)
    expect(options).toEqual([
      'Person',
      'Alias / account',
      'Email',
      'Phone',
      'Domain',
      'IP address',
      'URL',
      'Organization',
      'Address',
      'Image',
      'Document',
      'Crypto wallet',
      'Vehicle',
      'Event',
    ])
    expect(options).toHaveLength(ENTITY_TYPE_IDS.length)
  })
})

describe('assessment in English', () => {
  function Harness() {
    const [confidence, setConfidence] = useState<Confidence | undefined>()
    return (
      <AssessmentFields
        idPrefix="t"
        status="verified"
        confidence={confidence}
        onChange={(patch) => 'confidence' in patch && setConfidence(patch.confidence)}
      />
    )
  }

  it('shows an unrated element, then the NATO scale and the rating', async () => {
    inEnglish(<Harness />)
    expect(screen.getByRole('switch', { name: 'Hypothesis' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Source reliability' })).toHaveTextContent('Not rated')
    expect(screen.getByRole('combobox', { name: 'Information credibility' })).toHaveTextContent('Not rated')

    await userEvent.click(screen.getByRole('combobox', { name: 'Source reliability' }))
    expect((await screen.findAllByRole('option')).map((o) => o.textContent)).toEqual([
      'A – Completely reliable',
      'B – Usually reliable',
      'C – Fairly reliable',
      'D – Not usually reliable',
      'E – Unreliable',
      'F – Reliability cannot be judged',
    ])
    await userEvent.click(screen.getByRole('option', { name: 'B – Usually reliable' }))

    await userEvent.click(screen.getByRole('combobox', { name: 'Information credibility' }))
    expect((await screen.findAllByRole('option')).map((o) => o.textContent)).toEqual([
      '1 – Confirmed by other sources',
      '2 – Probably true',
      '3 – Possibly true',
      '4 – Doubtful',
      '5 – Improbable',
      '6 – Truth cannot be judged',
    ])
    await userEvent.click(screen.getByRole('option', { name: '2 – Probably true' }))
    expect(screen.getByText('Rating: B2')).toBeInTheDocument()
  })

  it('picks a half grade without error', async () => {
    inEnglish(<Harness />)
    await pick('Source reliability', 'A – Completely reliable')
    expect(screen.getByText('Rating: A6')).toBeInTheDocument()
  })
})

function renderNode(confidence: Confidence) {
  const entity = { ...createEntity(crypto.randomUUID(), 'person', { x: 0, y: 0 }, 'Alice'), confidence }
  const props = { id: entity.id, data: { entity }, selected: false } as unknown as NodeProps<EntityNodeType>
  inEnglish(
    <ReactFlowProvider>
      <EntityNode {...props} />
    </ReactFlowProvider>,
  )
}

describe('grade tooltips in English', () => {
  it('explains B2', () => {
    renderNode({ reliability: 'B', credibility: 2 })
    expect(screen.getByRole('img')).toHaveAttribute(
      'title',
      'Rating B2: usually reliable source, probably true information',
    )
  })

  it('explains A1', () => {
    renderNode({ reliability: 'A', credibility: 1 })
    expect(screen.getByRole('img')).toHaveAttribute(
      'title',
      'Rating A1: completely reliable source, information confirmed by other sources',
    )
  })
})

describe('dates in English', () => {
  const CREATED = '2026-10-20T12:32:05.000Z'

  it('formats the date and words the tooltip label', async () => {
    inEnglish(<ElementTimestamps createdAt={CREATED} updatedAt={CREATED} />)
    expect(screen.getByText(/^Oct 2[01], 2026$/)).toBeInTheDocument()
    const time = screen.getByLabelText(/^Created on October 2[01], 2026 at /)
    expect(time).toHaveAttribute('datetime', CREATED)
    await userEvent.hover(time)
    expect(await screen.findByRole('tooltip')).toHaveTextContent(/^Created on October 2[01], 2026 at .*:05/)
  })

  it('words the modification date', () => {
    inEnglish(<ElementTimestamps createdAt={CREATED} updatedAt="2026-10-21T08:10:44.000Z" />)
    expect(screen.getByLabelText(/^Modified on October 2[01], 2026 at /)).toBeInTheDocument()
  })
})

describe('switching language', () => {
  afterEach(() => useGraphStore.getState().close())

  function Switch() {
    const { setLocale } = useI18n()
    return (
      <>
        <button onClick={() => setLocale('en')}>to-en</button>
        <button onClick={() => setLocale('fr')}>to-fr</button>
      </>
    )
  }

  it('keeps the selection, the history and the stored content, and updates the dates', async () => {
    const user = userEvent.setup()
    useGraphStore.getState().load({
      investigation: createInvestigation('Test'),
      entities: [],
      relations: [],
      sources: [],
    })
    const alice = useGraphStore.getState().addEntity('person', { x: 0, y: 0 }, 'Alice')
    useGraphStore.getState().setSelection({ entityIds: [alice.id], relationIds: [] })
    localStorage.setItem('filrouge:locale', 'fr')
    render(
      <LocaleProvider>
        <TooltipProvider>
          <Switch />
          <DetailPanel />
        </TooltipProvider>
      </LocaleProvider>,
    )
    const panel = () => screen.getByRole('complementary')
    expect(within(panel()).getByRole('heading', { name: 'Personne' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'to-en' }))

    expect(within(panel()).getByRole('heading', { name: 'Person' })).toBeInTheDocument()
    expect(within(panel()).getByLabelText(/^Created on /)).toBeInTheDocument()
    expect(within(panel()).getByDisplayValue('Alice')).toBeInTheDocument()
    expect(useGraphStore.getState().selection.entityIds).toEqual([alice.id])
    expect(useGraphStore.getState().entities[alice.id]?.type).toBe('person')

    act(() => useGraphStore.getState().updateEntity(alice.id, { label: 'Alicia' }))
    await user.click(screen.getByRole('button', { name: 'to-fr' }))
    act(() => useGraphStore.getState().undo())
    expect(useGraphStore.getState().entities[alice.id]?.label).toBe('Alice')
  })
})

describe('relations in English', () => {
  it('keeps a stored relation label as it is', () => {
    const relation = createRelation(
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
      'connaît',
      true,
      'verified',
    )
    const props = {
      id: relation.id,
      source: 'a',
      target: 'b',
      data: { relation },
    } as unknown as EdgeProps<RelationEdge>
    inEnglish(
      <svg>
        <FloatingEdge {...props} />
      </svg>,
    )
    expect(screen.getByText('connaît')).toBeInTheDocument()
  })

  it('suggests English labels and defaults to the first one', async () => {
    const onSubmit = vi.fn()
    inEnglish(<RelationDialog open fromLabel="A" toLabel="B" onOpenChange={() => {}} onSubmit={onSubmit} />)
    const suggestions = Array.from(document.querySelectorAll('#relation-suggestions option')).map((option) =>
      option.getAttribute('value'),
    )
    expect(suggestions).toEqual(en.relations.suggestions)
    expect(suggestions).toContain('knows')
    expect(suggestions).toContain('works for')
    await userEvent.click(screen.getByRole('button', { name: 'Create relation' }))
    expect(onSubmit).toHaveBeenCalledWith('linked to', true, 'hypothesis')
  })
})
