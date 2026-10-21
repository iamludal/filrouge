import { parseExport } from '@/domain/export-format'

// The demo investigations shipped in examples/ must stay importable as the model evolves.
const files = import.meta.glob<string>('../../examples/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const expected: Record<string, { entities: number; relations: number; sources: number }> = {
  'demo-operation-levante.json': { entities: 25, relations: 33, sources: 12 },
  'demo-fake-bike-shop.json': { entities: 10, relations: 11, sources: 5 },
}

describe('demo investigations', () => {
  const names = Object.keys(files).map((path) => path.split('/').pop() ?? path)

  it('lists exactly the expected files', () => {
    expect(names.sort()).toEqual(Object.keys(expected).sort())
  })

  it.each(Object.entries(files))('%s is accepted by the import parser', async (path, text) => {
    const result = await parseExport(text)
    if (!result.ok) throw new Error(`${path}: ${JSON.stringify(result.errors)}`)
    const counts = expected[path.split('/').pop() ?? path]
    expect({
      entities: result.snapshot.entities.length,
      relations: result.snapshot.relations.length,
      sources: result.snapshot.sources.length,
    }).toEqual(counts)
  })
})
