'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { WalletGuard } from '@/components/layout/WalletGuard'
import { FloatingChat } from '@/components/layout/FloatingChat'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <WalletGuard>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Sticky top navbar */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Collapsible sidebar drawer */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Floating Ask Alpha chat button */}
        <FloatingChat />
      </div>
    </WalletGuard>
  )
}
