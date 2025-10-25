'use client'

import { useState, useEffect } from 'react'
import { useAccount, useDisconnect, useConnect, useChainId } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AggregatedBalance, ChainBalance, TokenBalance } from '@/types/wallet'
import { formatAddress, formatCurrency, formatTokenBalance } from '@/lib/eth'
import { Button } from '@/components/ui/button'
import PaymentButton from '@/components/PaymentButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Wallet,
  Copy,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  DollarSign,
  TrendingUp
} from 'lucide-react'

// Create a separate query client for the dashboard
const dashboardQueryClient = new QueryClient()

function WalletDashboard() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { connect, connectors } = useConnect()

  const getChainName = (id: number) => {
    const chains: { [key: number]: string } = {
      1: 'Ethereum',
      56: 'BSC',
      137: 'Polygon',
      42161: 'Arbitrum',
    }
    return chains[id] || 'Unknown Network'
  }
  const [balances, setBalances] = useState<AggregatedBalance | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch balances when wallet is connected
  const fetchBalances = async () => {
    if (!address) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/balances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch balances')
      }

      const data = await response.json()
      setBalances(data.data)
    } catch (err) {
      console.error('Error fetching balances:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Copy address to clipboard
  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      // You could add a toast notification here
    }
  }

  // View on blockchain explorer
  const viewOnExplorer = () => {
    if (address && chainId) {
      const explorers: { [key: number]: string } = {
        1: 'https://etherscan.io',
        56: 'https://bscscan.com',
        137: 'https://polygonscan.com',
        42161: 'https://arbiscan.io',
      }
      const explorer = explorers[chainId] || 'https://etherscan.io'
      window.open(`${explorer}/address/${address}`, '_blank')
    }
  }

  // Auto-fetch balances when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      fetchBalances()
    }
  }, [isConnected, address])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Crypto Proof of Funds
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Connect your wallet to view aggregated balances across multiple chains
            </p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Wallet className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>
                Connect your crypto wallet to view your aggregated balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {connectors.map((connector) => (
                  <Button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    className="w-full"
                    size="lg"
                    disabled={!connector.ready}
                  >
                    {connector.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Crypto Proof of Funds
              </h1>
              <p className="text-xl text-gray-600">
                Wallet Dashboard
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={viewOnExplorer}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Explorer
              </Button>
              <Button variant="outline" onClick={copyAddress}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button onClick={fetchBalances} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => disconnect()}>
                Disconnect
              </Button>
            </div>
          </div>

          {/* Wallet Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Connected</span>
                </div>
                <Badge variant="secondary">
                  {getChainName(chainId)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm bg-gray-50 p-3 rounded">
                {formatAddress(address!, 8)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && !balances && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Section */}
        <PaymentButton />

        {/* Balance Display */}
        {balances && (
          <div className="space-y-6">
            {/* Total Balance */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Total Portfolio Value</CardTitle>
                  <DollarSign className="h-8 w-8 text-blue-200" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">
                  {formatCurrency(balances.totalUsdValue)}
                </div>
                <p className="text-blue-100">
                  Across {balances.chains.length} blockchain networks
                </p>
              </CardContent>
            </Card>

            {/* Chain Breakdown */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="ethereum">Ethereum</TabsTrigger>
                <TabsTrigger value="bsc">BSC</TabsTrigger>
                <TabsTrigger value="polygon">Polygon</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {balances.chains.map((chainBalance) => (
                  <ChainBalanceCard
                    key={chainBalance.chain}
                    chainBalance={chainBalance}
                  />
                ))}
              </TabsContent>

              {balances.chains.map((chainBalance) => (
                <TabsContent key={chainBalance.chain} value={chainBalance.chain.toLowerCase()}>
                  <ChainDetailCard chainBalance={chainBalance} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

// Chain Balance Card Component
function ChainBalanceCard({ chainBalance }: { chainBalance: ChainBalance }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="capitalize">{chainBalance.chain}</CardTitle>
          <div className="text-right">
            <div className="text-lg font-semibold">
              {formatCurrency(chainBalance.totalUsdValue)}
            </div>
            <div className="text-sm text-gray-600">
              {formatTokenBalance(chainBalance.nativeBalance)} {chainBalance.nativeBalance}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            {chainBalance.tokens.length} token{chainBalance.tokens.length !== 1 ? 's' : ''}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Chain Detail Card Component
function ChainDetailCard({ chainBalance }: { chainBalance: ChainBalance }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="capitalize flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {chainBalance.chain} - {formatCurrency(chainBalance.totalUsdValue)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Native Token</h4>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {chainBalance.chain === 'ethereum' ? 'ETH' :
                     chainBalance.chain === 'bsc' ? 'BNB' : 'MATIC'}
                  </span>
                  <div className="text-right">
                    <div className="font-mono">
                      {formatTokenBalance(chainBalance.nativeBalance)}
                    </div>
                    {chainBalance.nativeUsdValue && (
                      <div className="text-sm text-gray-600">
                        {formatCurrency(chainBalance.nativeUsdValue)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {chainBalance.tokens.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Tokens</h4>
                <div className="space-y-2">
                  {chainBalance.tokens.map((token) => (
                    <TokenRow key={token.address} token={token} />
                  ))}
                </div>
              </div>
            )}

            {chainBalance.tokens.length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No token balances found on this chain
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Token Row Component
function TokenRow({ token }: { token: TokenBalance }) {
  return (
    <div className="bg-gray-50 p-3 rounded">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">{token.symbol}</div>
          <div className="text-sm text-gray-600">{token.name}</div>
        </div>
        <div className="text-right">
          <div className="font-mono">
            {formatTokenBalance(token.balance)}
          </div>
          {token.usdValue && (
            <div className="text-sm text-gray-600">
              {formatCurrency(token.usdValue)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <QueryClientProvider client={dashboardQueryClient}>
      <WalletDashboard />
    </QueryClientProvider>
  )
}