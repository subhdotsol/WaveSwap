'use client'

import React, { useState, useEffect } from 'react'
import { XMarkIcon, QrCodeIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useThemeConfig, createGlassStyles } from '@/lib/theme'
import QRCode from 'qrcode'

interface ImprovedZcashDepositProps {
  isVisible: boolean
  onClose: () => void
  onDepositComplete: (depositAmount: string) => void
  depositAddress: string
  userAmount?: string
  estimatedTime?: string
}

export function ImprovedZcashDeposit({
  isVisible,
  onClose,
  onDepositComplete,
  depositAddress,
  userAmount,
  estimatedTime = '2-5 minutes'
}: ImprovedZcashDepositProps) {
  const theme = useThemeConfig()
  const [customAmount, setCustomAmount] = useState('')
  const [isDepositConfirmed, setIsDepositConfirmed] = useState(false)
  const [showQR, setShowQR] = useState(true) // Show QR by default
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  // Generate QR code when component mounts or deposit address changes
  useEffect(() => {
    const generateQRCode = async () => {
      if (depositAddress) {
        try {
          const qrDataUrl = await QRCode.toDataURL(depositAddress, {
            width: 192,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          })
          setQrCodeDataUrl(qrDataUrl)
        } catch (error) {
          console.error('Error generating QR code:', error)
        }
      }
    }

    if (isVisible) {
      generateQRCode()
    }
  }, [depositAddress, isVisible])

  if (!isVisible) return null

  const handleDeposit = (amount: string) => {
    setIsDepositConfirmed(true)
    // Simulate deposit confirmation delay
    setTimeout(() => {
      onDepositComplete(amount)
      onClose()
    }, 2000)
  }

  const handleCustomDeposit = () => {
    if (!customAmount || parseFloat(customAmount) <= 0) return
    handleDeposit(customAmount)
  }

  const predefinedAmounts = ['0.01', '0.025', '0.05', '0.1', '0.25', '0.5']

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="max-w-md w-full rounded-2xl p-6 space-y-6"
        style={{
          ...createGlassStyles(theme),
          background: `
            linear-gradient(135deg,
              ${theme.colors.surface}ee 0%,
              ${theme.colors.surfaceHover}cc 50%,
              ${theme.colors.surface}ee 100%
            ),
            radial-gradient(circle at 30% 30%,
              ${theme.colors.primary}15 0%,
              transparent 60%
            )
          `,
          border: `2px solid ${theme.colors.primary}30`,
          boxShadow: `
            0 25px 50px -12px ${theme.colors.shadowHeavy},
            0 12px 25px -4px ${theme.colors.primary}10
          `
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
              Deposit ZEC to Bridge
            </h3>
            <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
              Deposit Zcash to initiate your bridge to Solana
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all hover:bg-white/10"
            style={{ color: theme.colors.textMuted }}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {!isDepositConfirmed ? (
          <>
            {/* Deposit Instructions */}
            <div className="p-4 rounded-lg space-y-3" style={{
              background: `${theme.colors.primary}08`,
              border: `1px solid ${theme.colors.primary}20`
            }}>
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5" style={{ color: theme.colors.primary }} />
                <span className="text-sm font-medium" style={{ color: theme.colors.primary }}>
                  Secure Bridge Process
                </span>
              </div>
              <div className="text-xs space-y-1" style={{ color: theme.colors.textSecondary }}>
                <p>1. Choose or enter your ZEC deposit amount</p>
                <p>2. Send ZEC to the provided deposit address</p>
                <p>3. Your bridge to Solana will be processed automatically</p>
                <p>4. Estimated completion time: {estimatedTime}</p>
              </div>
            </div>

            {/* User Amount Display */}
            <div className="space-y-4">
              <div className="text-center">
                <label className="text-sm font-medium mb-2" style={{ color: theme.colors.textPrimary }}>
                  Deposit Amount
                </label>
                <div className="text-2xl font-bold mb-2" style={{ color: theme.colors.primary }}>
                  {userAmount || '0.00'} ZEC
                </div>
                <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                  Amount specified in bridge interface
                </p>
              </div>

              {/* Quick Adjust Options */}
              <div className="flex justify-center gap-2">
                {userAmount && (
                  <>
                    <button
                      onClick={() => handleDeposit(userAmount)}
                      className="px-6 py-3 rounded-lg font-medium transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primary}dd 100%)`,
                        color: '#FFFFFF',
                        border: `1px solid ${theme.colors.primary}40`
                      }}
                    >
                      Confirm Deposit
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-3 rounded-lg font-medium transition-all"
                      style={{
                        background: 'transparent',
                        color: theme.colors.textPrimary,
                        border: `1px solid ${theme.colors.border}`
                      }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* QR Code Section */}
            {showQR && (
              <div className="p-4 rounded-lg text-center space-y-3" style={{
                background: `${theme.colors.surface}20`,
                border: `1px solid ${theme.colors.border}`
              }}>
                <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center p-2">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="Zcash Deposit QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <QrCodeIcon className="w-24 h-24 mx-auto mb-2 text-gray-800" />
                      <p className="text-xs text-gray-600">Generating QR Code...</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-mono break-all p-2 rounded bg-black/20" style={{ color: theme.colors.textMuted }}>
                    {depositAddress}
                  </p>
                  <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                    Scan or copy this address to deposit ZEC
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Deposit Confirmation State */
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center animate-pulse"
              style={{
                background: `conic-gradient(from 0deg, ${theme.colors.primary} 0deg, ${theme.colors.primary}cc 360deg)`
              }}
            >
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2" style={{ color: theme.colors.textPrimary }}>
                Deposit Received!
              </h4>
              <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                Processing your bridge to Solana...
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: theme.colors.textMuted }}>
              <ClockIcon className="w-4 h-4" />
              <span>Estimated time: {estimatedTime}</span>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="pt-4 border-t" style={{ borderColor: theme.colors.border }}>
          <div className="flex items-center justify-between text-xs" style={{ color: theme.colors.textMuted }}>
            <span>Network: Zcash Mainnet</span>
            <span>Min deposit: 0.001 ZEC</span>
          </div>
        </div>
      </div>
    </div>
  )
}