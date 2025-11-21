'use client'

import {
  ShieldCheckIcon,
  LockClosedIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    icon: ShieldCheckIcon,
    title: 'MEV Protection',
    description: 'Your swap amounts are encrypted, protecting against front-running and sandwich attacks.',
    gradient: 'from-primary-500 to-primary-600'
  },
  {
    icon: LockClosedIcon,
    title: 'Confidential Tokens',
    description: 'Uses Arcium C-SPL technology to encrypt token amounts while maintaining full compatibility.',
    gradient: 'from-privacy-500 to-privacy-600'
  },
  {
    icon: EyeIcon,
    title: 'Privacy by Default',
    description: 'No complex setup - privacy is automatically enabled for all swaps by default.',
    gradient: 'from-secondary-600 to-secondary-700'
  },
  {
    icon: SparklesIcon,
    title: 'Fast Execution',
    description: 'Leverage MagicBlock ephemeral rollups for sub-second private swap execution.',
    gradient: 'from-warning-500 to-warning-600'
  }
]

export function PrivacyFeatures() {
  return (
    <div id="features" className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {features.map((feature, index) => (
        <div
          key={index}
          className="card-hover p-6 group"
        >
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.gradient} group-hover:scale-110 transition-transform duration-200`}>
              <feature.icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-secondary-300 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}