import type { Edge, Node } from '@xyflow/react'
import type { Entity, Relation } from '@/domain/schemas'

/** `dimmed` and `highlighted` come from the search; they never alter the element itself. */
export type ViewFlags = { dimmed?: boolean; highlighted?: boolean }

export type EntityNode = Node<{ entity: Entity } & ViewFlags, 'entity'>
export type RelationEdge = Edge<{ relation: Relation } & ViewFlags, 'relation'>
