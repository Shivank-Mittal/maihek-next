import { render, screen } from '@testing-library/react'
import { Spinner } from '@/components/spinner'

describe('Spinner', () => {
  it('renders the spinner icon', () => {
    render(<Spinner />)

    // Check that the SVG icon is rendered
    const spinnerIcon = document.querySelector('svg')
    expect(spinnerIcon).toBeInTheDocument()
  })

  it('has the correct classes', () => {
    render(<Spinner />)

    const container = document.querySelector('.flex.items-center.justify-center')
    expect(container).toBeInTheDocument()

    const icon = document.querySelector('svg')
    expect(icon).toHaveClass('lucide', 'lucide-loader-circle', 'h-6', 'w-6', 'animate-spin', 'text-muted-foreground')
  })
})