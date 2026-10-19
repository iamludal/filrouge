import { create } from 'zustand'
import type { EntityTypeId } from '@/domain/entity-types'
import { createEntity, createRelation } from '@/domain/factories'
import { orphanedRelationIds } from '@/domain/graph'
import type { Entity, Investigation, InvestigationSnapshot, Position, Relation } from '@/domain/schemas'
import type { GraphChanges } from '@/db/repositories/graph'
import { nowIso } from '@/lib/ids'

export type EntityPatch = Partial<Omit<Entity, 'id' | 'investigationId' | 'createdAt' | 'updatedAt'>>
export type RelationPatch = Partial<
  Pick<Relation, 'label' | 'directed' | 'status' | 'confidence' | 'sourceIds'>
>
export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error'

export interface Selection {
  entityIds: string[]
  relationIds: string[]
}

interface Dirty {
  entities: ReadonlySet<string>
  relations: ReadonlySet<string>
  deletedEntities: ReadonlySet<string>
  deletedRelations: ReadonlySet<string>
}

export interface GraphState {
  investigation: Investigation | null
  entities: Record<string, Entity>
  relations: Record<string, Relation>
  selection: Selection
  dirty: Dirty
  saveStatus: SaveStatus

  load: (snapshot: InvestigationSnapshot) => void
  close: () => void
  setInvestigation: (investigation: Investigation) => void

  addEntity: (type: EntityTypeId, position: Position, label?: string) => Entity
  updateEntity: (id: string, patch: EntityPatch) => void
  moveEntities: (positions: Record<string, Position>) => void
  addRelation: (from: string, to: string, label: string, directed?: boolean) => Relation | null
  updateRelation: (id: string, patch: RelationPatch) => void
  /** Removes entities (and their relations, in cascade) and relations. */
  removeElements: (entityIds: string[], relationIds: string[]) => void
  setSelection: (selection: Selection) => void

  /** Hands the pending edits over to the persistence layer and clears them. */
  takeChanges: () => GraphChanges | null
  /** Puts back edits that failed to save so the next attempt retries them. */
  restoreChanges: (changes: GraphChanges) => void
  setSaveStatus: (status: SaveStatus) => void
}

const EMPTY_SELECTION: Selection = { entityIds: [], relationIds: [] }

function emptyDirty(): Dirty {
  return {
    entities: new Set(),
    relations: new Set(),
    deletedEntities: new Set(),
    deletedRelations: new Set(),
  }
}

function withAdded(set: ReadonlySet<string>, ids: Iterable<string>): Set<string> {
  const next = new Set(set)
  for (const id of ids) next.add(id)
  return next
}

function withRemoved(set: ReadonlySet<string>, ids: Iterable<string>): Set<string> {
  const next = new Set(set)
  for (const id of ids) next.delete(id)
  return next
}

function omit<T>(record: Record<string, T>, ids: Iterable<string>): Record<string, T> {
  const next = { ...record }
  for (const id of ids) delete next[id]
  return next
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((id) => set.has(id))
}

function isDirty(dirty: Dirty): boolean {
  return (
    dirty.entities.size + dirty.relations.size + dirty.deletedEntities.size + dirty.deletedRelations.size > 0
  )
}

export const useGraphStore = create<GraphState>()((set, get) => {
  /** Marks records as modified. */
  const touch = (state: GraphState, entityIds: string[], relationIds: string[]) => ({
    dirty: {
      ...state.dirty,
      entities: withAdded(state.dirty.entities, entityIds),
      relations: withAdded(state.dirty.relations, relationIds),
    },
    saveStatus: 'pending' as const,
  })

  return {
    investigation: null,
    entities: {},
    relations: {},
    selection: EMPTY_SELECTION,
    dirty: emptyDirty(),
    saveStatus: 'saved',

    load: (snapshot) =>
      set({
        investigation: snapshot.investigation,
        entities: Object.fromEntries(snapshot.entities.map((entity) => [entity.id, entity])),
        relations: Object.fromEntries(snapshot.relations.map((relation) => [relation.id, relation])),
        selection: EMPTY_SELECTION,
        dirty: emptyDirty(),
        saveStatus: 'saved',
      }),

    close: () =>
      set({
        investigation: null,
        entities: {},
        relations: {},
        selection: EMPTY_SELECTION,
        dirty: emptyDirty(),
        saveStatus: 'saved',
      }),

    setInvestigation: (investigation) => set({ investigation }),

    addEntity: (type, position, label) => {
      const investigation = get().investigation
      if (!investigation) throw new Error('Aucune enquête ouverte')
      const entity = createEntity(investigation.id, type, position, label)
      set((state) => ({
        entities: { ...state.entities, [entity.id]: entity },
        selection: { entityIds: [entity.id], relationIds: [] },
        ...touch(state, [entity.id], []),
      }))
      return entity
    },

    updateEntity: (id, patch) =>
      set((state) => {
        const current = state.entities[id]
        if (!current) return state
        return {
          entities: { ...state.entities, [id]: { ...current, ...patch, updatedAt: nowIso() } },
          ...touch(state, [id], []),
        }
      }),

    moveEntities: (positions) =>
      set((state) => {
        const entities = { ...state.entities }
        const moved: string[] = []
        for (const [id, position] of Object.entries(positions)) {
          const current = entities[id]
          if (!current || (current.position.x === position.x && current.position.y === position.y)) continue
          entities[id] = { ...current, position }
          moved.push(id)
        }
        if (moved.length === 0) return state
        return { entities, ...touch(state, moved, []) }
      }),

    addRelation: (from, to, label, directed = true) => {
      const { investigation, entities } = get()
      if (!investigation || from === to || !entities[from] || !entities[to]) return null
      const relation = createRelation(investigation.id, from, to, label, directed)
      set((state) => ({
        relations: { ...state.relations, [relation.id]: relation },
        selection: { entityIds: [], relationIds: [relation.id] },
        ...touch(state, [], [relation.id]),
      }))
      return relation
    },

    updateRelation: (id, patch) =>
      set((state) => {
        const current = state.relations[id]
        if (!current) return state
        return {
          relations: { ...state.relations, [id]: { ...current, ...patch, updatedAt: nowIso() } },
          ...touch(state, [], [id]),
        }
      }),

    removeElements: (entityIds, relationIds) =>
      set((state) => {
        const removedEntities = entityIds.filter((id) => state.entities[id])
        const removedRelations = [
          ...new Set([
            ...relationIds.filter((id) => state.relations[id]),
            ...orphanedRelationIds(Object.values(state.relations), removedEntities),
          ]),
        ]
        if (removedEntities.length === 0 && removedRelations.length === 0) return state
        return {
          entities: omit(state.entities, removedEntities),
          relations: omit(state.relations, removedRelations),
          selection: {
            entityIds: state.selection.entityIds.filter((id) => !removedEntities.includes(id)),
            relationIds: state.selection.relationIds.filter((id) => !removedRelations.includes(id)),
          },
          dirty: {
            entities: withRemoved(state.dirty.entities, removedEntities),
            relations: withRemoved(state.dirty.relations, removedRelations),
            deletedEntities: withAdded(state.dirty.deletedEntities, removedEntities),
            deletedRelations: withAdded(state.dirty.deletedRelations, removedRelations),
          },
          saveStatus: 'pending',
        }
      }),

    setSelection: (selection) =>
      set((state) =>
        sameIds(state.selection.entityIds, selection.entityIds) &&
        sameIds(state.selection.relationIds, selection.relationIds)
          ? state
          : { selection },
      ),

    takeChanges: () => {
      const { investigation, entities, relations, dirty } = get()
      if (!investigation || !isDirty(dirty)) return null
      const changes: GraphChanges = {
        investigationId: investigation.id,
        upsertEntities: [...dirty.entities].flatMap((id) => entities[id] ?? []),
        upsertRelations: [...dirty.relations].flatMap((id) => relations[id] ?? []),
        deleteEntityIds: [...dirty.deletedEntities],
        deleteRelationIds: [...dirty.deletedRelations],
      }
      set({ dirty: emptyDirty() })
      return changes
    },

    restoreChanges: (changes) =>
      set((state) => {
        if (state.investigation?.id !== changes.investigationId) return state
        const deletedEntities = withAdded(state.dirty.deletedEntities, changes.deleteEntityIds)
        const deletedRelations = withAdded(state.dirty.deletedRelations, changes.deleteRelationIds)
        return {
          dirty: {
            // Records deleted since the failed attempt must not be resurrected.
            entities: withAdded(
              state.dirty.entities,
              changes.upsertEntities.map((e) => e.id).filter((id) => state.entities[id]),
            ),
            relations: withAdded(
              state.dirty.relations,
              changes.upsertRelations.map((r) => r.id).filter((id) => state.relations[id]),
            ),
            deletedEntities,
            deletedRelations,
          },
        }
      }),

    setSaveStatus: (saveStatus) => set({ saveStatus }),
  }
})

export function hasPendingChanges(state: GraphState): boolean {
  return isDirty(state.dirty)
}
