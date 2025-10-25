# Project Requirements Document (PRD)

## 1. Project Overview

**codeguide-crypto-proof** is a FinTech SaaS application built on a Next.js starter template. It lets authenticated users connect their crypto wallets, fetch balances across multiple chains (Ethereum, BSC, Polygon), and generate a PDF “proof of funds” document. Users pay a one-time fee via Stripe before downloading a branded, verifiable PDF. Each document includes a unique token and QR code linking to a public verification page.

This service solves the problem of proving on-chain asset holdings to third parties (e.g., for loan applications or audits) without exposing private keys. Our key objectives are: 1) seamless wallet connection and real-time balance aggregation, 2) secure payment gating with Stripe, and 3) automated, accurate PDF generation with verifiable links. Success is measured by low friction in onboarding, quick balance fetch times, and reliable PDF delivery.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Version 1)
- User sign-up, sign-in, and profile management (using Clerk).
- Wallet connection UI (via Web3Modal) and multi-chain balance aggregation.
- Stripe Checkout integration for one-time payments.
- Protected API route for generating proof-of-funds PDFs (using PDFKit).
- Unique token and QR code creation for each proof request.
- Public verification endpoint to display proof data by token.
- PostgreSQL data storage in Supabase (user profiles, proof_requests table).
- Basic error handling and UI notifications.

### Out-of-Scope (Planned for Later)
- Multi-tier subscriptions or recurring payments.
- Know Your Customer (KYC) or identity verification flows.
- Support for additional blockchains beyond Ethereum, BSC, Polygon.
- Background job queues or serverless functions for heavy PDF tasks.
- Custom branding or white-label dashboards.
- Mobile app or native integrations.

## 3. User Flow

A new user lands on the homepage and clicks “Get Started.” They sign up or log in with Clerk (email/password or OAuth). Once authenticated, they arrive at the Wallet Dashboard. Here they see a “Connect Wallet” button, launch Web3Modal, and connect one or more addresses. The dashboard displays aggregated balances fetched via TanStack React Query, showing each token’s USD value.

After reviewing balances, the user clicks “Purchase Proof,” which opens a Stripe Checkout page. Upon successful payment, a webhook updates the user’s paid status in Supabase. The user is redirected back to a confirmation screen with a “Generate Proof” button. When clicked, the app calls the PDF generation API, returns a downloadable PDF with QR code, and shows a link to the public verification page. A third party scans the QR code, lands on `/api/verify/[token]`, and sees the proof-of-funds data in JSON or simple HTML.

## 4. Core Features

- **Authentication**: Clerk-powered sign-up/sign-in and session management.
- **Wallet Connection**: Web3Modal integration for Ethereum, BSC, and Polygon.
- **Balance Aggregation**: Ethers.js logic (`lib/eth.ts`) to fetch token and native balances from JSON-RPC providers.
- **Payment Processing**: Stripe Checkout sessions and webhook handling (one-time payment flow).
- **PDF Generation**: PDFKit-driven API creating branded proof documents with embedded QR codes.
- **Verification Endpoint**: Public dynamic route to fetch proof metadata by token.
- **Database Storage**: Supabase/PostgreSQL tables for users and `proof_requests` (UUID, timestamp, user ID, payment status).
- **Error Handling**: User-friendly messages for failed RPC calls, payment errors, or PDF issues.

## 5. Tech Stack & Tools

- **Frontend**: Next.js (App Router), React, TypeScript
- **Styling & UI**: Tailwind CSS, shadcn/ui component library
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL) + Supabase Migrations
- **Payment Gateway**: Stripe (Checkout and Webhooks)
- **Blockchain Interaction**: Ethers.js in `lib/eth.ts`, JSON-RPC endpoints (env vars)
- **Data Fetching**: TanStack React Query
- **PDF & QR**: PDFKit and `qrcode` library
- **Lint & Format**: ESLint, Prettier
- **Version Control**: Git

## 6. Non-Functional Requirements

- **Performance**: Balance fetch and PDF generation responses under 3 seconds for typical use.
- **Scalability**: Handle 100 concurrent users without performance degradation.
- **Security**: Secure JWT sessions, protect `/api/generate-proof` behind paid status check, generate non-guessable UUID tokens.
- **Usability**: Clear UI states (loading, success, error), mobile-responsive layout.
- **Reliability**: 99.9% uptime for critical endpoints; retry logic for RPC and Stripe webhooks.

## 7. Constraints & Assumptions

- Must have valid JSON-RPC URLs for Ethereum, BSC, Polygon in environment variables.
- Stripe account and API keys are set in env vars; webhook endpoint reachable from Stripe.
- Supabase project provisioned with migration setup; Clerk API keys provided.
- No KYC or identity checks in v1—only email auth.
- PDFKit can handle documents under 5 pages without timeouts.

## 8. Known Issues & Potential Pitfalls

- **RPC Rate Limits**: Public nodes may throttle requests. Mitigation: use premium providers or cache results.
- **Stripe Webhook Delivery**: Missing retries could leave user unpaid. Mitigation: implement idempotency and log events.
- **Long PDF Generation**: Complex PDFs might time out. Mitigation: optimize PDF structure or offload to background jobs later.
- **Token Guessing**: Weak UUIDs could be brute-forced. Mitigation: use `uuidv4()` and check token existence before display.
- **Cross-Origin**: Verification endpoint may need CORS headers if called from other domains.

---

This PRD provides a clear roadmap for an AI or development team to implement the crypto proof-of-funds service with no ambiguity. All core requirements, tech choices, and user interactions are defined for a seamless handoff to subsequent technical documentation.