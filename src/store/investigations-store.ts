import { create } from 'zustand'
import { parseExport, remapIds, serializeExport, type ImportError } from '@/domain/export-format'
import type { Investigation } from '@/domain/schemas'
import { investigations as repository } from '@/db/repositories/investigations'

export type ImportResult =
  { ok: true; investigation: Investigation; copied: boolean } | { ok: false; errors: ImportError[] }

interface InvestigationsState {
  items: Investigation[]
  loaded: boolean
  refresh: () => Promise<void>
  create: (name: string, description?: string) => Promise<Investigation>
  update: (id: string, patch: { name?: string; description?: string }) => Promise<Investigation>
  remove: (id: string) => Promise<void>
  exportJson: (id: string, includeAttachments?: boolean) => Promise<{ name: string; json: string } | null>
  importJson: (text: string) => Promise<ImportResult>
}

export const useInvestigationsStore = create<InvestigationsState>()((set, get) => ({
  items: [],
  loaded: false,

  refresh: async () => set({ items: await repository.list(), loaded: true }),

  create: async (name, description) => {
    const investigation = await repository.create(name, description)
    await get().refresh()
    return investigation
  },

  update: async (id, patch) => {
    const investigation = await repository.update(id, patch)
    await get().refresh()
    return investigation
  },

  remove: async (id) => {
    await repository.remove(id)
    await get().refresh()
  },

  exportJson: async (id, includeAttachments = true) => {
    const exported = await repository.loadExport(id)
    if (!exported) return null
    const { snapshot, attachments } = exported
    return {
      name: snapshot.investigation.name,
      json: await serializeExport(snapshot, includeAttachments ? attachments : []),
    }
  },

  importJson: async (text) => {
    const parsed = await parseExport(text)
    if (!parsed.ok) return parsed
    // An investigation with the same id already exists: import a copy under fresh ids.
    const copied = (await repository.get(parsed.snapshot.investigation.id)) !== undefined
    const { snapshot, attachments } = copied ? remapIds(parsed) : parsed
    await repository.importSnapshot(snapshot, attachments)
    await get().refresh()
    return { ok: true, investigation: snapshot.investigation, copied }
  },
}))
