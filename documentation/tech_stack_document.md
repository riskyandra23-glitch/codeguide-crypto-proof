# Tech Stack Document for codeguide-crypto-proof

This document explains, in everyday terms, the technologies behind the **codeguide-crypto-proof** starter template. It shows why each choice was made and how they work together to power a crypto wallet aggregation and proof-of-funds service.

## 1. Frontend Technologies

These tools build the parts users see and interact with directly in their browser.

- **Next.js (App Router)**
  - Provides a mix of server-rendered pages (fast, SEO-friendly) and client-side interactivity.
  - Handles page routing and backend endpoints in one framework, keeping frontend and API code organized.
- **React**
  - The core library for building user interfaces with reusable components.
- **TypeScript**
  - Adds type safety to JavaScript, catching mistakes early and making the codebase easier to understand and maintain.
- **Tailwind CSS**
  - A utility-first styling framework that speeds up UI design with ready-made CSS classes.
- **shadcn/ui**
  - A set of accessible, customizable React components (buttons, dialogs, cards) built on top of Tailwind CSS.
- **TanStack React Query**
  - Manages data fetching from APIs, caches results, and handles loading/error states for a smooth user experience.
- **web3modal + ethers.js**
  - **web3modal** lets users connect their crypto wallets easily.
  - **ethers.js** is a lightweight library for reading blockchain data (token balances, transactions).
- **ESLint & Prettier**
  - Automated linting and formatting tools to keep code clean and consistent.

How it enhances user experience:

- Fast page loads and real-time data updates when showing aggregated wallet balances.
- Consistent, responsive design powered by Tailwind and shadcn/ui.
- Clear error messages and retry logic thanks to React Query.

## 2. Backend Technologies

These components power the server side and handle data storage, payment processing, and PDF generation.

- **Node.js & Next.js API Routes**
  - Run JavaScript/TypeScript code on the server without leaving the Next.js project.
  - Endpoints include:
    - `/api/balances` for fetching aggregated wallet balances.
    - `/api/checkout-session` for creating Stripe payment sessions.
    - `/api/generate-proof` for building the proof-of-funds PDF.
    - `/api/verify/[token]` for public verification of proofs.
    - `/api/webhooks/stripe` for listening to Stripe payment events.
- **Supabase (PostgreSQL)**
  - A hosted database service that stores users, proof requests (unique tokens, timestamps), and payment statuses.
  - Built-in migration system keeps database changes under version control.
- **pdfkit & qrcode**
  - **pdfkit** generates custom PDF documents on the fly.
  - **qrcode** library embeds a scannable QR code linking to the verification page.
- **Optional ORM (Prisma)**
  - Can be layered on top of Supabase’s Postgres to provide a type-safe way to define and query your database schema.

How they support functionality:

- Securely store user accounts, payment info, and generated proofs.
- Create payment-gated endpoints so only paid users can generate PDFs.
- Dynamically build and serve PDF files with embedded verification links.

## 3. Infrastructure and Deployment

These choices ensure the app is reliable, scalable, and easy to deploy.

- **Hosting (Vercel)**
  - Automatic deployments from GitHub whenever code is pushed.
  - Built-in support for Next.js, handling serverless functions (API routes) seamlessly.
- **Version Control (Git & GitHub)**
  - Tracks code history and enables collaboration through pull requests.
- **CI/CD (GitHub Actions)**
  - Runs automated checks (linting, tests) on each code update to prevent errors from reaching production.
- **Environment Variables**
  - Securely store API keys and secrets (Stripe, Supabase, JSON-RPC URLs for blockchain providers) outside of the code.
- **Optional Docker Setup**
  - A `docker-compose.yml` can standardize development and testing environments if multiple services (database, local server) are needed.

How it contributes:

- Zero-downtime updates and global distribution of frontend and APIs.
- Automated quality checks guard against breaking changes.
- Easy local setup using environment variables and Docker (if adopted).

## 4. Third-Party Integrations

These external services add specialized capabilities without reinventing the wheel.

- **Clerk**
  - Manages user sign-up, sign-in, session handling, and email verification.
- **Stripe**
  - Processes one-time payments or subscriptions and notifies the app via webhooks.
- **Supabase**
  - Provides the hosted Postgres database and schema migration tools.
- **OpenAI API (Optional)**
  - Example setup included for future AI-powered features (e.g., natural-language summaries).
- **Persona (Optional KYC)**
  - Can be integrated via webhooks to verify user identities and store KYC status.

Benefits:

- Fast implementation of secure authentication and payments.
- Real-time database features without managing your own servers.
- Room to extend with AI or compliance checks without major refactoring.

## 5. Security and Performance Considerations

Key measures to protect user data and maintain a responsive app.

Security:

- Authentication enforced on all protected API routes via Clerk’s server-side checks.
- Secure storage of secrets in environment variables (never hard-coded).
- UUID-based, unguessable tokens for proof verification.
- Webhook signatures verified to trust only genuine Stripe events.
- Optional rate limiting on public endpoints (`/api/balances`, `/api/verify/[token]`).

Performance:

- Server-Side Rendering (SSR) and Static Generation (SSG) in Next.js for fast load times and good SEO.
- Data caching and background refetching with React Query to minimize unnecessary network calls.
- Lazy loading of UI components (via dynamic imports) to reduce initial bundle size.
- Potential background job queue (e.g., Supabase Edge Functions or Inngest) for heavy PDF generation at scale.

## 6. Conclusion and Overall Tech Stack Summary

In summary, **codeguide-crypto-proof** brings together a modern, full-stack toolset that aligns perfectly with a crypto proof-of-funds application:

- Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, React Query, web3modal/ethers.js.
- Backend: Next.js API Routes, Supabase (Postgres), pdfkit, qrcode, optional Prisma.
- Infrastructure: Vercel hosting, GitHub Actions CI/CD, environment-driven configuration.
- Integrations: Clerk for auth, Stripe for payments, Supabase for data, plus optional AI/KYC services.

These choices ensure a secure, scalable, and developer-friendly foundation so you can focus on the unique logic of wallet aggregation, payment gating, and PDF proof generation—getting you from idea to production faster than ever.