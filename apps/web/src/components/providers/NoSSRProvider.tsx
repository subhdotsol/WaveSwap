'use client'

import { useEffect, useState } from 'react'

interface NoSSRProviderProps {
  children: React.ReactNode
}

export function NoSSRProvider({ children }: NoSSRProviderProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Return children only on client-side
  return isClient ? <>{children}</> : null
}