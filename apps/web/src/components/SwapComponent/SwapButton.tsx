'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { ArrowPathIcon, LockClosedIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ReactNode } from 'react'
import { SwapProgress, SwapStatus } from '@/types/token'

interface SwapButtonProps {
  inputAmount: string
  inputToken: any
  outputToken: any
  quote: any
  loading: boolean
  privacyMode: boolean
  canSwap: boolean
  onSwap: () => void
  onCancel: () => void
  progress: SwapProgress | null
}

export function SwapButton({
  inputAmount,
  inputToken,
  outputToken,
  quote,
  loading,
  privacyMode,
  canSwap,
  onSwap,
  onCancel,
  progress
}: SwapButtonProps) {
  const { connected } = useWallet()

  const isValidAmount = inputAmount && parseFloat(inputAmount) > 0
  const hasBalance = true // TODO: Check actual balance from hook
  const hasQuote = quote && quote.outputAmount > 0
  const isProgressActive = progress && progress.status !== SwapStatus.IDLE && progress.status !== SwapStatus.COMPLETED

  let buttonContent: ReactNode = ''
  let buttonDisabled = false
  let buttonStyle: React.CSSProperties = {}
  const baseClass = 'glass-btn-primary w-full py-4 px-8 rounded-2xl text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]'

  if (!connected) {
    buttonContent = <span>CONNECT WALLET</span>
    buttonDisabled = false
    buttonStyle = {
      background: 'var(--wave-purple)',
      color: 'white',
      border: '1px solid rgba(162, 89, 250, 0.4)'
    }
  } else if (!isValidAmount) {
    buttonContent = <span>ENTER AMOUNT</span>
    buttonDisabled = true
    buttonStyle = {
      background: 'rgba(40, 40, 60, 0.5)',
      color: 'rgba(240, 240, 240, 0.5)',
      border: '1px solid rgba(162, 89, 250, 0.1)',
      cursor: 'not-allowed'
    }
  } else if (!hasBalance) {
    buttonContent = <span>INSUFFICIENT BALANCE</span>
    buttonDisabled = true
    buttonStyle = {
      background: 'rgba(239, 68, 68, 0.2)',
      color: '#EF4444',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      cursor: 'not-allowed'
    }
  } else if (isProgressActive) {
    const isCancellable = progress && [
      SwapStatus.QUOTING,
      SwapStatus.WRAPPING,
      SwapStatus.SWAPPING
    ].includes(progress.status)

    buttonContent = (
      <div className="flex items-center justify-center gap-3">
        {(progress?.status === SwapStatus.QUOTING || progress?.status === SwapStatus.SWAPPING || progress?.status === SwapStatus.CONFIRMING) && 
          <ArrowPathIcon className="h-5 w-5 animate-spin" style={{ color: 'white' }} />
        }
        {(progress?.status === SwapStatus.WRAPPING || progress?.status === SwapStatus.UNWRAPPING) && 
          <LockClosedIcon className="h-5 w-5 animate-pulse" style={{ color: 'white' }} />
        }
        <span>{progress?.message || 'PROCESSING'}</span>
      </div>
    )
    buttonDisabled = !isCancellable
    buttonStyle = {
      background: 'var(--wave-purple)',
      color: 'white',
      border: '1px solid rgba(162, 89, 250, 0.4)',
      cursor: isCancellable ? 'pointer' : 'wait'
    }
  } else if (loading) {
    buttonContent = (
      <div className="flex items-center justify-center gap-3">
        <ArrowPathIcon className="h-5 w-5 animate-spin" style={{ color: 'white' }} />
        <span>FETCHING QUOTE</span>
      </div>
    )
    buttonDisabled = true
    buttonStyle = {
      background: 'var(--wave-purple)',
      color: 'white',
      border: '1px solid rgba(162, 89, 250, 0.4)',
      cursor: 'wait'
    }
  } else if (!hasQuote) {
    buttonContent = <span>NO ROUTE FOUND</span>
    buttonDisabled = true
    buttonStyle = {
      background: 'rgba(245, 158, 11, 0.2)',
      color: '#F59E0B',
      border: '1px solid rgba(245, 158, 11, 0.4)',
      cursor: 'not-allowed'
    }
  } else {
    buttonContent = (
      <div className="flex items-center justify-center gap-3">
        {privacyMode && <LockClosedIcon className="h-5 w-5" style={{ color: 'white' }} />}
        <span>{privacyMode ? 'SWAP CONFIDENTIALLY' : 'EXECUTE SWAP'}</span>
      </div>
    )
    buttonDisabled = !canSwap
    buttonStyle = {
      background: 'var(--wave-purple)',
      color: 'white',
      border: '1px solid rgba(162, 89, 250, 0.4)'
    }
  }

  return (
    <button
      className={baseClass}
      style={buttonStyle}
      disabled={buttonDisabled}
      onClick={() => {
        if (connected && canSwap && !loading && hasQuote && !isProgressActive) {
          onSwap()
        }
      }}
      onMouseEnter={(e) => {
        if (!buttonDisabled && hasQuote) {
          e.currentTarget.style.boxShadow = '0 0 30px rgba(162, 89, 250, 0.6)';
        }
      }}
      onMouseLeave={(e) => {
        if (!buttonDisabled && hasQuote) {
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {buttonContent}
    </button>
  )
}