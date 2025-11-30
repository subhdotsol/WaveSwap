import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SwapInput from '../SwapInput'

const mockTokens = [
  {
    symbol: 'USDC',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
  },
  {
    symbol: 'SOL',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
  },
  {
    symbol: 'WAVE',
    mint: 'WAVE-token-address-here',
    decimals: 9,
  },
]

describe('SwapInput', () => {
  const mockOnAmountChange = vi.fn()
  const mockOnTokenChange = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('renders with label and placeholder', () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      expect(screen.getByText('From')).toBeInTheDocument()
      expect(screen.getByDisplayValue('')).toBeInTheDocument()
      expect(screen.getByText('USDC')).toBeInTheDocument()
    })

    it('displays token amount when provided', () => {
      render(
        <SwapInput
          label="From"
          amount="100.25"
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      expect(screen.getByDisplayValue('100.25')).toBeInTheDocument()
    })

    it('calls onAmountChange when input value changes', async () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      const input = screen.getByRole('spinbutton')
      await user.type(input, '100')

      expect(mockOnAmountChange).toHaveBeenCalledWith('100')
    })

    it('displays balance information', () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      expect(screen.getByText('Balance: 1000.50')).toBeInTheDocument()
    })

    it('shows loading state for balance', () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance=""
          balanceLoading={true}
        />
      )

      expect(screen.getByRole('button', { name: /balance/i })).not.toBeInTheDocument()
      expect(screen.getByText('Balance: ')).toBeInTheDocument()
    })
  })

  describe('Max Button Functionality', () => {
    it('sets amount to balance when max button is clicked', async () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      const maxButton = screen.getByRole('button', { name: /balance:/i })
      await user.click(maxButton)

      expect(mockOnAmountChange).toHaveBeenCalledWith('1000.50')
    })

    it('does not set amount when balance is zero', () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="0"
          balanceLoading={false}
        />
      )

      const maxButton = screen.getByRole('button', { name: /balance:/i })
      expect(maxButton).toBeDisabled()
    })

    it('does not show max button when readonly', () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
          readonly={true}
        />
      )

      expect(screen.queryByRole('button', { name: /balance:/i })).not.toBeInTheDocument()
    })
  })

  describe('Token Selector', () => {
    it('opens token selector when token selector button is clicked', async () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      const tokenSelectorButton = screen.getByRole('button', { name: /USDC/i })
      await user.click(tokenSelectorButton)

      // The token selector dropdown should appear
      expect(screen.getByText('SOL')).toBeInTheDocument()
      expect(screen.getByText('WAVE')).toBeInTheDocument()
      expect(screen.queryByText('USDC')).not.toBeInTheDocument() // Selected token excluded
    })

    it('filters out selected token from available options', async () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]} // USDC selected
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      const tokenSelectorButton = screen.getByRole('button', { name: /USDC/i })
      await user.click(tokenSelectorButton)

      expect(screen.queryByText('USDC')).not.toBeInTheDocument() // Should not show selected token
      expect(screen.getByText('SOL')).toBeInTheDocument()
      expect(screen.getByText('WAVE')).toBeInTheDocument()
    })

    it('calls onTokenChange when a token is selected', async () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      const tokenSelectorButton = screen.getByRole('button', { name: /USDC/i })
      await user.click(tokenSelectorButton)

      const solToken = screen.getByText('SOL')
      await user.click(solToken)

      expect(mockOnTokenChange).toHaveBeenCalledWith(mockTokens[1])
    })

    it('displays token decimals information', async () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      const tokenSelectorButton = screen.getByRole('button', { name: /USDC/i })
      await user.click(tokenSelectorButton)

      expect(screen.getByText('6 decimals')).toBeInTheDocument() // USDC has 6 decimals
      expect(screen.getByText('9 decimals')).toBeInTheDocument() // SOL has 9 decimals
    })
  })

  describe('Disabled and Readonly States', () => {
    it('disables input when disabled prop is true', () => {
      render(
        <SwapInput
          label="From"
          amount="100"
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
          disabled={true}
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toBeDisabled()
    })

    it('makes input readonly when readonly prop is true', () => {
      render(
        <SwapInput
          label="From"
          amount="100"
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
          readonly={true}
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('cursor-not-allowed')
    })

    it('disables token selector when disabled prop is true', () => {
      render(
        <SwapInput
          label="From"
          amount="100"
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
          disabled={true}
        />
      )

      const tokenSelectorButton = screen.getByRole('button', { name: /USDC/i })
      expect(tokenSelectorButton).toBeDisabled()
    })

    it('disables token selector when readonly prop is true', () => {
      render(
        <SwapInput
          label="From"
          amount="100"
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
          readonly={true}
        />
      )

      const tokenSelectorButton = screen.getByRole('button', { name: /USDC/i })
      expect(tokenSelectorButton).toBeDisabled()
    })
  })

  describe('Input Validation', () => {
    it('accepts decimal numbers', async () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      const input = screen.getByRole('spinbutton')
      await user.type(input, '100.25')

      expect(mockOnAmountChange).toHaveBeenCalledWith('100.25')
    })

    it('accepts only positive numbers', async () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      const input = screen.getByRole('spinbutton')

      // Test negative number input (should not allow negative)
      await user.type(input, '-100')

      // Input should sanitize to '100' or similar positive value
      expect(mockOnAmountChange).toHaveBeenCalledWith('100')
    })

    it('handles step attribute properly', () => {
      render(
        <SwapInput
          label="From"
          amount="100.25"
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('step', 'any')
      expect(input).toHaveAttribute('min', '0')
    })
  })

  describe('Accessibility', () => {
    it('has proper labeling for screen readers', () => {
      render(
        <SwapInput
          label="From"
          amount="100"
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toBeVisible()

      // Check that the label is associated with the input
      expect(screen.getByText('From')).toBeInTheDocument()
    })

    it('provides button labels for accessibility', () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      const tokenSelectorButton = screen.getByRole('button', { name: /USDC/i })
      expect(tokenSelectorButton).toBeInTheDocument()
    })
  })

  describe('Visual States', () => {
    it('shows wallet icon next to balance', () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      // Check for wallet icon (it should be visible)
      const walletIcon = document.querySelector('.h-4.w-4.text-secondary-400')
      expect(walletIcon).toBeInTheDocument()
    })

    it('shows chevron down icon in token selector', () => {
      render(
        <SwapInput
          label="From"
          amount=""
          onAmountChange={mockOnAmountChange}
          token={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          availableTokens={mockTokens}
          balance="1000.50"
          balanceLoading={false}
        />
      )

      // Check for chevron down icon
      const chevronIcon = document.querySelector('.h-4.w-4.text-secondary-400.flex-shrink-0')
      expect(chevronIcon).toBeInTheDocument()
    })
  })
})