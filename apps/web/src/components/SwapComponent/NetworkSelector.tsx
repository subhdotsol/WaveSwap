'use client'

import { GlobeAltIcon } from '@heroicons/react/24/outline'

export function NetworkSelector() {
  return (
    <button className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800/70 rounded-xl border border-gray-700/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
      <GlobeAltIcon className="h-4 w-4 text-gray-400" />
      <span className="text-sm font-medium text-white">Devnet</span>
    </button>
  )
}