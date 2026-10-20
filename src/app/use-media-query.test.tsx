import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { mockViewport } from '@/test/viewport'
import { useIsNarrow } from './use-media-query'

function Probe() {
  return <p>{useIsNarrow() ? 'narrow' : 'wide'}</p>
}

describe('useIsNarrow', () => {
  it('is wide by default', () => {
    render(<Probe />)
    expect(screen.getByText('wide')).toBeInTheDocument()
  })

  it('is narrow when the viewport is mocked narrow', () => {
    mockViewport('narrow')
    render(<Probe />)
    expect(screen.getByText('narrow')).toBeInTheDocument()
  })

  it('re-renders when the viewport changes', () => {
    mockViewport('wide')
    render(<Probe />)
    expect(screen.getByText('wide')).toBeInTheDocument()
    mockViewport('narrow')
    expect(screen.getByText('narrow')).toBeInTheDocument()
    mockViewport('wide')
    expect(screen.getByText('wide')).toBeInTheDocument()
  })
})
