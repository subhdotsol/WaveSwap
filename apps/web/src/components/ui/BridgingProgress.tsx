'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircleIcon, ClockIcon, SparklesIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { useThemeConfig, createGlassStyles } from '@/lib/theme'

interface BridgingProgressProps {
  isVisible: boolean
  estimatedTime?: string
  currentStep?: number
  totalSteps?: number
  message?: string
  provider?: string
}

interface Step {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'pending' | 'in-progress' | 'completed'
}

export function BridgingProgress({
  isVisible,
  estimatedTime = '2-3 minutes',
  currentStep = 1,
  totalSteps = 4,
  message = 'Initializing bridge...',
  provider = 'Near Intents'
}: BridgingProgressProps) {
  const theme = useThemeConfig()
  const [progress, setProgress] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)

  const steps: Step[] = [
    {
      id: 'init',
      title: 'Initializing Bridge',
      description: `Setting up ${provider} connection`,
      icon: <SparklesIcon className="w-5 h-5" />,
      status: currentStep >= 1 ? 'completed' : currentStep === 1 ? 'in-progress' : 'pending'
    },
    {
      id: 'validate',
      title: 'Validating Transaction',
      description: 'Checking balances and permissions',
      icon: <ArrowsRightLeftIcon className="w-5 h-5" />,
      status: currentStep >= 2 ? 'completed' : currentStep === 2 ? 'in-progress' : 'pending'
    },
    {
      id: 'process',
      title: 'Processing Bridge',
      description: `Executing cross-chain transfer (${estimatedTime})`,
      icon: <ClockIcon className="w-5 h-5" />,
      status: currentStep >= 3 ? 'completed' : currentStep === 3 ? 'in-progress' : 'pending'
    },
    {
      id: 'complete',
      title: 'Finalizing Transfer',
      description: 'Confirming receipt on destination chain',
      icon: <CheckCircleIcon className="w-5 h-5" />,
      status: currentStep >= 4 ? 'completed' : currentStep === 4 ? 'in-progress' : 'pending'
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const targetProgress = (currentStep / totalSteps) * 100
    const increment = (targetProgress - progress) / 10 // Smooth animation

    const animation = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment
        if (next >= targetProgress) {
          clearInterval(animation)
          return targetProgress
        }
        return next
      })
    }, 50)

    return () => clearInterval(animation)
  }, [currentStep, totalSteps, progress])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isVisible) return null

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
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center animate-spin"
            style={{
              background: `conic-gradient(from 0deg, ${theme.colors.primary} 0deg, transparent 360deg)`,
              animationDuration: '2s'
            }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: theme.colors.surface,
                color: theme.colors.primary
              }}
            >
              <ArrowsRightLeftIcon className="w-8 h-8" />
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: theme.colors.textPrimary }}>
            Bridging in Progress
          </h3>
          <p className="text-sm" style={{ color: theme.colors.textSecondary }}>
            {message}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs" style={{ color: theme.colors.textMuted }}>
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{formatTime(timeElapsed)}</span>
          </div>
          <div className="w-full rounded-full h-3 overflow-hidden" style={{
            background: `${theme.colors.surface}60`,
            border: `1px solid ${theme.colors.border}`
          }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.primary}cc 100%)`,
                boxShadow: `0 0 10px ${theme.colors.primary}50`
              }}
            />
          </div>
          <div className="text-center text-xs" style={{ color: theme.colors.textMuted }}>
            Estimated time: {estimatedTime}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              className="flex items-center gap-3 p-3 rounded-lg transition-all"
              style={{
                background: step.status === 'completed' ? `${theme.colors.success}08` :
                           step.status === 'in-progress' ? `${theme.colors.primary}08` :
                           `${theme.colors.surface}40`,
                border: `1px solid ${
                  step.status === 'completed' ? theme.colors.success + '30' :
                  step.status === 'in-progress' ? theme.colors.primary + '30' :
                  theme.colors.border
                }`
              }}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'text-green-500' :
                  step.status === 'in-progress' ? 'animate-pulse' : 'text-gray-400'
                }`}
                style={{
                  color: step.status === 'completed' ? theme.colors.success :
                         step.status === 'in-progress' ? theme.colors.primary :
                         theme.colors.textMuted,
                  background: step.status === 'in-progress' ? `${theme.colors.primary}15` : 'transparent'
                }}
              >
                {step.icon}
              </div>
              <div className="flex-1">
                <div
                  className="font-medium text-sm"
                  style={{
                    color: step.status === 'completed' ? theme.colors.success :
                           step.status === 'in-progress' ? theme.colors.primary :
                           theme.colors.textPrimary
                  }}
                >
                  {step.title}
                </div>
                <div className="text-xs" style={{ color: theme.colors.textMuted }}>
                  {step.description}
                </div>
              </div>
              {step.status === 'completed' && (
                <CheckCircleIcon
                  className="w-5 h-5"
                  style={{ color: theme.colors.success }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Provider Info */}
        <div className="text-center p-3 rounded-lg" style={{
          background: `${theme.colors.primary}08`,
          border: `1px solid ${theme.colors.primary}20`
        }}>
          <div className="text-xs" style={{ color: theme.colors.textMuted }}>
            Bridge Provider
          </div>
          <div className="text-sm font-medium" style={{ color: theme.colors.primary }}>
            {provider}
          </div>
        </div>
      </div>
    </div>
  )
}