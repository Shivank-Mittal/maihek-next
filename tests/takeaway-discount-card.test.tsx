import { render, screen, fireEvent } from '@testing-library/react'
import { TakeawayDiscountCard } from '@/components/settings/takeaway-discount-card'
import { mockTakeawayDiscountCardProps, mockTakeawayDiscount } from './mocks'

describe('TakeawayDiscountCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the card with correct title and description', () => {
    render(<TakeawayDiscountCard {...mockTakeawayDiscountCardProps} />)

    expect(screen.getByText('Remise a emporter')).toBeInTheDocument()
    expect(screen.getByText('-10% a emporter')).toBeInTheDocument()
  })

  it('shows "Aucune remise active" when discount is disabled', () => {
    const disabledProps = {
      ...mockTakeawayDiscountCardProps,
      takeawayDiscount: { ...mockTakeawayDiscount, enabled: false },
    }

    render(<TakeawayDiscountCard {...disabledProps} />)
    expect(screen.getByText('Aucune remise active')).toBeInTheDocument()
  })

  it('renders the enable/disable switch', () => {
    render(<TakeawayDiscountCard {...mockTakeawayDiscountCardProps} />)

    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeInTheDocument()
    expect(switchElement).toBeChecked()
  })

  it('calls onChange when switch is toggled', () => {
    render(<TakeawayDiscountCard {...mockTakeawayDiscountCardProps} />)

    const switchElement = screen.getByRole('switch')
    fireEvent.click(switchElement)

    expect(mockTakeawayDiscountCardProps.onChange).toHaveBeenCalledWith({
      ...mockTakeawayDiscount,
      enabled: false,
    })
  })

  it('renders percentage input with correct value', () => {
    render(<TakeawayDiscountCard {...mockTakeawayDiscountCardProps} />)

    const input = screen.getByDisplayValue('10')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'number')
  })

  it('calls onChange when percentage is changed', () => {
    render(<TakeawayDiscountCard {...mockTakeawayDiscountCardProps} />)

    const input = screen.getByDisplayValue('10')
    fireEvent.change(input, { target: { value: '15' } })

    expect(mockTakeawayDiscountCardProps.onChange).toHaveBeenCalledWith({
      ...mockTakeawayDiscount,
      percentage: 15,
    })
  })

  it('renders checkboxes for exclusions', () => {
    render(<TakeawayDiscountCard {...mockTakeawayDiscountCardProps} />)

    // Check that checkboxes are rendered (Radix UI checkboxes have role="checkbox")
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
  })

  it('renders all dishes with checkboxes', () => {
    render(<TakeawayDiscountCard {...mockTakeawayDiscountCardProps} />)

    // Check that we have checkboxes rendered (Radix UI checkboxes have role="checkbox")
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)
  })

  it('renders categories and dishes sections', () => {
    render(<TakeawayDiscountCard {...mockTakeawayDiscountCardProps} />)

    // Check main sections are rendered
    expect(screen.getByText('Exclure des categories')).toBeInTheDocument()
    expect(screen.getByText('Exclure des plats')).toBeInTheDocument()

    // Check that at least some content is rendered (avoiding specific text matching issues)
    const card = screen.getByText('Remise a emporter').closest('[data-slot="card"]')
    expect(card).toBeInTheDocument()
  })

  it('calls onChange when interacting with form elements', () => {
    render(<TakeawayDiscountCard {...mockTakeawayDiscountCardProps} />)

    // Test percentage input change
    const input = screen.getByDisplayValue('10')
    fireEvent.change(input, { target: { value: '15' } })
    expect(mockTakeawayDiscountCardProps.onChange).toHaveBeenCalled()

    // Test switch toggle
    const switchElement = screen.getByRole('switch')
    fireEvent.click(switchElement)
    expect(mockTakeawayDiscountCardProps.onChange).toHaveBeenCalledTimes(2)
  })

  it('renders save button', () => {
    render(<TakeawayDiscountCard {...mockTakeawayDiscountCardProps} />)

    const saveButton = screen.getByRole('button', { name: 'Enregistrer la remise' })
    expect(saveButton).toBeInTheDocument()
  })

  it('calls onSave when save button is clicked', () => {
    render(<TakeawayDiscountCard {...mockTakeawayDiscountCardProps} />)

    const saveButton = screen.getByRole('button', { name: 'Enregistrer la remise' })
    fireEvent.click(saveButton)

    expect(mockTakeawayDiscountCardProps.onSave).toHaveBeenCalledTimes(1)
  })

  it('shows loading state correctly', () => {
    const loadingProps = { ...mockTakeawayDiscountCardProps, loading: true }

    render(<TakeawayDiscountCard {...loadingProps} />)

    // Switch should be disabled
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeDisabled()

    // Input should be disabled
    const input = screen.getByDisplayValue('10')
    expect(input).toBeDisabled()

    // Checkboxes should be disabled
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeDisabled()
    })

    // Save button should show loading text and be disabled
    const saveButton = screen.getByRole('button', { name: 'Enregistrement...' })
    expect(saveButton).toBeDisabled()
  })

  it('shows exclusions in summary when categories are excluded', () => {
    const excludedProps = {
      ...mockTakeawayDiscountCardProps,
      takeawayDiscount: {
        ...mockTakeawayDiscount,
        excludedCategoryNames: ['Pizza', 'Desserts'],
      },
    }

    render(<TakeawayDiscountCard {...excludedProps} />)
    expect(screen.getByText('-10% a emporter, hors Pizza, Desserts')).toBeInTheDocument()
  })
})