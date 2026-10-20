import type { Confidence } from '@/domain/schemas'

type Reliability = Confidence['reliability']
type Credibility = Confidence['credibility']

/** Admiralty code, first half: how reliable the source is, best first. */
export const RELIABILITY_VALUES: readonly Reliability[] = ['A', 'B', 'C', 'D', 'E', 'F']

/** Admiralty code, second half: how credible the information is, best first. */
export const CREDIBILITY_VALUES: readonly Credibility[] = [1, 2, 3, 4, 5, 6]

/** The texts of the scale in one language; the dictionaries provide them. */
export interface AssessmentTexts {
  reliability: Record<Reliability, { label: string; phrase: string }>
  credibility: Record<Credibility, { label: string; phrase: string }>
  describe: (grade: string, reliability: string, credibility: string) => string
}

/** The "cannot be judged" values, used to complete a grade of which only one half is known. */
const UNKNOWN_RELIABILITY: Reliability = 'F'
const UNKNOWN_CREDIBILITY: Credibility = 6

export function formatConfidence(confidence: Confidence): string {
  return `${confidence.reliability}${confidence.credibility}`
}

export function describeConfidence(confidence: Confidence, texts: AssessmentTexts): string {
  return texts.describe(
    formatConfidence(confidence),
    texts.reliability[confidence.reliability].phrase,
    texts.credibility[confidence.credibility].phrase,
  )
}

export function withReliability(current: Confidence | undefined, reliability: Reliability): Confidence {
  return { reliability, credibility: current?.credibility ?? UNKNOWN_CREDIBILITY }
}

export function withCredibility(current: Confidence | undefined, credibility: Credibility): Confidence {
  return { reliability: current?.reliability ?? UNKNOWN_RELIABILITY, credibility }
}

/** Text of a relation's link: its label, followed by its grade when it has one. */
export function relationLabelText(label: string, confidence: Confidence | undefined): string {
  return [label, confidence && formatConfidence(confidence)].filter(Boolean).join(' · ')
}
