import { render, screen } from '@testing-library/react'
import { App } from '@/app/app'
import { Providers } from '@/app/providers'

describe('App shell', () => {
  it('renders the brand and the theme toggle', () => {
    render(
      <Providers>
        <App />
      </Providers>,
    )
    expect(screen.getByText('filrouge')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Changer de thème' })).toBeInTheDocument()
  })
})
