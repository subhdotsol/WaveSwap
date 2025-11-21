'use client'

import { ShieldCheckIcon, EyeIcon } from '@heroicons/react/24/outline'

interface PrivacyStatusProps {
  privacyMode: boolean
  className?: string
}

export function PrivacyStatus({ privacyMode, className = '' }: PrivacyStatusProps) {
  if (!privacyMode) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 ${className}`}>
        <EyeIcon className="h-3 w-3 text-blue-400" />
        <span className="text-xs font-medium text-blue-400">PUBLIC SWAP</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 ${className}`}>
      <ShieldCheckIcon className="h-3 w-3 text-emerald-400" />
      <span className="text-xs font-medium text-emerald-400">PRIVATE SWAP</span>
    </div>
  )
}