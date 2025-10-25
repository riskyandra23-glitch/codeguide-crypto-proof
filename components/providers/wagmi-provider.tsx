'use client'

import { WagmiProvider as WagmiProviderCore, createConfig, http } from 'wagmi'
import { mainnet, arbitrum, polygon, bsc } from 'wagmi/chains'
import { injected, metaMask, coinbaseWallet, walletConnect } from 'wagmi/connectors'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ReactNode } from 'react'

const queryClient = new QueryClient()

const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, polygon, bsc],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'default-project-id',
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [bsc.id]: http(),
  },
})

export default function WagmiProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProviderCore config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProviderCore>
  )
}