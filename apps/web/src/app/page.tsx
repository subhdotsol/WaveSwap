'use client'

import { AppTabs } from '@/components/AppTabs'

export default function Home() {
  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'radial-gradient(ellipse at top, rgba(162, 89, 250, 0.08) 0%, transparent 50%), #0A0A0F'
      }}
    >
      <AppTabs />
    </div>
  )
}