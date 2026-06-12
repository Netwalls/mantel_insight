const MANTLE_CHAIN_ID = '0x138B' // 5003 in hex — Mantle Sepolia testnet

export interface WalletState {
  address: string | null
  chainId: string | null
  isConnected: boolean
  isMantle: boolean
}

export async function connectWallet(): Promise<WalletState> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet detected. Please install MetaMask.')
  }

  const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' })
  const chainId: string = await window.ethereum.request({ method: 'eth_chainId' })

  return {
    address: accounts[0] ?? null,
    chainId,
    isConnected: accounts.length > 0,
    isMantle: chainId === MANTLE_CHAIN_ID,
  }
}

export async function switchToMantle(): Promise<void> {
  if (!window.ethereum) throw new Error('No wallet')
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MANTLE_CHAIN_ID }],
    })
  } catch (err: any) {
    // Chain not added — add it
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: MANTLE_CHAIN_ID,
          chainName: 'Mantle Sepolia Testnet',
          nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
          rpcUrls: ['https://rpc.sepolia.mantle.xyz'],
          blockExplorerUrls: ['https://explorer.sepolia.mantle.xyz'],
        }],
      })
    } else {
      throw err
    }
  }
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Extend window type
declare global {
  interface Window {
    ethereum?: any
  }
}
