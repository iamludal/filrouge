import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Plus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useTheme } from '@/app/theme'
import { Button } from '@/components/ui/button'
import { ENTITY_TYPES } from '@/domain/entity-types'
import type { Entity, Position, Relation } from '@/domain/schemas'
import { AddEntityDialog } from '@/features/entities/add-entity-dialog'
import { EntityNode } from '@/features/graph/entity-node'
import { FloatingEdge } from '@/features/graph/floating-edge'
import type { EntityNode as EntityNodeType, RelationEdge } from '@/features/graph/types'
import { RelationDialog } from '@/features/relations/relation-dialog'
import { useGraphStore, type Selection } from '@/store/graph-store'

const nodeTypes = { entity: EntityNode }
const edgeTypes = { relation: FloatingEdge }
export const GRID_SIZE = 16
const SNAP_GRID: [number, number] = [GRID_SIZE, GRID_SIZE]
const DELETE_KEYS = ['Delete', 'Backspace']
// Entity nodes are 144px wide; their circle is centred horizontally.
const NODE_HALF_WIDTH = 72

function snap(position: Position): Position {
  return {
    x: Math.round(position.x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(position.y / GRID_SIZE) * GRID_SIZE,
  }
}

/**
 * React Flow keeps its own node/edge arrays (measured sizes, drag state…). They are rebuilt from
 * the store whenever the domain data changes, keeping React Flow's internal fields.
 */
function syncNodes(
  current: EntityNodeType[],
  entities: Record<string, Entity>,
  selection: Selection,
): EntityNodeType[] {
  const byId = new Map(current.map((node) => [node.id, node]))
  const selected = new Set(selection.entityIds)
  return Object.values(entities).map((entity) => {
    const node = byId.get(entity.id)
    return {
      ...node,
      id: entity.id,
      type: 'entity',
      position: node?.dragging ? node.position : entity.position,
      selected: selected.has(entity.id),
      data: { entity },
    }
  })
}

function syncEdges(
  current: RelationEdge[],
  relations: Record<string, Relation>,
  selection: Selection,
): RelationEdge[] {
  const byId = new Map(current.map((edge) => [edge.id, edge]))
  const selected = new Set(selection.relationIds)
  return Object.values(relations).map((relation) => ({
    ...byId.get(relation.id),
    id: relation.id,
    type: 'relation',
    source: relation.from,
    target: relation.to,
    selected: selected.has(relation.id),
    markerEnd: relation.directed ? { type: MarkerType.ArrowClosed, width: 18, height: 18 } : undefined,
    data: { relation },
  }))
}

export function GraphCanvas() {
  const entities = useGraphStore((state) => state.entities)
  const { addEntity, moveEntities, addRelation, removeElements, setSelection } = useGraphStore.getState()
  const { resolved } = useTheme()
  const { screenToFlowPosition } = useReactFlow()

  const [nodes, setNodes] = useState<EntityNodeType[]>(() => {
    const { entities, selection } = useGraphStore.getState()
    return syncNodes([], entities, selection)
  })
  const [edges, setEdges] = useState<RelationEdge[]>(() => {
    const { relations, selection } = useGraphStore.getState()
    return syncEdges([], relations, selection)
  })
  // Fit only an existing graph: fitting on the first created node would make the viewport jump.
  const [fitView] = useState(() => nodes.length > 0)
  const [pendingEntity, setPendingEntity] = useState<Position | null>(null)
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null)

  // Domain edits and store-driven selection (e.g. a freshly created element) flow into React Flow.
  useEffect(
    () =>
      useGraphStore.subscribe((state, previous) => {
        if (state.entities !== previous.entities || state.selection !== previous.selection) {
          setNodes((current) => syncNodes(current, state.entities, state.selection))
        }
        if (state.relations !== previous.relations || state.selection !== previous.selection) {
          setEdges((current) => syncEdges(current, state.relations, state.selection))
        }
      }),
    [],
  )

  const onNodesChange = useCallback(
    (changes: NodeChange<EntityNodeType>[]) => {
      setNodes((current) => applyNodeChanges(changes, current))
      // Positions are committed to the store when a drag ends (or on keyboard moves).
      const moved: Record<string, Position> = {}
      for (const change of changes) {
        if (change.type === 'position' && change.position && !change.dragging)
          moved[change.id] = change.position
      }
      if (Object.keys(moved).length > 0) moveEntities(moved)
    },
    [moveEntities],
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange<RelationEdge>[]) => setEdges((current) => applyEdgeChanges(changes, current)),
    [],
  )

  const onSelectionChange = useCallback(
    ({ nodes, edges }: OnSelectionChangeParams) =>
      setSelection({ entityIds: nodes.map((node) => node.id), relationIds: edges.map((edge) => edge.id) }),
    [setSelection],
  )

  const onDelete = useCallback(
    ({ nodes, edges }: { nodes: EntityNodeType[]; edges: RelationEdge[] }) =>
      removeElements(
        nodes.map((node) => node.id),
        edges.map((edge) => edge.id),
      ),
    [removeElements],
  )

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source !== connection.target) setPendingConnection(connection)
  }, [])

  const openAddEntityAt = useCallback(
    (clientX: number, clientY: number) =>
      setPendingEntity(snap(screenToFlowPosition({ x: clientX, y: clientY }))),
    [screenToFlowPosition],
  )

  const onDoubleClick = useCallback(
    (event: MouseEvent) => {
      if ((event.target as HTMLElement).classList.contains('react-flow__pane')) {
        openAddEntityAt(event.clientX, event.clientY)
      }
    },
    [openAddEntityAt],
  )

  const addAtViewportCenter = () => {
    const bounds = document.querySelector('.react-flow')?.getBoundingClientRect()
    if (bounds) openAddEntityAt(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2)
  }

  const labelOf = (id: string | undefined) => {
    const entity = id ? entities[id] : undefined
    return entity ? entity.label || ENTITY_TYPES[entity.type].label : ''
  }

  const minimapColor = useMemo(() => (node: EntityNodeType) => ENTITY_TYPES[node.data.entity.type].color, [])

  return (
    <div className="size-full" onDoubleClick={onDoubleClick}>
      <ReactFlow<EntityNodeType, RelationEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        onDelete={onDelete}
        onConnect={onConnect}
        colorMode={resolved}
        snapToGrid
        snapGrid={SNAP_GRID}
        deleteKeyCode={DELETE_KEYS}
        zoomOnDoubleClick={false}
        minZoom={0.1}
        fitView={fitView}
        fitViewOptions={{ maxZoom: 1.2 }}
        attributionPosition="top-right"
        aria-label="Graphe de l’enquête"
      >
        <Background variant={BackgroundVariant.Dots} gap={GRID_SIZE} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={minimapColor} ariaLabel="Mini-carte" />
        <Panel position="top-left">
          <Button size="sm" onClick={addAtViewportCenter}>
            <Plus /> Entité
          </Button>
        </Panel>
        {nodes.length === 0 && (
          <Panel position="top-center" className="pointer-events-none mt-16 text-sm text-muted-foreground">
            Double-cliquez sur le canevas ou utilisez « Entité » pour commencer.
          </Panel>
        )}
      </ReactFlow>

      <AddEntityDialog
        open={pendingEntity !== null}
        onOpenChange={(open) => !open && setPendingEntity(null)}
        onSubmit={(type, label) => {
          if (pendingEntity)
            addEntity(type, { x: pendingEntity.x - NODE_HALF_WIDTH, y: pendingEntity.y - 24 }, label)
        }}
      />

      <RelationDialog
        open={pendingConnection !== null}
        fromLabel={labelOf(pendingConnection?.source)}
        toLabel={labelOf(pendingConnection?.target)}
        onOpenChange={(open) => !open && setPendingConnection(null)}
        onSubmit={(label, directed, status) => {
          if (pendingConnection)
            addRelation(pendingConnection.source, pendingConnection.target, label, directed, status)
        }}
      />
    </div>
  )
}
