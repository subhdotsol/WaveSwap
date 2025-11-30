import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TokenSelector from '../TokenSelector'
import { Token } from '@/types/token'

// Mock the TokenIcon component
vi.mock('@/components/TokenIcon', () => ({
  TokenIcon: ({ token, size, className }: { token: Token; size?: number; className?: string }) => (
    <div data-testid={`token-icon-${token.symbol}`} className={className}>
      {token.symbol}
    </div>
  ),
}))

// Mock the theme config
vi.mock('@/lib/theme', () => ({
  useThemeConfig: () => ({
    colors: {
      primary: '#000000',
      secondary: '#333333',
      accent: '#666666',
    },
  }),
  createGlassStyles: () => ({}),
}))

// Mock the Jupiter tokens service
vi.mock('@/lib/jupiterTokens', () => ({
  JupiterTokenService: {
    getInstance: () => ({
      searchTokens: vi.fn().mockResolvedValue([]),
    }),
  },
}))

const mockTokens: Token[] = [
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    chainId: 101,
    decimals: 6,
    name: 'USD Coin',
    symbol: 'USDC',
    logoURI: 'https://example.com/usdc.png',
    isConfidentialSupported: true,
    tags: ['stablecoin'],
  },
  {
    address: 'So11111111111111111111111111111111111111112',
    chainId: 101,
    decimals: 9,
    name: 'Solana',
    symbol: 'SOL',
    logoURI: 'https://example.com/sol.png',
    isConfidentialSupported: false,
    tags: ['native'],
  },
  {
    address: 'WAVE-token-address-here',
    chainId: 101,
    decimals: 9,
    name: 'Wave',
    symbol: 'WAVE',
    logoURI: 'https://example.com/wave.png',
    isConfidentialSupported: true,
    tags: ['defi'],
  },
]

const mockBalances = new Map([
  ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', '1000.50'],
  ['So11111111111111111111111111111111111111112', '2.25'],
  ['WAVE-token-address-here', '500.00'],
])

describe('TokenSelector', () => {
  const mockOnTokenChange = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('renders with selected token', () => {
      render(
        <TokenSelector
          selectedToken={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
          balances={mockBalances}
        />
      )

      expect(screen.getByText('USDC')).toBeInTheDocument()
      expect(screen.getByText('1000.50')).toBeInTheDocument()
    })

    it('renders placeholder when no token selected', () => {
      render(
        <TokenSelector
          selectedToken={null}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
        />
      )

      expect(screen.getByText('Select a token')).toBeInTheDocument()
    })

    it('opens token modal when clicked', async () => {
      render(
        <TokenSelector
          selectedToken={null}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
        />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('Select a token')).toBeInTheDocument() // Modal title
      })
    })

    it('closes modal when X is clicked', async () => {
      render(
        <TokenSelector
          selectedToken={null}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
        />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /close/i }))

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Token List', () => {
    it('displays all available tokens', async () => {
      render(
        <TokenSelector
          selectedToken={null}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
          balances={mockBalances}
        />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
        expect(screen.getByText('SOL')).toBeInTheDocument()
        expect(screen.getByText('WAVE')).toBeInTheDocument()
      })
    })

    it('displays token balances when provided', async () => {
      render(
        <TokenSelector
          selectedToken={null}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
          balances={mockBalances}
        />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('1000.50')).toBeInTheDocument() // USDC balance
        expect(screen.getByText('2.25')).toBeInTheDocument() // SOL balance
        expect(screen.getByText('500.00')).toBeInTheDocument() // WAVE balance
      })
    })

    it('filters tokens when searching', async () => {
      render(
        <TokenSelector
          selectedToken={null}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
        />
      )

      await user.click(screen.getByRole('button'))

      const searchInput = screen.getByPlaceholderText(/search tokens/i)
      await user.type(searchInput, 'USDC')

      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
        expect(screen.queryByText('SOL')).not.toBeInTheDocument()
        expect(screen.queryByText('WAVE')).not.toBeInTheDocument()
      })
    })

    it('selects token when clicked', async () => {
      render(
        <TokenSelector
          selectedToken={null}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
        />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('USDC')).toBeInTheDocument()
      })

      await user.click(screen.getByText('USDC'))

      expect(mockOnTokenChange).toHaveBeenCalledWith(mockTokens[0])
    })

    it('excludes selected token from the list', async () => {
      render(
        <TokenSelector
          selectedToken={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
        />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.queryByText('USDC')).not.toBeInTheDocument() // Selected token excluded
        expect(screen.getByText('SOL')).toBeInTheDocument()
        expect(screen.getByText('WAVE')).toBeInTheDocument()
      })
    })
  })

  describe('Privacy Mode', () => {
    it('shows normal symbols for input selector when privacy mode is enabled', async () => {
      render(
        <TokenSelector
          selectedToken={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
          isPrivacyMode={true}
          isOutputSelector={false} // Input selector
        />
      )

      expect(screen.getByText('USDC')).toBeInTheDocument()
      expect(screen.queryByText('cUSDC')).not.toBeInTheDocument()
    })

    it('shows confidential prefix for output selector when privacy mode is enabled', async () => {
      render(
        <TokenSelector
          selectedToken={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
          isPrivacyMode={true}
          isOutputSelector={true} // Output selector
        />
      )

      expect(screen.getByText('cUSDC')).toBeInTheDocument()
      expect(screen.queryByText('USDC')).not.toBeInTheDocument()
    })

    it('does not show confidential prefix for non-supported tokens', async () => {
      render(
        <TokenSelector
          selectedToken={mockTokens[1]} // SOL - not confidential supported
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
          isPrivacyMode={true}
          isOutputSelector={true}
        />
      )

      expect(screen.getByText('SOL')).toBeInTheDocument()
      expect(screen.queryByText('cSOL')).not.toBeInTheDocument()
    })

    it('shows confidential prefixes in token list when privacy mode is enabled', async () => {
      render(
        <TokenSelector
          selectedToken={null}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
          isPrivacyMode={true}
          isOutputSelector={true}
        />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('cUSDC')).toBeInTheDocument() // Confidential supported
        expect(screen.getByText('cWAVE')).toBeInTheDocument() // Confidential supported
        expect(screen.getByText('SOL')).toBeInTheDocument() // Not confidential supported
      })
    })
  })

  describe('Disabled State', () => {
    it('disables the selector when disabled prop is true', () => {
      render(
        <TokenSelector
          selectedToken={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
          disabled={true}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('cursor-not-allowed')
    })

    it('does not open modal when disabled', async () => {
      render(
        <TokenSelector
          selectedToken={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
          disabled={true}
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      expect(screen.queryByText('Select a token')).not.toBeInTheDocument() // Modal should not open
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <TokenSelector
          selectedToken={mockTokens[0]}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Selected token: USDC')
    })

    it('closes modal on Escape key', async () => {
      render(
        <TokenSelector
          selectedToken={null}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
        />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByText('Select a token')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByText('Select a token')).not.toBeInTheDocument()
      })
    })
  })

  describe('Token Icons', () => {
    it('renders token icons in the list', async () => {
      render(
        <TokenSelector
          selectedToken={null}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
        />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        expect(screen.getByTestId('token-icon-USDC')).toBeInTheDocument()
        expect(screen.getByTestId('token-icon-SOL')).toBeInTheDocument()
        expect(screen.getByTestId('token-icon-WAVE')).toBeInTheDocument()
      })
    })

    it('shows fallback icons for tokens without logoURI', async () => {
      const tokensWithoutLogo = mockTokens.map(token => ({
        ...token,
        logoURI: undefined,
      }))

      render(
        <TokenSelector
          selectedToken={null}
          onTokenChange={mockOnTokenChange}
          tokens={tokensWithoutLogo}
        />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        // Should still render token icons even without logoURI
        expect(screen.getByTestId('token-icon-USDC')).toBeInTheDocument()
      })
    })
  })

  describe('Common Tokens Section', () => {
    it('highlights common tokens', async () => {
      render(
        <TokenSelector
          selectedToken={null}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
        />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        // Check for common tokens section
        expect(screen.getByText('Common')).toBeInTheDocument()
      })
    })

    it('shows star icon for common tokens', async () => {
      render(
        <TokenSelector
          selectedToken={null}
          onTokenChange={mockOnTokenChange}
          tokens={mockTokens}
        />
      )

      await user.click(screen.getByRole('button'))

      await waitFor(() => {
        // USDC and USDT are common tokens and should have star icons
        const starIcons = screen.getAllByTestId('star-icon')
        expect(starIcons.length).toBeGreaterThan(0)
      })
    })
  })
})