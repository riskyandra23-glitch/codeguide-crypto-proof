import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAggregatedBalances } from '@/lib/eth';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

interface ProofRequest {
  sessionId?: string;
  address?: string;
  userName?: string;
}

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
    const { sessionId, address, userName }: ProofRequest = body;

    // Validate input - either sessionId or address is required
    if (!sessionId && !address) {
      return NextResponse.json(
        { error: 'Session ID or wallet address is required' },
        { status: 400 }
      );
    }

    // Generate unique token for verification
    const verificationToken = uuidv4();
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    let walletAddress = address;
    let balances;

    // Get wallet address from session if not provided
    if (!walletAddress) {
      // In a real implementation, you would fetch this from your database
      // using the sessionId from the Stripe checkout
      walletAddress = '0x0000000000000000000000000000000000000000'; // Placeholder
    }

    // Fetch aggregated balances
    try {
      balances = await getAggregatedBalances(walletAddress);
    } catch (error) {
      console.error('Error fetching balances:', error);
      return NextResponse.json(
        { error: 'Failed to fetch wallet balances' },
        { status: 500 }
      );
    }

    // Create verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify/${verificationToken}`;

    // Generate QR code for verification
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Store proof request in database (in a real implementation)
    const proofData = {
      id: uuidv4(),
      token: verificationToken,
      userId,
      walletAddress,
      balances,
      userName: userName || 'Anonymous',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    };

    // TODO: Store in Supabase or your database
    console.log('📄 Proof request created:', proofData);

    // Generate PDF (in a real implementation, you'd use a proper PDF library)
    const pdfData = await generateProofPDF(proofData, qrCodeDataUrl);

    // Return PDF data as base64 for client-side download
    return NextResponse.json({
      success: true,
      proofId: proofData.id,
      verificationToken,
      verificationUrl,
      pdfData: pdfData, // base64 encoded PDF
      fileName: `proof-of-funds-${currentDate}.pdf`,
    });

  } catch (error) {
    console.error('Error generating proof:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate proof',
        message: process.env.NODE_ENV === 'development'
          ? (error as Error).message
          : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

// Generate PDF with proof data
async function generateProofPDF(proofData: any, qrCodeDataUrl: string): Promise<string> {
  // In a real implementation, you would use a proper PDF library like PDFKit or jsPDF
  // For this example, we'll create a simple HTML structure that can be converted to PDF

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Proof of Funds - ${proofData.userName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1e40af;
          margin: 0;
          font-size: 32px;
        }
        .header p {
          color: #6b7280;
          margin: 10px 0 0 0;
        }
        .proof-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        .info-section {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
        }
        .info-section h3 {
          color: #374151;
          margin: 0 0 15px 0;
          font-size: 18px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .info-item:last-child {
          border-bottom: none;
        }
        .info-label {
          color: #6b7280;
          font-weight: 500;
        }
        .info-value {
          color: #111827;
          font-weight: 600;
        }
        .qr-section {
          text-align: center;
          margin: 30px 0;
        }
        .qr-section img {
          max-width: 200px;
          border: 2px solid #e5e7eb;
            padding: 10px;
          border-radius: 8px;
        }
        .qr-section p {
          color: #6b7280;
          margin-top: 10px;
          font-size: 14px;
        }
        .balances-section {
          margin-top: 30px;
        }
        .balances-section h3 {
          color: #374151;
          margin-bottom: 20px;
          font-size: 20px;
        }
        .chain-balance {
          background: #fefefe;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .chain-header {
          background: #2563eb;
          color: white;
          padding: 15px 20px;
          font-weight: 600;
          font-size: 16px;
        }
        .chain-content {
          padding: 20px;
        }
        .balance-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .balance-item:last-child {
          border-bottom: none;
        }
        .total-row {
          background: #f0f9ff;
          padding: 15px;
          border-radius: 6px;
          margin-top: 15px;
          font-weight: 600;
          display: flex;
          justify-content: space-between;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        .verification-url {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          padding: 12px;
          margin: 15px 0;
          font-family: monospace;
          font-size: 12px;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Proof of Funds</h1>
          <p>Official cryptocurrency balance verification document</p>
        </div>

        <div class="proof-info">
          <div class="info-section">
            <h3>Holder Information</h3>
            <div class="info-item">
              <span class="info-label">Name:</span>
              <span class="info-value">${proofData.userName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Wallet Address:</span>
              <span class="info-value" style="font-family: monospace; font-size: 12px;">${proofData.walletAddress}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Verification ID:</span>
              <span class="info-value">${proofData.token}</span>
            </div>
          </div>

          <div class="info-section">
            <h3>Document Details</h3>
            <div class="info-item">
              <span class="info-label">Generated On:</span>
              <span class="info-value">${new Date(proofData.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Valid Until:</span>
              <span class="info-value">${new Date(proofData.expiresAt).toLocaleDateString()}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Chains:</span>
              <span class="info-value">${proofData.balances.chains.length}</span>
            </div>
          </div>
        </div>

        <div class="qr-section">
          <img src="${qrCodeDataUrl}" alt="Verification QR Code" />
          <p>Scan this QR code to verify this proof of funds document</p>
          <div class="verification-url">
            Verification URL: ${process.env.NEXT_PUBLIC_APP_URL}/verify/${proofData.token}
          </div>
        </div>

        <div class="balances-section">
          <h3>Portfolio Breakdown</h3>

          ${proofData.balances.chains.map((chain: any) => `
            <div class="chain-balance">
              <div class="chain-header">${chain.chain.toUpperCase()} - $${chain.totalUsdValue.toFixed(2)}</div>
              <div class="chain-content">
                <div class="balance-item">
                  <span>Native Token (${chain.chain === 'ethereum' ? 'ETH' : chain.chain === 'bsc' ? 'BNB' : 'MATIC'})</span>
                  <span>${parseFloat(chain.nativeBalance).toFixed(4)} ($${(chain.nativeUsdValue || 0).toFixed(2)})</span>
                </div>
                ${chain.tokens.map((token: any) => `
                  <div class="balance-item">
                    <span>${token.symbol}</span>
                    <span>${parseFloat(token.balance).toFixed(4)} ($${(token.usdValue || 0).toFixed(2)})</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}

          <div class="total-row">
            <span>Total Portfolio Value:</span>
            <span>$${proofData.balances.totalUsdValue.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>This document was generated by Crypto Proof of Funds on ${new Date().toLocaleString()}</p>
          <p>All balance data was accurate at the time of generation. Verify authenticity using the QR code above.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // In a real implementation, you would convert this HTML to PDF
  // For now, we'll return the HTML as a base64 string for simplicity
  const base64Data = Buffer.from(htmlContent).toString('base64');
  return `data:text/html;base64,${base64Data}`;
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed. Use POST to generate proof documents.',
      usage: {
        method: 'POST',
        body: {
          sessionId: 'cs_xxx (optional)',
          address: '0x... (wallet address, optional)',
          userName: 'John Doe (optional)'
        }
      }
    },
    { status: 405 }
  );
}