import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ElementTimestamps } from '@/features/entities/element-timestamps'
import { formatDate, formatDateTimeFull } from '@/lib/format'

const CREATED = '2026-10-20T12:32:05.000Z'
const EDITED = '2026-10-21T08:10:44.000Z'

function setup(updatedAt: string) {
  render(
    <TooltipProvider>
      <ElementTimestamps createdAt={CREATED} updatedAt={updatedAt} />
    </TooltipProvider>,
  )
}

describe('ElementTimestamps', () => {
  it('shows only the creation date of an element never edited', () => {
    setup(CREATED)
    expect(screen.getAllByText(/\d{4}/)).toHaveLength(1)
    expect(screen.getByText(formatDate(CREATED))).toBeInTheDocument()
    expect(screen.queryByLabelText(/^Modifiée le/)).not.toBeInTheDocument()
  })

  it('shows both dates once edited, with no visible label', () => {
    setup(EDITED)
    expect(screen.getByText(formatDate(CREATED))).toBeInTheDocument()
    expect(screen.getByText(formatDate(EDITED))).toBeInTheDocument()
    expect(screen.queryByText(/Créée|Modifiée/)).not.toBeInTheDocument()
  })

  it('names each date for assistive technology and exposes its ISO instant', () => {
    setup(EDITED)
    const created = screen.getByLabelText(`Créée le ${formatDateTimeFull(CREATED)}`)
    const edited = screen.getByLabelText(`Modifiée le ${formatDateTimeFull(EDITED)}`)
    expect(created).toHaveAttribute('datetime', CREATED)
    expect(edited).toHaveAttribute('datetime', EDITED)
  })

  it('opens a tooltip with the label and the seconds on keyboard focus', async () => {
    setup(EDITED)
    await userEvent.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent(`Créée le ${formatDateTimeFull(CREATED)}`)
    expect(formatDateTimeFull(CREATED)).toMatch(/:05$/)
  })
})
