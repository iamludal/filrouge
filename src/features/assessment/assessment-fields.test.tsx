import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import type { Confidence, Status } from '@/domain/schemas'
import { AssessmentFields } from '@/features/assessment/assessment-fields'

function Harness({ status = 'verified', confidence }: { status?: Status; confidence?: Confidence }) {
  const [state, setState] = useState({ status, confidence })
  return (
    <>
      <AssessmentFields
        idPrefix="t"
        status={state.status}
        confidence={state.confidence}
        onChange={(patch) => setState((current) => ({ ...current, ...patch }))}
      />
      <output data-testid="state">{JSON.stringify(state)}</output>
    </>
  )
}

const state = () => JSON.parse(screen.getByTestId('state').textContent ?? '{}')

async function pick(selector: string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: selector }))
  await userEvent.click(await screen.findByRole('option', { name: option }))
}

describe('AssessmentFields', () => {
  it('toggles the status', async () => {
    render(<Harness status="hypothesis" />)
    const toggle = screen.getByRole('switch', { name: 'Hypothèse' })
    expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    expect(state().status).toBe('verified')
    await userEvent.click(toggle)
    expect(state().status).toBe('hypothesis')
  })

  it('grades in two steps and shows the notation', async () => {
    render(<Harness />)
    expect(screen.queryByRole('button', { name: 'Effacer la cotation' })).not.toBeInTheDocument()
    await pick('Fiabilité de la source', 'B — Habituellement fiable')
    expect(state().confidence).toEqual({ reliability: 'B', credibility: 6 })
    await pick('Crédibilité de l’information', '2 — Probablement vraie')
    expect(state().confidence).toEqual({ reliability: 'B', credibility: 2 })
    expect(screen.getByText('Cotation : B2')).toBeInTheDocument()
  })

  it('completes a grade of which only the credibility is picked', async () => {
    render(<Harness />)
    await pick('Crédibilité de l’information', '1 — Confirmée')
    expect(state().confidence).toEqual({ reliability: 'F', credibility: 1 })
  })

  it('changes one half and keeps the other', async () => {
    render(<Harness confidence={{ reliability: 'B', credibility: 2 }} />)
    await pick('Crédibilité de l’information', '4 — Douteuse')
    expect(state().confidence).toEqual({ reliability: 'B', credibility: 4 })
  })

  it('clears the grade', async () => {
    render(<Harness confidence={{ reliability: 'C', credibility: 3 }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Effacer la cotation' }))
    expect(state().confidence).toBeUndefined()
    expect(screen.queryByRole('button', { name: 'Effacer la cotation' })).not.toBeInTheDocument()
  })
})
