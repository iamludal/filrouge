import { connectedComponents } from '@/domain/layout/components'

const edge = (from: string, to: string) => ({ id: `${from}-${to}`, from, to })

describe('connectedComponents', () => {
  it('splits linked groups from orphans', () => {
    const { groups, orphans } = connectedComponents(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      [edge('a', 'b'), edge('b', 'c'), edge('d', 'e')],
    )
    expect(groups.map((g) => g.nodeIds)).toEqual([
      ['a', 'b', 'c'],
      ['d', 'e'],
    ])
    expect(groups.map((g) => g.edges.map((e) => e.id))).toEqual([['a-b', 'b-c'], ['d-e']])
    expect(orphans).toEqual(['f', 'g'])
  })

  it('orders groups by size, then by their oldest entity', () => {
    const { groups } = connectedComponents(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      [edge('a', 'b'), edge('c', 'd'), edge('e', 'f'), edge('f', 'g')],
    )
    expect(groups.map((g) => g.nodeIds)).toEqual([
      ['e', 'f', 'g'],
      ['a', 'b'],
      ['c', 'd'],
    ])
  })

  it('keeps the input order inside a group, whatever the relation order', () => {
    const { groups } = connectedComponents(['a', 'b', 'c'], [edge('c', 'b'), edge('b', 'a')])
    expect(groups[0]?.nodeIds).toEqual(['a', 'b', 'c'])
  })

  it('ignores self-relations and relations to entities outside the input', () => {
    const { groups, orphans } = connectedComponents(['a', 'b'], [edge('a', 'a'), edge('b', 'z')])
    expect(groups).toEqual([])
    expect(orphans).toEqual(['a', 'b'])
  })
})
