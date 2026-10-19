import { create } from 'zustand'
import type { EntityTypeId } from '@/domain/entity-types'
import {
  attachmentLink,
  createEntity,
  createRelation,
  createSource,
  type SourceFields,
} from '@/domain/factories'
import { orphanedRelationIds, sourceUsage } from '@/domain/graph'
import type {
  Attachment,
  Entity,
  Investigation,
  InvestigationSnapshot,
  Position,
  Relation,
  Source,
} from '@/domain/schemas'
import type { GraphChanges } from '@/db/repositories/graph'
import { nowIso } from '@/lib/ids'

export type EntityPatch = Partial<Omit<Entity, 'id' | 'investigationId' | 'createdAt' | 'updatedAt'>>
export type RelationPatch = Partial<
  Pick<Relation, 'label' | 'directed' | 'status' | 'confidence' | 'sourceIds'>
>
export type SourcePatch = SourceFields
export type SaveStatus = 'saved' | 'pending' | 'saving' | 'error'

/** An entity or a relation, the two kinds of element a source can be attached to. */
export interface ElementRef {
  type: 'entity' | 'relation'
  id: string
}

export interface Selection {
  entityIds: string[]
  relationIds: string[]
}

interface Dirty {
  entities: ReadonlySet<string>
  relations: ReadonlySet<string>
  deletedEntities: ReadonlySet<string>
  deletedRelations: ReadonlySet<string>
  sources: ReadonlySet<string>
  deletedSources: ReadonlySet<string>
  attachments: ReadonlySet<string>
  deletedAttachments: ReadonlySet<string>
}

export interface GraphState {
  investigation: Investigation | null
  entities: Record<string, Entity>
  relations: Record<string, Relation>
  sources: Record<string, Source>
  /** Screenshots added in this session. Stored ones are read on demand from the repository. */
  attachments: Record<string, Attachment>
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
  /** Removes entities (and their relations, in cascade) and relations. Sources are kept. */
  removeElements: (entityIds: string[], relationIds: string[]) => void

  /** Creates a source, optionally with its screenshot and attached to an element. */
  createSource: (fields: SourceFields, attachment?: Attachment, attachTo?: ElementRef) => Source | null
  updateSource: (id: string, patch: SourcePatch) => void
  /** Replaces the screenshot of a source, or removes it with `null`. */
  setSourceAttachment: (sourceId: string, attachment: Attachment | null) => void
  attachSource: (element: ElementRef, sourceId: string) => void
  /** Detaches a source from one element; deletes it too when asked and nothing else uses it. */
  detachSource: (element: ElementRef, sourceId: string, deleteSource?: boolean) => void
  /** Deletes a source, its screenshot and every reference to it. */
  removeSource: (id: string) => void
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
    sources: new Set(),
    deletedSources: new Set(),
    attachments: new Set(),
    deletedAttachments: new Set(),
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
  return Object.values(dirty).some((ids) => ids.size > 0)
}

type ElementPatch = { sourceIds: string[] }

/** The state slice holding an element's records, and a function putting a patched one back. */
function patchElement(state: GraphState, ref: ElementRef, patch: (element: ElementPatch) => string[]) {
  if (ref.type === 'entity') {
    const entity = state.entities[ref.id]
    if (!entity) return null
    return {
      entities: { ...state.entities, [ref.id]: { ...entity, sourceIds: patch(entity), updatedAt: nowIso() } },
    }
  }
  const relation = state.relations[ref.id]
  if (!relation) return null
  return {
    relations: {
      ...state.relations,
      [ref.id]: { ...relation, sourceIds: patch(relation), updatedAt: nowIso() },
    },
  }
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

  /**
   * Forgets a screenshot that is no longer used. One never written is simply dropped; a stored
   * one is also listed for deletion.
   */
  const releaseAttachment = (state: GraphState, attachmentId: string) => ({
    attachments: omit(state.attachments, [attachmentId]),
    dirty: {
      attachments: withRemoved(state.dirty.attachments, [attachmentId]),
      deletedAttachments: withAdded(state.dirty.deletedAttachments, [attachmentId]),
    },
  })

  return {
    investigation: null,
    entities: {},
    relations: {},
    sources: {},
    attachments: {},
    selection: EMPTY_SELECTION,
    dirty: emptyDirty(),
    saveStatus: 'saved',

    load: (snapshot) =>
      set({
        investigation: snapshot.investigation,
        entities: Object.fromEntries(snapshot.entities.map((entity) => [entity.id, entity])),
        relations: Object.fromEntries(snapshot.relations.map((relation) => [relation.id, relation])),
        sources: Object.fromEntries(snapshot.sources.map((source) => [source.id, source])),
        attachments: {},
        selection: EMPTY_SELECTION,
        dirty: emptyDirty(),
        saveStatus: 'saved',
      }),

    close: () =>
      set({
        investigation: null,
        entities: {},
        relations: {},
        sources: {},
        attachments: {},
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
            ...state.dirty,
            entities: withRemoved(state.dirty.entities, removedEntities),
            relations: withRemoved(state.dirty.relations, removedRelations),
            deletedEntities: withAdded(state.dirty.deletedEntities, removedEntities),
            deletedRelations: withAdded(state.dirty.deletedRelations, removedRelations),
          },
          saveStatus: 'pending',
        }
      }),

    createSource: (fields, attachment, attachTo) => {
      const investigation = get().investigation
      if (!investigation) return null
      const source = createSource(investigation.id, fields, attachment)
      set((state) => {
        const attached = attachTo
          ? patchElement(state, attachTo, (element) => [...element.sourceIds, source.id])
          : null
        const touched = attached && attachTo ? touch(state, ...elementIds(attachTo)) : touch(state, [], [])
        return {
          ...attached,
          sources: { ...state.sources, [source.id]: source },
          attachments: attachment ? { ...state.attachments, [attachment.id]: attachment } : state.attachments,
          dirty: {
            ...touched.dirty,
            sources: withAdded(state.dirty.sources, [source.id]),
            attachments: attachment
              ? withAdded(state.dirty.attachments, [attachment.id])
              : state.dirty.attachments,
          },
          saveStatus: 'pending',
        }
      })
      return source
    },

    updateSource: (id, patch) =>
      set((state) => {
        const current = state.sources[id]
        if (!current) return state
        return {
          sources: { ...state.sources, [id]: { ...current, ...patch } },
          dirty: { ...state.dirty, sources: withAdded(state.dirty.sources, [id]) },
          saveStatus: 'pending',
        }
      }),

    setSourceAttachment: (sourceId, attachment) =>
      set((state) => {
        const current = state.sources[sourceId]
        if (!current) return state
        const { attachmentId, sha256: _sha256, originalSha256: _original, ...rest } = current
        const next: Source = { ...rest, ...attachmentLink(attachment ?? undefined) }
        const released =
          attachmentId && attachmentId !== attachment?.id ? releaseAttachment(state, attachmentId) : null
        const attachments = released?.attachments ?? state.attachments
        const dirty = {
          ...state.dirty,
          ...released?.dirty,
          sources: withAdded(state.dirty.sources, [sourceId]),
        }
        return {
          sources: { ...state.sources, [sourceId]: next },
          attachments: attachment ? { ...attachments, [attachment.id]: attachment } : attachments,
          dirty: attachment
            ? {
                ...dirty,
                attachments: withAdded(dirty.attachments, [attachment.id]),
                deletedAttachments: withRemoved(dirty.deletedAttachments, [attachment.id]),
              }
            : dirty,
          saveStatus: 'pending',
        }
      }),

    attachSource: (element, sourceId) =>
      set((state) => {
        if (!state.sources[sourceId]) return state
        const patched = patchElement(state, element, (current) =>
          current.sourceIds.includes(sourceId) ? current.sourceIds : [...current.sourceIds, sourceId],
        )
        return patched ? { ...patched, ...touch(state, ...elementIds(element)) } : state
      }),

    detachSource: (element, sourceId, deleteSource = false) => {
      set((state) => {
        const patched = patchElement(state, element, (current) =>
          current.sourceIds.filter((id) => id !== sourceId),
        )
        return patched ? { ...patched, ...touch(state, ...elementIds(element)) } : state
      })
      const state = get()
      const stillUsed = sourceUsage([
        ...Object.values(state.entities),
        ...Object.values(state.relations),
      ]).has(sourceId)
      if (deleteSource && !stillUsed) get().removeSource(sourceId)
    },

    removeSource: (id) =>
      set((state) => {
        const source = state.sources[id]
        if (!source) return state
        const entities = { ...state.entities }
        const relations = { ...state.relations }
        const changedEntities: string[] = []
        const changedRelations: string[] = []
        for (const [key, entity] of Object.entries(entities)) {
          if (!entity.sourceIds.includes(id)) continue
          entities[key] = {
            ...entity,
            sourceIds: entity.sourceIds.filter((s) => s !== id),
            updatedAt: nowIso(),
          }
          changedEntities.push(key)
        }
        for (const [key, relation] of Object.entries(relations)) {
          if (!relation.sourceIds.includes(id)) continue
          relations[key] = {
            ...relation,
            sourceIds: relation.sourceIds.filter((s) => s !== id),
            updatedAt: nowIso(),
          }
          changedRelations.push(key)
        }
        const released = source.attachmentId ? releaseAttachment(state, source.attachmentId) : null
        const touched = touch(state, changedEntities, changedRelations)
        return {
          entities,
          relations,
          sources: omit(state.sources, [id]),
          attachments: released?.attachments ?? state.attachments,
          dirty: {
            ...touched.dirty,
            ...released?.dirty,
            sources: withRemoved(state.dirty.sources, [id]),
            deletedSources: withAdded(state.dirty.deletedSources, [id]),
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
      const { investigation, entities, relations, sources, attachments, dirty } = get()
      if (!investigation || !isDirty(dirty)) return null
      const changes: GraphChanges = {
        investigationId: investigation.id,
        upsertEntities: [...dirty.entities].flatMap((id) => entities[id] ?? []),
        upsertRelations: [...dirty.relations].flatMap((id) => relations[id] ?? []),
        deleteEntityIds: [...dirty.deletedEntities],
        deleteRelationIds: [...dirty.deletedRelations],
        upsertSources: [...dirty.sources].flatMap((id) => sources[id] ?? []),
        deleteSourceIds: [...dirty.deletedSources],
        upsertAttachments: [...dirty.attachments].flatMap((id) => attachments[id] ?? []),
        deleteAttachmentIds: [...dirty.deletedAttachments],
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
            sources: withAdded(
              state.dirty.sources,
              (changes.upsertSources ?? []).map((src) => src.id).filter((id) => state.sources[id]),
            ),
            deletedSources: withAdded(state.dirty.deletedSources, changes.deleteSourceIds ?? []),
            attachments: withAdded(
              state.dirty.attachments,
              (changes.upsertAttachments ?? []).map((a) => a.id).filter((id) => state.attachments[id]),
            ),
            deletedAttachments: withAdded(state.dirty.deletedAttachments, changes.deleteAttachmentIds ?? []),
          },
        }
      }),

    setSaveStatus: (saveStatus) => set({ saveStatus }),
  }
})

function elementIds(ref: ElementRef): [string[], string[]] {
  return ref.type === 'entity' ? [[ref.id], []] : [[], [ref.id]]
}

export function hasPendingChanges(state: GraphState): boolean {
  return isDirty(state.dirty)
}
