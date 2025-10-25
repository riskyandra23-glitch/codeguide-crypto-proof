import { NextRequest, NextResponse } from 'next/server';

interface ProofData {
  id: string;
  token: string;
  userId: string;
  walletAddress: string;
  balances: {
    address: string;
    chains: Array<{
      chain: string;
      nativeBalance: string;
      nativeUsdValue?: number;
      tokens: Array<{
        symbol: string;
        balance: string;
        decimals: number;
        usdValue?: number;
        address: string;
        name: string;
        chain: string;
      }>;
      totalUsdValue: number;
    }>;
    totalUsdValue: number;
    lastUpdated: string;
  };
  userName: string;
  createdAt: string;
  expiresAt: string;
}

// Mock database - in a real implementation, this would be stored in Supabase/PostgreSQL
const mockProofDatabase = new Map<string, ProofData>();

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Validate token format
    if (!token || typeof token !== 'string' || token.length !== 36) {
      return NextResponse.json(
        {
          error: 'Invalid verification token',
          message: 'The provided token is not a valid verification token'
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would fetch this from your database
    const proofData = mockProofDatabase.get(token);

    if (!proofData) {
      return NextResponse.json(
        {
          error: 'Proof not found',
          message: 'The verification token is invalid or the proof has been removed'
        },
        { status: 404 }
      );
    }

    // Check if proof has expired
    const expirationDate = new Date(proofData.expiresAt);
    const currentDate = new Date();

    if (currentDate > expirationDate) {
      return NextResponse.json(
        {
          error: 'Proof expired',
          message: `This proof of funds expired on ${expirationDate.toLocaleDateString()}`,
          expiredAt: proofData.expiresAt
        },
        { status: 410 }
      );
    }

    // Return the proof data for verification
    return NextResponse.json({
      success: true,
      data: {
        proofId: proofData.id,
        verificationToken: proofData.token,
        holder: {
          name: proofData.userName,
          walletAddress: proofData.walletAddress,
        },
        portfolio: {
          totalUsdValue: proofData.balances.totalUsdValue,
          totalChains: proofData.balances.chains.length,
          chains: proofData.balances.chains.map(chain => ({
            name: chain.chain,
            totalUsdValue: chain.totalUsdValue,
            nativeToken: {
              symbol: chain.chain === 'ethereum' ? 'ETH' :
                     chain.chain === 'bsc' ? 'BNB' : 'MATIC',
              balance: chain.nativeBalance,
              usdValue: chain.nativeUsdValue || 0
            },
            tokens: chain.tokens.map(token => ({
              symbol: token.symbol,
              name: token.name,
              balance: token.balance,
              usdValue: token.usdValue || 0
            }))
          }))
        },
        document: {
          createdAt: proofData.createdAt,
          expiresAt: proofData.expiresAt,
          isValid: true,
          generatedBy: 'Crypto Proof of Funds'
        },
        verification: {
          verifiedAt: new Date().toISOString(),
          ipAddress: request.ip || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      }
    });

  } catch (error) {
    console.error('Error verifying proof:', error);
    return NextResponse.json(
      {
        error: 'Verification failed',
        message: 'An unexpected error occurred while verifying the proof'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // For demonstration purposes, we'll add some mock data to the "database"
    // In a real implementation, this would be handled by the PDF generation endpoint

    if (token === 'demo-token-12345678-1234-1234-1234-123456789012') {
      const demoProof: ProofData = {
        id: 'demo-proof-123',
        token: token,
        userId: 'demo-user',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        userName: 'John Doe',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        balances: {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          chains: [
            {
              chain: 'ethereum',
              nativeBalance: '1.2345',
              nativeUsdValue: 2468.90,
              tokens: [
                {
                  symbol: 'USDC',
                  name: 'USD Coin',
                  balance: '1000.00',
                  decimals: 6,
                  usdValue: 1000.00,
                  address: '0xA0b86a33E6441b8e8C7C7b0b8e8e8e8e8e8e8e8e',
                  chain: 'ethereum'
                },
                {
                  symbol: 'USDT',
                  name: 'Tether USD',
                  balance: '500.00',
                  decimals: 6,
                  usdValue: 500.00,
                  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                  chain: 'ethereum'
                }
              ],
              totalUsdValue: 3968.90
            },
            {
              chain: 'bsc',
              nativeBalance: '2.5678',
              nativeUsdValue: 770.34,
              tokens: [
                {
                  symbol: 'USDC',
                  name: 'USD Coin',
                  balance: '2000.00',
                  decimals: 6,
                  usdValue: 2000.00,
                  address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
                  chain: 'bsc'
                }
              ],
              totalUsdValue: 2770.34
            }
          ],
          totalUsdValue: 6739.24,
          lastUpdated: new Date().toISOString()
        }
      };

      mockProofDatabase.set(token, demoProof);
    }

    return NextResponse.json({
      success: true,
      message: 'Demo proof data has been loaded for testing purposes'
    });

  } catch (error) {
    console.error('Error setting up demo proof:', error);
    return NextResponse.json(
      {
        error: 'Setup failed',
        message: 'Failed to set up demo proof data'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  // Handle CORS preflight requests
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}