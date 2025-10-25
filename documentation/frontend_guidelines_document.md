# Frontend Guideline Document for codeguide-crypto-proof

This document outlines the frontend architecture, design principles, and tools used in the `codeguide-crypto-proof` Next.js starter template. Anyone—technical or non-technical—can follow these guidelines to understand how the frontend is set up, why decisions were made, and how to extend it.

## 1. Frontend Architecture

**Framework & Language**
- Next.js (App Router) with TypeScript: enables a mix of server-rendered pages (for speed and SEO) and client-interactive components (for wallets, payments, and proof generation).
- File-based routing under the `app/` folder splits pages and API endpoints by directory structure.

**Key Libraries & Services**
- **Clerk**: handles user sign-up, sign-in, sessions, and access control across client and server.
- **Tailwind CSS** + **shadcn/ui**: utility-first styling and prebuilt, accessible React components for buttons, dialogs, cards, etc.
- **TanStack React Query**: declarative data fetching, caching, and state management for server data such as wallet balances.
- **Stripe**: payment checkout flow and webhook handling for gating the PDF generation feature.
- **Supabase**: managed PostgreSQL database for storing users, proof requests, and metadata, accessed via the Supabase client (`utils/supabase/admin.ts`).
- **ethers.js** (in `lib/eth.ts`): blockchain RPC calls to fetch token balances from Ethereum, BSC, Polygon, and other networks.
- **pdfkit** + **qrcode**: server-side PDF generation with embedded QR codes for proof verification.

**Scalability, Maintainability & Performance**
- Modular folders (`app/`, `components/`, `lib/`, `utils/`, `supabase/migrations/`) keep related code together and easy to extend.
- TypeScript enforces type safety across components and API routes, reducing runtime errors.
- Next.js Server Components minimize client bundle size by rendering static or server-only logic on the server.
- React Query caches data and minimizes redundant network requests, improving UX and reducing load.

## 2. Design Principles

**Usability**
- Clear, simple flows: connect wallet → view balances → pay → generate proof → download PDF.
- Feedback on actions: loading spinners during balance fetch, disabled buttons until prerequisites are met, toast notifications on success or error.

**Accessibility**
- shadcn/ui components follow WAI-ARIA standards out of the box.
- Semantic HTML in pages and forms ensures screen readers can navigate.
- Focus management in dialogs and modals (e.g., wallet connector).

**Responsiveness**
- Mobile-first design via Tailwind’s responsive utilities (sm, md, lg breakpoints).
- Flexbox and CSS Grid layouts adapt dashboards and forms for small to large screens.

## 3. Styling and Theming

**Styling Approach**
- Tailwind CSS (utility-first) drives styling directly in JSX, reducing the need for separate CSS files.
- BEM-like naming is not needed—Tailwind’s classes (e.g., `flex`, `gap-4`, `bg-indigo-600`) are self-descriptive.

**Theming**
- Light and dark modes managed via a CSS class on the `<html>` element and Tailwind’s `dark:` variants.
- Theme switcher state can be stored in local storage or user preferences.

**Visual Style**
- Modern, flat design with subtle shadows and rounded corners (matching glassmorphism hints in cards).  

**Color Palette**
- Primary: Indigo 600 (#4F46E5)  
- Primary-Light: Indigo 100 (#E0E7FF)  
- Secondary: Emerald 500 (#10B981)  
- Accent: Amber 400 (#FBBF24)  
- Neutral (text & backgrounds): Gray 800 (#1F2937), Gray 100 (#F3F4F6)  
- Danger: Red 500 (#EF4444)  

**Font**
- Inter (system-font fallback): clean, modern sans-serif for UI text.  
- Fallbacks: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.

## 4. Component Structure

**Organization**
- `components/dashboard/`: UI building blocks for the wallet dashboard (e.g., `WalletConnector.tsx`, `BalanceDisplay.tsx`).
- `components/`: other reusable elements (buttons, forms, cards)—often wrappers around shadcn/ui.
- `app/`: page and layout files that import components and handle overall page structure.

**Reusability & Maintainability**
- Each component has a single responsibility (e.g., connecting wallets, displaying balances, initiating payments).
- Props and callback patterns allow parent pages to pass data and handlers into components.
- Shared logic (like formatting balances or date strings) lives in utility modules (`lib/format.ts`).
- Component-based architecture isolates UI pieces, making it easy to update or replace one without impacting others.

## 5. State Management

**Server State**
- Managed by React Query:  
  • `useQuery` for fetching `/api/balances` and `/api/verify/[token]`.  
  • `useMutation` for actions like creating a Stripe checkout session or generating a proof PDF.
- Query caching, stale times, and background refetch ensures fresh data with minimal loading.

**Client/UI State**
- React state (useState/useReducer) for local toggles (e.g., wallet connection modal open/close).
- Clerk’s React context for reading user authentication status and profile.
- Theme preference in React context or a custom hook (`useTheme`) synced to `localStorage`.

## 6. Routing and Navigation

**Page Routing**
- File-based routing in Next.js App Router under `app/`.  
  • `/wallet` (inside `app/(dashboard)/wallet/page.tsx`) for wallet dashboard.  
  • `/success` for post-payment success.  
  • `/verify/[token]` for public proof verification UI.

**API Routes**
- Next.js Route Handlers under `app/api/`: balances, checkout-session, generate-proof, verify, webhooks.
- Protected routes (generate-proof) check Clerk session and Stripe payment status.

**Client Navigation**
- Next.js `<Link>` component for internal page links.  
- `useRouter()` for imperative navigation (e.g., redirect to Stripe checkout or success page).

## 7. Performance Optimization

**Code Splitting & Lazy Loading**
- Next.js automatically splits pages.  
- Dynamic imports for heavy components (e.g., PDF preview) using `next/dynamic`.

**Asset Optimization**
- Tailwind CSS purge removes unused classes in production builds.  
- Images handled by `next/image` for resizing and modern formats (WebP).

**Data Fetching Efficiency**
- React Query caches results (with configurable `staleTime`) to avoid refetching on every render.
- Debouncing or throttling wallet balance calls if multiple chains are queried simultaneously.

**Server-Side Rendering**
- Verification page (`/verify/[token]`) rendered on the server for faster first load and better SEO.

## 8. Testing and Quality Assurance

**Unit Tests**
- Jest + React Testing Library for UI components (`WalletConnector`, `BalanceDisplay`), focusing on behavior (render states, button enabling/disabling).
- Test utility functions (balance formatting, QR code data generation) with Jest.

**Integration Tests**
- Test API Route Handlers using a test Supabase instance or mocks:  
  • `/api/balances` with mocked `ethers.js` providers.  
  • `/api/generate-proof` flow, verifying PDF response and DB write.

**End-to-End (E2E) Tests**
- Cypress or Playwright to automate the full user journey:  
  1. Sign in with Clerk stub.  
  2. Connect wallet.  
  3. Fetch balances.  
  4. Click payment → Stripe simulation.  
  5. Generate PDF.  
  6. Verify via QR code link.

**Linting & Formatting**
- ESLint with recommended rules for TypeScript and Next.js.  
- Prettier for consistent code style.  
- Husky pre-commit hooks to run lint and tests.

## 9. Conclusion and Overall Frontend Summary

The `codeguide-crypto-proof` frontend combines modern best practices—Next.js App Router with server and client components, TypeScript type safety, utility-first styling, and modular UI components—to deliver a scalable, maintainable, and high-performance foundation for a crypto proof-of-funds service. By following these architectural and design guidelines, developers can confidently extend the application to support new blockchain networks, KYC flows, background PDF jobs, or custom themes, all while ensuring a smooth and accessible user experience.