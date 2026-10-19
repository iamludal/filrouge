import type { Edge, Node } from '@xyflow/react'
import type { Entity, Relation } from '@/domain/schemas'

export type EntityNode = Node<{ entity: Entity }, 'entity'>
export type RelationEdge = Edge<{ relation: Relation }, 'relation'>
