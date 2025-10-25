import { NextRequest, NextResponse } from 'next/server';
import { getAggregatedBalances, isValidAddress } from '@/lib/eth';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    // Ensure the user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { address } = body;

    // Validate input
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    if (!isValidAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Get aggregated balances
    const balances = await getAggregatedBalances(address);

    // Return success response
    return NextResponse.json({
      success: true,
      data: balances
    });

  } catch (error) {
    console.error('Error fetching balances:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('Invalid Ethereum address format')) {
        return NextResponse.json(
          { error: 'Invalid address format' },
          { status: 400 }
        );
      }

      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        error: 'Failed to fetch balances',
        message: process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed. Use POST to fetch balances.',
      usage: {
        method: 'POST',
        body: {
          address: '0x... (Ethereum address)'
        }
      }
    },
    { status: 405 }
  );
}