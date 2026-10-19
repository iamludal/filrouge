import type { Confidence } from '@/domain/schemas'

type Reliability = Confidence['reliability']
type Credibility = Confidence['credibility']

interface Grade<T> {
  value: T
  /** Shown in selectors, after "<value> — ". */
  label: string
  /** Reads naturally in a sentence about the grade. */
  phrase: string
}

/** Admiralty code, first half: how reliable the source is. */
export const RELIABILITY: readonly Grade<Reliability>[] = [
  { value: 'A', label: 'Totalement fiable', phrase: 'source totalement fiable' },
  { value: 'B', label: 'Habituellement fiable', phrase: 'source habituellement fiable' },
  { value: 'C', label: 'Assez fiable', phrase: 'source assez fiable' },
  { value: 'D', label: 'Pas toujours fiable', phrase: 'source pas toujours fiable' },
  { value: 'E', label: 'Peu fiable', phrase: 'source peu fiable' },
  { value: 'F', label: 'Fiabilité indéterminée', phrase: 'fiabilité de la source indéterminée' },
]

/** Admiralty code, second half: how credible the information is. */
export const CREDIBILITY: readonly Grade<Credibility>[] = [
  { value: 1, label: 'Confirmée', phrase: 'information confirmée' },
  { value: 2, label: 'Probablement vraie', phrase: 'information probablement vraie' },
  { value: 3, label: 'Possiblement vraie', phrase: 'information possiblement vraie' },
  { value: 4, label: 'Douteuse', phrase: 'information douteuse' },
  { value: 5, label: 'Improbable', phrase: 'information improbable' },
  { value: 6, label: 'Véracité indéterminée', phrase: 'véracité de l’information indéterminée' },
]

/** The "cannot be judged" values, used to complete a grade of which only one half is known. */
const UNKNOWN_RELIABILITY: Reliability = 'F'
const UNKNOWN_CREDIBILITY: Credibility = 6

export function formatConfidence(confidence: Confidence): string {
  return `${confidence.reliability}${confidence.credibility}`
}

export function describeConfidence(confidence: Confidence): string {
  const reliability = RELIABILITY.find((grade) => grade.value === confidence.reliability)
  const credibility = CREDIBILITY.find((grade) => grade.value === confidence.credibility)
  return `Cotation ${formatConfidence(confidence)} : ${reliability?.phrase}, ${credibility?.phrase}`
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
