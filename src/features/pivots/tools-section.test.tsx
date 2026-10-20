import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInvestigation } from '@/domain/factories'
import { toolsForType } from '@/domain/pivot-tools'
import { TooltipProvider } from '@/components/ui/tooltip'
import { EntityPanel } from '@/features/entities/entity-panel'
import { fr } from '@/i18n/messages/fr'
import { createFormatters } from '@/lib/format'
import { renderWithLocale } from '@/test/render-with-locale'
import { useGraphStore } from '@/store/graph-store'
import type { EntityTypeId } from '@/domain/entity-types'

const { formatDate } = createFormatters('fr', fr.common.units)

function Harness({ id }: { id: string }) {
  const entity = useGraphStore((state) => state.entities[id])
  return entity ? (
    <TooltipProvider>
      <EntityPanel entity={entity} />
    </TooltipProvider>
  ) : null
}

function openStore(type: EntityTypeId, label: string) {
  useGraphStore.getState().close()
  const investigation = createInvestigation('Outils')
  useGraphStore.getState().load({ investigation, entities: [], relations: [], sources: [] })
  return useGraphStore.getState().addEntity(type, { x: 0, y: 0 }, label)
}

const expand = () => userEvent.click(screen.getByRole('tab', { name: /^Outils/ }))

describe('tools tab', () => {
  afterEach(() => useGraphStore.getState().close())

  it('starts on the details tab, with 0 checked tools out of those listed for the type', () => {
    const entity = openStore('domain', 'exemple.fr')
    render(<Harness id={entity.id} />)
    const toggle = screen.getByRole('tab', { name: /^Outils/ })
    expect(screen.getByRole('tab', { name: 'Détails' })).toHaveAttribute('aria-selected', 'true')
    expect(toggle).toHaveAttribute('aria-selected', 'false')
    expect(toggle).toHaveTextContent(`0 / ${toolsForType('domain').length}`)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('lists the tools of a domain by category, not those of an alias', async () => {
    const entity = openStore('domain', 'exemple.fr')
    render(<Harness id={entity.id} />)
    await expand()
    expect(screen.getByRole('tab', { name: /^Outils/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('heading', { name: 'Whois et DNS' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /crt\.sh/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Shodan/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /sherlock/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ajouter|modifier|supprimer/i })).not.toBeInTheDocument()
  })

  it('opens each tool in a new tab without opener or referrer, showing its host', async () => {
    const entity = openStore('domain', 'exemple.fr')
    render(<Harness id={entity.id} />)
    await expand()
    const link = screen.getByRole('link', { name: /crt\.sh/ })
    expect(link).toHaveAttribute('href', 'https://crt.sh/?q=exemple.fr')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(within(link).getByText('crt.sh', { selector: 'span.text-xs' })).toBeInTheDocument()
  })

  it('encodes the label and cleans a phone number in the address', async () => {
    const person = openStore('person', ' Jean Dupont & Cie ')
    const { unmount } = render(<Harness id={person.id} />)
    await expand()
    expect(screen.getByRole('link', { name: /Google/ })).toHaveAttribute(
      'href',
      'https://www.google.com/search?q=%22Jean%20Dupont%20%26%20Cie%22',
    )
    unmount()

    const phone = openStore('phone', '+33 6 12 34 56 78')
    render(<Harness id={phone.id} />)
    await expand()
    expect(screen.getByRole('link', { name: /Dehashed/ })).toHaveAttribute(
      'href',
      'https://dehashed.com/search?query=%2B33612345678',
    )
    expect(useGraphStore.getState().entities[phone.id]?.label).toBe('+33 6 12 34 56 78')
  })

  it('disables query links of an unnamed entity but keeps plain links usable', async () => {
    const entity = openStore('alias', '')
    render(<Harness id={entity.id} />)
    await expand()
    const disabled = screen.getByText('WhatsMyName').closest('[aria-disabled="true"]')
    expect(disabled).not.toBeNull()
    expect(disabled).toHaveTextContent('Renseignez un libellé')
    expect(screen.queryByRole('link', { name: /WhatsMyName/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sherlock/ })).toHaveAttribute(
      'href',
      'https://github.com/sherlock-project/sherlock',
    )
  })

  it('checks a tool: shows the date, updates the count and the entity', async () => {
    const entity = openStore('domain', 'exemple.fr')
    render(<Harness id={entity.id} />)
    await expand()
    const box = screen.getByRole('checkbox', { name: 'Marquer crt.sh comme utilisé' })
    expect(box).not.toBeChecked()
    await userEvent.click(box)

    const checkedAt = useGraphStore.getState().entities[entity.id]?.toolChecks?.[0]?.checkedAt as string
    expect(box).toBeChecked()
    expect(screen.getByLabelText(/^Utilisé le/)).toHaveTextContent(formatDate(checkedAt))
    expect(screen.getByRole('tab', { name: /^Outils/ })).toHaveTextContent(
      `1 / ${toolsForType('domain').length}`,
    )

    await userEvent.click(box)
    expect(box).not.toBeChecked()
    expect(useGraphStore.getState().entities[entity.id]).not.toHaveProperty('toolChecks')
  })

  it('marks a checked row, so it reads as done at a glance', async () => {
    const entity = openStore('domain', 'exemple.fr')
    render(<Harness id={entity.id} />)
    await expand()
    const row = screen.getByRole('link', { name: /crt\.sh/ }).closest('li')
    expect(row).toHaveAttribute('data-checked', 'false')
    await userEvent.click(screen.getByRole('checkbox', { name: 'Marquer crt.sh comme utilisé' }))
    expect(row).toHaveAttribute('data-checked', 'true')
    expect(screen.getByRole('link', { name: /crt\.sh/ })).toBeInTheDocument()
  })

  it('does not check a tool when its link is opened', async () => {
    const entity = openStore('domain', 'exemple.fr')
    render(<Harness id={entity.id} />)
    await expand()
    await userEvent.click(screen.getByRole('link', { name: /crt\.sh/ }))
    expect(screen.getByRole('checkbox', { name: 'Marquer crt.sh comme utilisé' })).not.toBeChecked()
    expect(useGraphStore.getState().entities[entity.id]?.toolChecks).toBeUndefined()
  })

  it('checks with the keyboard: arrow to the tab, then Space on the checkbox', async () => {
    const entity = openStore('domain', 'exemple.fr')
    render(<Harness id={entity.id} />)
    screen.getByRole('tab', { name: 'Détails' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /^Outils/ })).toHaveFocus()
    expect(screen.getByRole('tab', { name: /^Outils/ })).toHaveAttribute('aria-selected', 'true')
    const box = screen.getByRole('checkbox', { name: 'Marquer crt.sh comme utilisé' })
    box.focus()
    await userEvent.keyboard(' ')
    expect(box).toBeChecked()
  })

  it('hides the checks of tools that no longer apply and shows them again with their date', async () => {
    const entity = openStore('domain', 'exemple.fr')
    render(<Harness id={entity.id} />)
    await expand()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Marquer crt.sh comme utilisé' }))
    const checkedAt = useGraphStore.getState().entities[entity.id]?.toolChecks?.[0]?.checkedAt as string

    useGraphStore.getState().updateEntity(entity.id, { type: 'url' })
    expect(await screen.findByRole('tab', { name: /^Outils/ })).toHaveTextContent(
      `0 / ${toolsForType('url').length}`,
    )
    expect(screen.queryByRole('checkbox', { name: 'Marquer crt.sh comme utilisé' })).not.toBeInTheDocument()

    useGraphStore.getState().updateEntity(entity.id, { type: 'domain' })
    expect(await screen.findByRole('checkbox', { name: 'Marquer crt.sh comme utilisé' })).toBeChecked()
    expect(screen.getByLabelText(/^Utilisé le/)).toHaveTextContent(formatDate(checkedAt))
  })

  it('does not display or count a check for an unknown tool, and keeps it', async () => {
    const entity = openStore('domain', 'exemple.fr')
    useGraphStore.getState().setToolCheck(entity.id, 'future-tool', true)
    render(<Harness id={entity.id} />)
    await expand()
    expect(screen.getByRole('tab', { name: /^Outils/ })).toHaveTextContent(
      `0 / ${toolsForType('domain').length}`,
    )
    expect(screen.queryByText(/future-tool/)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('checkbox', { name: 'Marquer crt.sh comme utilisé' }))
    expect(useGraphStore.getState().entities[entity.id]?.toolChecks?.map((check) => check.toolId)).toEqual([
      'future-tool',
      'crtsh',
    ])
  })

  it('is back on the details tab for another entity', async () => {
    const first = openStore('domain', 'exemple.fr')
    const second = useGraphStore.getState().addEntity('domain', { x: 10, y: 0 }, 'autre.fr')
    const { rerender } = render(<Harness key={first.id} id={first.id} />)
    await expand()
    rerender(<Harness key={second.id} id={second.id} />)
    expect(screen.getByRole('tab', { name: 'Détails' })).toHaveAttribute('aria-selected', 'true')
  })

  it('shows English headings and untranslated tool names', async () => {
    const entity = openStore('email', 'jean@example.org')
    renderWithLocale(<Harness id={entity.id} />, 'en')
    await userEvent.click(screen.getByRole('tab', { name: /^Tools/ }))
    expect(screen.getByRole('heading', { name: 'Data breaches' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Have I Been Pwned/ })).toHaveAttribute(
      'href',
      'https://haveibeenpwned.com/account/jean%40example.org',
    )
    expect(screen.getByRole('checkbox', { name: 'Mark holehe as used' })).toBeInTheDocument()
  })
})
