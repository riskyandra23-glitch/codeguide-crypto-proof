'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, Download, ArrowRight, Loader2 } from 'lucide-react'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [proofGenerated, setProofGenerated] = useState(false)
  const [proofData, setProofData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found')
      setLoading(false)
      return
    }

    // You could verify the session here and then call the proof generation
    // For now, we'll just show a success message
    const verifySession = async () => {
      try {
        // In a real implementation, you'd verify the session with Stripe
        // and then call the proof generation endpoint

        // Simulate proof generation
        setTimeout(() => {
          setProofGenerated(true)
          setLoading(false)
        }, 2000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify payment')
        setLoading(false)
      }
    }

    verifySession()
  }, [sessionId])

  const generateProof = async () => {
    try {
      // Call the proof generation API
      const response = await fetch('/api/generate-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate proof')
      }

      const data = await response.json()
      setProofData(data)
      window.location.href = data.pdfUrl // Redirect to download PDF
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate proof')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Processing Your Payment
            </h1>
            <p className="text-xl text-gray-600">
              Please wait while we verify your payment...
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
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <Alert className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Payment Error
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              There was an issue processing your payment.
            </p>
            <Alert className="max-w-md mx-auto border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
            <div className="mt-8 space-x-4">
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600">
            Thank you for your purchase. Your proof of funds document is ready to generate.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              What's Next?
            </CardTitle>
            <CardDescription>
              Your payment has been processed successfully. You can now generate your proof of funds document.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Generate Your Proof</h3>
                  <p className="text-sm text-blue-700">Click the button below to generate your professional proof of funds PDF document.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Download Document</h3>
                  <p className="text-sm text-blue-700">Your PDF will include a QR code for easy verification and all your wallet balance information.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Share & Verify</h3>
                  <p className="text-sm text-blue-700">Anyone can scan the QR code to verify your proof of funds instantly.</p>
                </div>
              </div>
            </div>

            {proofData ? (
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-700 font-medium">Proof Generated Successfully!</span>
                </div>
                <Button
                  onClick={() => window.location.href = proofData.pdfUrl}
                  className="w-full"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Your Proof PDF
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Button
                  onClick={generateProof}
                  className="w-full"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate My Proof PDF
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-sm text-gray-600">
                  One-time generation with 30-day validity
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center space-x-4">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}