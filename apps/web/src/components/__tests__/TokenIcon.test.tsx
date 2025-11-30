import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TokenIcon from '../TokenIcon'

// Mock the theme config
vi.mock('@/lib/theme', () => ({
  useThemeConfig: () => ({
    name: 'dark',
    colors: {
      background: '#1a1a1a',
      surface: '#2a2a2a',
      borderLight: '#333333',
      textSecondary: '#999999',
    },
  }),
}))

describe('TokenIcon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders token icon with logoURI', () => {
    render(
      <TokenIcon
        symbol="USDC"
        mint="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        logoURI="https://example.com/usdc.png"
      />
    )

    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('alt', 'USDC')
    expect(img).toHaveAttribute('src', 'https://example.com/usdc.png')
  })

  it('renders without logoURI (shows fallback)', () => {
    render(
      <TokenIcon
        symbol="USDC"
        mint="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
      />
    )

    // Should show fallback with USDC text or local fallback
    expect(screen.getByText('USDC')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const customClass = 'custom-icon-class'
    const { container } = render(
      <TokenIcon
        symbol="USDC"
        mint="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        className={customClass}
      />
    )

    expect(container.firstChild).toHaveClass(customClass)
  })

  it('renders SOL with special gradient fallback', () => {
    const solMint = 'So11111111111111111111111111111111111111112'
    render(
      <TokenIcon
        symbol="SOL"
        mint={solMint}
      />
    )

    expect(screen.getByText('SOL')).toBeInTheDocument()
  })

  it('uses custom size', () => {
    const { container } = render(
      <TokenIcon
        symbol="USDC"
        mint="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        size={32}
      />
    )

    const iconContainer = container.firstChild as HTMLElement
    expect(iconContainer.style.width).toBe('32px')
    expect(iconContainer.style.height).toBe('32px')
  })

  it('handles IPFS URLs correctly', () => {
    const ipfsUrl = 'ipfs/QmExampleHash'
    render(
      <TokenIcon
        symbol="TEST"
        mint="test-mint"
        logoURI={ipfsUrl}
      />
    )

    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    // Should use Pinata gateway as first choice
    expect(img.getAttribute('src')).toContain('gateway.pinata.cloud')
  })

  it('shows fallback symbol when no logoURI', () => {
    render(
      <TokenIcon
        symbol="WAVE"
        mint="WAVE-token-address-here"
      />
    )

    // Should show first 2 letters of symbol in fallback
    expect(screen.getByText('WA')).toBeInTheDocument()
  })

  it('shows local fallback for known tokens', () => {
    render(
      <TokenIcon
        symbol="WAVE"
        mint="WAVE-token-address-here"
      />
    )

    // Should find and use local fallback icon
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toContain('/icons/fallback/token/wave.png')
  })

  it('handles Jupiter CDN URLs', () => {
    const jupiterUrl = 'https://img-cdn.jup.ag/tokens/USDC.svg'
    render(
      <TokenIcon
        symbol="USDC"
        mint="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
        logoURI={jupiterUrl}
      />
    )

    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    // Should try alternative CDN endpoints first
    expect(img.getAttribute('src')).toContain('raw.jup.ag')
  })
})