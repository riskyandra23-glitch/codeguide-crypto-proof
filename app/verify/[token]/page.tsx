'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Shield,
  Clock,
  User,
  Globe
} from 'lucide-react'

interface ProofData {
  proofId: string
  verificationToken: string
  holder: {
    name: string
    walletAddress: string
  }
  portfolio: {
    totalUsdValue: number
    totalChains: number
    chains: Array<{
      name: string
      totalUsdValue: number
      nativeToken: {
        symbol: string
        balance: string
        usdValue: number
      }
      tokens: Array<{
        symbol: string
        name: string
        balance: string
        usdValue: number
      }>
    }>
  }
  document: {
    createdAt: string
    expiresAt: string
    isValid: boolean
    generatedBy: string
  }
  verification: {
    verifiedAt: string
    ipAddress: string
    userAgent: string
  }
}

export default function VerificationPage() {
  const params = useParams()
  const token = params.token as string

  const [loading, setLoading] = useState(true)
  const [proofData, setProofData] = useState<ProofData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProofData = async () => {
      try {
        const response = await fetch(`/api/verify/${token}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify proof')
        }

        setProofData(data.data)
      } catch (err) {
        console.error('Error fetching proof data:', err)
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchProofData()
    }
  }, [token])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const openExplorer = (address: string) => {
    const explorers = ['https://etherscan.io', 'https://bscscan.com', 'https://polygonscan.com']
    window.open(`${explorers[0]}/address/${address}`, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Shield className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Verifying Proof of Funds
            </h1>
            <p className="text-xl text-gray-600">
              Please wait while we verify the document...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Verification Failed
            </h1>
            <Alert className="max-w-md mx-auto border-red-200 bg-red-50 mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
            >
              Return Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!proofData) {
    return null
  }

  const isExpired = new Date() > new Date(proofData.document.expiresAt)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Proof of Funds Verified
          </h1>
          <p className="text-xl text-gray-600">
            This document has been successfully verified and is {isExpired ? 'expired' : 'valid'}
          </p>
        </div>

        {/* Status Badge */}
        <div className="text-center mb-8">
          <Badge variant={isExpired ? 'destructive' : 'default'} className="text-lg px-4 py-2">
            {isExpired ? (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Document Expired
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Valid Document
              </>
            )}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Document Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Proof ID:</span>
                <span className="font-mono text-xs">{proofData.proofId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Generated By:</span>
                <span>{proofData.document.generatedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span>{new Date(proofData.document.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expires:</span>
                <span className={isExpired ? 'text-red-600 font-semibold' : ''}>
                  {new Date(proofData.document.expiresAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Verified:</span>
                <span>{new Date(proofData.verification.verifiedAt).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Holder Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Holder Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-semibold">{proofData.holder.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Wallet Address:</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                    {proofData.holder.walletAddress}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(proofData.holder.walletAddress)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openExplorer(proofData.holder.walletAddress)}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Portfolio Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-gray-600">Total Value:</span>
                <p className="text-2xl font-bold text-green-600">
                  ${proofData.portfolio.totalUsdValue.toFixed(2)}
                </p>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Blockchains:</span>
                <span>{proofData.portfolio.totalChains}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge variant={isExpired ? 'destructive' : 'default'}>
                  {isExpired ? 'Expired' : 'Active'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chain Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Blockchain Breakdown
            </CardTitle>
            <CardDescription>
              Detailed balance information across all supported blockchains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {proofData.portfolio.chains.map((chain, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold capitalize">{chain.name}</h3>
                    <div className="text-lg font-bold">
                      ${chain.totalUsdValue.toFixed(2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Native Token */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{chain.nativeToken.symbol}</span>
                          <div className="text-right">
                            <div className="font-mono text-sm">
                              {parseFloat(chain.nativeToken.balance).toFixed(4)}
                            </div>
                            <div className="text-xs text-gray-600">
                              ${chain.nativeToken.usdValue.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Tokens */}
                    {chain.tokens.map((token, tokenIndex) => (
                      <Card key={tokenIndex} className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{token.symbol}</span>
                              <p className="text-xs text-gray-600">{token.name}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-sm">
                                {parseFloat(token.balance).toFixed(4)}
                              </div>
                              <div className="text-xs text-gray-600">
                                ${token.usdValue.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {index < proofData.portfolio.chains.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verification Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Verification Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Verification Token:</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                    {proofData.verificationToken}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(proofData.verificationToken)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <span className="text-gray-600">IP Address:</span>
                <p className="font-mono text-sm">{proofData.verification.ipAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            This verification page confirms the authenticity of the proof of funds document.
            The data was accurate at the time of generation ({new Date(proofData.document.createdAt).toLocaleDateString()}).
          </p>
        </div>
      </div>
    </div>
  )
}