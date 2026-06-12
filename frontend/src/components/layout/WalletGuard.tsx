'use client'

import { useWallet } from '@/context/WalletContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const { isConnected, isInitializing } = useWallet()
  const router = useRouter()

  useEffect(() => {
    // Only redirect once session-restore check is complete
    if (!isInitializing && !isConnected) {
      router.replace('/')
    }
  }, [isConnected, isInitializing, router])

  // Hold render until we know if the wallet was already connected
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-3 text-text-secondary font-mono">
          <Loader2 size={20} className="animate-spin text-accent-green" />
          Loading...
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex items-center gap-3 text-text-secondary font-mono">
          <Loader2 size={20} className="animate-spin text-accent-green" />
          Redirecting...
        </div>
      </div>
    )
  }

  return <>{children}</>
}
