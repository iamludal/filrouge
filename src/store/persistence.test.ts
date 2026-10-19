import { FilrougeDatabase } from '@/db/dexie'
import { graphRepository, type GraphChanges } from '@/db/repositories/graph'
import { investigationsRepository } from '@/db/repositories/investigations'
import { useGraphStore } from '@/store/graph-store'
import { startAutosave } from '@/store/persistence'

async function setup() {
  const db = new FilrougeDatabase(`test-${crypto.randomUUID()}`)
  const investigations = investigationsRepository(db)
  const repository = graphRepository(db)
  const investigation = await investigations.create('Autosave')
  useGraphStore.getState().load({ investigation, entities: [], relations: [], sources: [] })
  return { investigations, repository, investigation }
}

describe('autosave', () => {
  afterEach(() => useGraphStore.getState().close())

  it('debounces edits into a single write', async () => {
    const { repository, investigation, investigations } = await setup()
    const spy = vi.spyOn(repository, 'applyChanges')
    const autosave = startAutosave(repository, 20)

    const a = useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    useGraphStore.getState().updateEntity(a.id, { label: 'Alice' })
    useGraphStore.getState().moveEntities({ [a.id]: { x: 48, y: 64 } })
    await vi.waitFor(() => expect(useGraphStore.getState().saveStatus).toBe('saved'))
    expect(spy).toHaveBeenCalledTimes(1)

    const snapshot = await investigations.loadSnapshot(investigation.id)
    expect(snapshot?.entities).toEqual([
      expect.objectContaining({ label: 'Alice', position: { x: 48, y: 64 } }),
    ])
    autosave.stop()
  })

  it('flushes immediately on demand', async () => {
    const { repository, investigation } = await setup()
    const autosave = startAutosave(repository, 60_000)
    useGraphStore.getState().addEntity('domain', { x: 0, y: 0 }, 'example.org')
    await autosave.flush()
    expect(await repository.listEntities(investigation.id)).toHaveLength(1)
    autosave.stop()
  })

  it('keeps failed changes pending and reports the error', async () => {
    const { investigation } = await setup()
    const failing = {
      applyChanges: vi
        .fn<(changes: GraphChanges) => Promise<void>>()
        .mockRejectedValueOnce(new Error('quota')),
    } as unknown as ReturnType<typeof graphRepository>
    const onError = vi.fn()
    const autosave = startAutosave(failing, 60_000, onError)
    useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    await autosave.flush()
    expect(onError).toHaveBeenCalledOnce()
    expect(useGraphStore.getState().saveStatus).toBe('error')

    ;(failing.applyChanges as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined)
    await autosave.flush()
    expect(failing.applyChanges).toHaveBeenLastCalledWith(
      expect.objectContaining({ investigationId: investigation.id, upsertEntities: [expect.anything()] }),
    )
    expect(useGraphStore.getState().saveStatus).toBe('saved')
    autosave.stop()
  })

  it('retries a failed save with the source and its screenshot together', async () => {
    const { repository, investigation } = await setup()
    const spy = vi.spyOn(repository, 'applyChanges').mockRejectedValueOnce(new Error('quota'))
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1])
    const attachment = {
      id: crypto.randomUUID(),
      investigationId: investigation.id,
      blob: new Blob([bytes], { type: 'image/png' }),
      mime: 'image/png' as const,
      size: bytes.length,
      sha256: 'a'.repeat(64),
    }
    const autosave = startAutosave(repository, 60_000, () => {})
    const entity = useGraphStore.getState().addEntity('person', { x: 0, y: 0 })
    const source = useGraphStore
      .getState()
      .createSource({ title: 'Capture' }, attachment, { type: 'entity', id: entity.id })!

    await autosave.flush()
    expect(useGraphStore.getState().saveStatus).toBe('error')
    expect(await repository.listSources(investigation.id)).toEqual([])

    await autosave.flush()
    expect(spy).toHaveBeenCalledTimes(2)
    expect(useGraphStore.getState().saveStatus).toBe('saved')
    expect(await repository.listSources(investigation.id)).toEqual([source])
    expect(await repository.listEntities(investigation.id)).toEqual([
      expect.objectContaining({ id: entity.id, sourceIds: [source.id] }),
    ])
    autosave.stop()
  })
})
