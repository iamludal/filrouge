import {
  CREDIBILITY_VALUES,
  RELIABILITY_VALUES,
  describeConfidence,
  formatConfidence,
  relationLabelText,
  withCredibility,
  withReliability,
} from '@/domain/assessment'
import { fr } from '@/i18n/messages/fr'

describe('assessment', () => {
  it('lists both scales in order', () => {
    expect(RELIABILITY_VALUES).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
    expect(CREDIBILITY_VALUES).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('formats and describes a grade', () => {
    const grade = { reliability: 'B', credibility: 2 } as const
    expect(formatConfidence(grade)).toBe('B2')
    expect(describeConfidence(grade, fr.assessment)).toBe(
      'Cotation B2 : source habituellement fiable, information probablement vraie',
    )
  })

  it('describes the "cannot be judged" values', () => {
    expect(describeConfidence({ reliability: 'F', credibility: 6 }, fr.assessment)).toBe(
      `Cotation F6 : fiabilité de la source indéterminée, véracité de l'information indéterminée`,
    )
  })

  it('completes a half grade with the unknown value', () => {
    expect(withReliability(undefined, 'A')).toEqual({ reliability: 'A', credibility: 6 })
    expect(withCredibility(undefined, 1)).toEqual({ reliability: 'F', credibility: 1 })
  })

  it('changes one half and keeps the other', () => {
    const grade = { reliability: 'B', credibility: 2 } as const
    expect(withCredibility(grade, 4)).toEqual({ reliability: 'B', credibility: 4 })
    expect(withReliability(grade, 'E')).toEqual({ reliability: 'E', credibility: 2 })
  })

  it('appends the grade to a relation label', () => {
    const grade = { reliability: 'C', credibility: 3 } as const
    expect(relationLabelText('connaît', grade)).toBe('connaît · C3')
    expect(relationLabelText('', { reliability: 'A', credibility: 1 })).toBe('A1')
    expect(relationLabelText('connaît', undefined)).toBe('connaît')
    expect(relationLabelText('', undefined)).toBe('')
  })
})
