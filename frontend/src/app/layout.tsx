import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import { QueryProvider } from '@/components/layout/QueryProvider'
import { WalletProvider } from '@/context/WalletContext'

export const metadata: Metadata = {
  title: 'AlphaSight AI — On-Chain Intelligence for Mantle',
  description: 'The first autonomous on-chain threat intelligence system for the Mantle ecosystem.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary min-h-screen">
        <QueryProvider>
          <WalletProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1a1d24',
                  color: '#e8eaf0',
                  border: '1px solid #2a2e3a',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px',
                },
              }}
            />
          </WalletProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
