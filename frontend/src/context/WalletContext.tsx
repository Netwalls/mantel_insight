'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { connectWallet, switchToMantle, type WalletState } from '@/lib/wallet'
import toast from 'react-hot-toast'

interface WalletContextValue extends WalletState {
  connect: () => Promise<void>
  disconnect: () => void
  switchNetwork: () => Promise<void>
  isLoading: boolean
  isInitializing: boolean
}

const WalletContext = createContext<WalletContextValue | null>(null)

const STORAGE_KEY = 'alphasight_wallet'

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isMantle: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  // True while we check if wallet is already connected (prevents premature guard redirect)
  const [isInitializing, setIsInitializing] = useState(true)

  // Restore session on mount — always run, check if MetaMask already authorized
  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          // eth_accounts is silent (no popup) — returns connected accounts
          const accounts: string[] = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            const chainId: string = await window.ethereum.request({ method: 'eth_chainId' })
            setState({
              address: accounts[0],
              chainId,
              isConnected: true,
              isMantle: chainId === '0x138B',
            })
            localStorage.setItem(STORAGE_KEY, '1')
          } else {
            localStorage.removeItem(STORAGE_KEY)
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      } finally {
        setIsInitializing(false)
      }
    }
    init()
  }, [])

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        setState((prev) => ({ ...prev, address: accounts[0] }))
      }
    }

    const handleChainChanged = (chainId: string) => {
      setState((prev) => ({ ...prev, chainId, isMantle: chainId === '0x138B' }))
      if (chainId !== '0x138B') {
        toast('Switched away from Mantle — some features may not work', { icon: '⚠️' })
      }
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [])

  const connect = useCallback(async () => {
    setIsLoading(true)
    try {
      const walletState = await connectWallet()
      setState(walletState)
      localStorage.setItem(STORAGE_KEY, '1')

      if (!walletState.isMantle) {
        toast('Not on Mantle — switching network...', { icon: '🔄' })
        await switchToMantle()
        const chainId: string = await window.ethereum.request({ method: 'eth_chainId' })
        setState((prev) => ({ ...prev, chainId, isMantle: chainId === '0x138B' }))
      }

      toast.success(`Connected: ${walletState.address?.slice(0, 6)}...${walletState.address?.slice(-4)}`)
    } catch (err: any) {
      toast.error(err.message || 'Connection failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setState({ address: null, chainId: null, isConnected: false, isMantle: false })
    localStorage.removeItem(STORAGE_KEY)
    toast('Wallet disconnected')
  }, [])

  const switchNetwork = useCallback(async () => {
    try {
      await switchToMantle()
    } catch (err: any) {
      toast.error(err.message)
    }
  }, [])

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, switchNetwork, isLoading, isInitializing }}>
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
