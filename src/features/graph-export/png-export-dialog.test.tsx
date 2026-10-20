import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PngExportDialog, type PendingPng } from '@/features/graph-export/png-export-dialog'

const pending = (width: number, height: number): PendingPng => ({
  name: 'Opération Fil Rouge',
  svg: '<svg xmlns="http://www.w3.org/2000/svg"/>',
  width,
  height,
})

// French number formatting uses a narrow no-break space as thousands separator.
const spaced = (text: string) => new RegExp(text.replace(/[()]/g, '\\$&').replace(/ /g, '\\s'))

function renderDialog(width: number, height: number) {
  const onCancel = vi.fn()
  const onConfirm = vi.fn()
  render(<PngExportDialog pending={pending(width, height)} onCancel={onCancel} onConfirm={onConfirm} />)
  return { onCancel, onConfirm }
}

describe('PngExportDialog', () => {
  it('offers 1×, 2×, 4× and 8× with their sizes, 4× recommended and selected', () => {
    renderDialog(411, 336)
    expect(screen.getByRole('radiogroup', { name: 'Échelle' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(4)
    const recommended = screen.getByRole('radio', { name: /4× \(recommandé\)/ })
    expect(recommended).toBeChecked()
    expect(recommended.parentElement).toHaveTextContent(spaced('1 644 × 1 344 px'))
    expect(screen.getByRole('radio', { name: /^1×/ }).parentElement).toHaveTextContent('411 × 336 px')
    expect(screen.getByRole('radio', { name: /^8×/ }).parentElement).toHaveTextContent(
      spaced('3 288 × 2 688 px'),
    )
    expect(screen.queryByText(/limitée/)).not.toBeInTheDocument()
  })

  it('marks a size reduced by the canvas limits', () => {
    renderDialog(1200, 800)
    const label = screen.getByRole('radio', { name: /^8×/ }).parentElement
    expect(label).toHaveTextContent(spaced('5 016 × 3 344 px (limitée)'))
    expect(screen.getByRole('radio', { name: /^4×/ }).parentElement).not.toHaveTextContent('limitée')
  })

  it('focuses "Exporter" on opening, not the first scale', () => {
    renderDialog(411, 336)
    expect(screen.getByRole('button', { name: 'Exporter' })).toHaveFocus()
  })

  it('confirms with the selected scale', async () => {
    const { onConfirm } = renderDialog(411, 336)
    await userEvent.click(screen.getByRole('radio', { name: /^2×/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Exporter' }))
    expect(onConfirm).toHaveBeenCalledWith(2)
  })

  it('confirms 4× when nothing is changed', async () => {
    const { onConfirm } = renderDialog(411, 336)
    await userEvent.click(screen.getByRole('button', { name: 'Exporter' }))
    expect(onConfirm).toHaveBeenCalledWith(4)
  })

  it('cancels without confirming', async () => {
    const { onCancel, onConfirm } = renderDialog(411, 336)
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
