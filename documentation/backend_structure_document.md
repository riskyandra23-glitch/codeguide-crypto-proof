# Backend Structure Document

This document outlines the backend setup for the **codeguide-crypto-proof** project, a Next.js starter template tailored for a Crypto Wallet Aggregation and Proof-of-Funds PDF Generation service. It explains the architecture, data management, API design, hosting, infrastructure, security, and monitoring in clear, everyday language.

## 1. Backend Architecture

Overall, the backend is built on a serverless, modular design using Next.js API routes. It follows a layered pattern:

• API Layer (Next.js Route Handlers)  
• Service Layer (custom modules for blockchain, payments, PDFs)  
• Data Access Layer (Supabase client, Stripe utilities)  

Key design points:

- **Serverless Functions**: Each API route runs as an isolated, auto-scaling function on Vercel (or any Node.js host).  
- **Modularity**: Business logic is separated into small files (`lib/eth.ts`, `utils/stripe/server.ts`, `utils/supabase/admin.ts`).  
- **Provider Pattern**: Shared clients (Clerk, Supabase, Stripe, React Query) are initialized once and injected where needed.  
- **Type Safety**: TypeScript ensures consistent data shapes across layers.

How this supports:

- **Scalability**: Functions scale independently under load, with no single point of failure.  
- **Maintainability**: Clear folder structure (`app/api/`, `lib/`, `utils/`) makes it easy to find and update code.  
- **Performance**: Cold starts are minimized by light modules, and caching is handled at the network edge or client side.

## 2. Database Management

We use a **SQL** database provided by **Supabase** (a hosted PostgreSQL service).

Technology stack:
• Supabase-managed PostgreSQL  
• Supabase client for server-side queries  
• Migrations folder for version-controlled schema changes  

Data handling practices:

- **Migrations**: All schema updates live in `supabase/migrations/`, ensuring repeatable deployments.  
- **Real-time**: Supabase can push updates via websockets if needed (not used here by default).  
- **Access Control**: Server-side routes use a privileged Supabase key (`utils/supabase/admin.ts`) to read/write sensitive tables.

## 3. Database Schema

Human-readable description:

• **proof_requests**: Stores each PDF request with a unique token, the associated user, the aggregated balances, and timestamps.  
• **payments** (managed implicitly by Stripe webhooks): User payment status is recorded in a column of your `users` or a dedicated `payments` table, depending on your preference.

SQL schema for **proof_requests** (PostgreSQL):

```sql
CREATE TABLE proof_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,           -- Clerk user ID
  token         UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  balances      JSONB NOT NULL,          -- Aggregated wallet balances
  status        TEXT NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optional index for fast lookups by token
CREATE INDEX idx_proof_requests_token ON proof_requests(token);
```

## 4. API Design and Endpoints

All APIs follow a RESTful style, using JSON input/output. They reside under `app/api/` in the Next.js App Router:

• **POST /api/balances**  
  - Purpose: Accepts a list of wallet addresses, fetches balances across Ethereum, BSC, Polygon, and returns the summed result.  
  - Flow: Calls a service in `lib/eth.ts` that wraps `ethers.js` logic.

• **POST /api/checkout-session**  
  - Purpose: Creates a Stripe Checkout session for a one-time payment.  
  - Flow: Uses `utils/stripe/server.ts` to generate a session and returns the URL.

• **POST /api/generate-proof**  
  - Purpose: After verifying the user is authenticated and paid, generates a PDF with `pdfkit`, embeds a QR code, saves a `proof_requests` row, and returns the PDF file.  
  - Flow: Guards with Clerk middleware, writes to Supabase, streams PDF.

• **GET /api/verify/[token]**  
  - Purpose: Public endpoint to look up a proof by its token and return stored balances and metadata.  
  - Flow: Reads from `proof_requests` and returns JSON (or a 404 if not found).

• **POST /api/webhooks/stripe**  
  - Purpose: Receives Stripe events (e.g., `checkout.session.completed`) and updates the user’s paid status in the database.  
  - Flow: Verifies webhook signature, then upserts a flag in Supabase.

## 5. Hosting Solutions

• **Vercel** (recommended) for Next.js functions and static assets.  
• **Supabase** for the PostgreSQL database and edge functions (optional).  
• **Clerk** for authentication (hosted service).  
• **Stripe** for payment processing (hosted service).

Benefits:

- **Reliability**: Each service (Vercel, Supabase, Clerk, Stripe) has SLAs and built-in failover.  
- **Scalability**: Serverless functions and managed DB scale with demand.  
- **Cost-effectiveness**: You pay for usage only—no idle servers.  

## 6. Infrastructure Components

• **Load Balancer & CDN**: Vercel automatically distributes functions and caches static assets globally.  
• **Caching**: 
  - Client-side: TanStack React Query caches `/api/balances` results.  
  - Edge: Vercel’s CDN can cache public routes (e.g., verification pages).  
• **Background Jobs (optional)**: You can offload heavy PDF generation to Supabase Edge Functions or a job queue (e.g., Inngest) to avoid timeouts.  
• **Environment Variables**: Securely stored in Vercel/Supabase dashboard (`NEXT_PUBLIC_...`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `CLERK_API_KEY`, JSON-RPC URLs).

## 7. Security Measures

• **Authentication**: Clerk protects both pages and API routes.  
• **Authorization**: Middleware checks ensure only paid users can call `/api/generate-proof`.  
• **Data Encryption**: TLS everywhere (HTTPS), and Supabase encrypts data at rest.  
• **Webhook Security**: Stripe signature verification on `/api/webhooks/stripe`.  
• **Secrets Management**: Keys and URLs live in secure environment variables.  
• **Rate Limiting** (recommended): Throttle public endpoints (`/api/balances`, `/api/verify/[token]`) to prevent abuse.

## 8. Monitoring and Maintenance

• **Error Tracking**: Integrate Sentry or Logflare to catch runtime errors in API routes.  
• **Performance Monitoring**: Use Vercel Analytics and Supabase Logs to track response times, database usage, and cold starts.  
• **Health Checks**: Simple cron-based pings to critical endpoints (e.g., `/api/health`) to detect downtime.  
• **Database Backups**: Supabase offers automated backups—you can schedule additional exports.  
• **Migrations Workflow**: Apply new migrations via CI/CD; use `supabase migration:apply` in staging and production.

## 9. Conclusion and Overall Backend Summary

The backend for **codeguide-crypto-proof** is a modern, serverless setup that balances ease of development with production-ready features:

- **Next.js API Routes** provide modular, auto-scaling endpoints.  
- **Supabase (PostgreSQL)** offers a reliable, managed database with versioned migrations.  
- **Clerk** and **Stripe** handle authentication and payments out of the box.  
- **Structured modules** (`lib/eth.ts`, `utils/stripe`, `utils/supabase/admin.ts`) keep blockchain logic, payments, and data access cleanly separated.  
- **Security** and **monitoring** practices ensure user data is protected and the system remains healthy under load.

This architecture aligns perfectly with a scalable Crypto Wallet Aggregation and Proof-of-Funds service, giving developers a clear path to extend functionality, add new blockchain networks, or integrate advanced KYC and background processing features without major rewrites.