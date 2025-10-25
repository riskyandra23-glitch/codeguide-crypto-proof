# Security Guidelines for codeguide-crypto-proof

This document outlines security best practices and controls tailored to the **codeguide-crypto-proof** repository—a Next.js starter for a Crypto Wallet Aggregation and Proof-of-Funds PDF Generation Service. It integrates Clerk (authentication), Supabase (database), Stripe (payments), ethers.js (blockchain), and pdfkit (PDFs). Adherence to these guidelines ensures a robust, secure, and maintainable application.

---

## 1. Core Security Principles

- **Security by Design**: Integrate security considerations from architecture through deployment. Every new feature must undergo a security review.
- **Least Privilege**: Grant minimal permissions for database users, API keys, and cloud roles. Avoid broad roles like `supabase_admin` for application servers.
- **Defense in Depth**: Layer controls (authentication, input validation, rate limiting, logging) so a bypass of one does not expose the entire system.
- **Fail Securely**: Catch and handle errors without leaking stack traces, internal paths, or sensitive data.
- **Secure Defaults**: Ship with secure configurations—disable debug mode, enforce HTTPS, secure cookies.

---

## 2. Authentication & Access Control

1. **Clerk Integration**
   - Enforce authentication on all `/api/*` routes except public verification (`/api/verify/[token]`).
   - Validate JWTs or session cookies server-side. Reject invalid or expired tokens.
2. **Role-Based Access Control (RBAC)**
   - Define roles: `user`, `paid_user`, `admin` in your database.
   - Protect `/api/generate-proof` behind `paid_user` role. Verify `stripe_payment_status` and optional `kyc_status` before proceeding.
3. **Session Management**
   - Use Clerk’s secure cookies with `HttpOnly`, `Secure`, and `SameSite=Strict`.
   - Implement session idle and absolute timeouts.
4. **MFA for Sensitive Operations**
   - Encourage or require MFA for admin dashboard or KYC approval workflows.

---

## 3. Input Validation & Output Encoding

- **Server-Side Validation**
  - Validate every incoming API payload (e.g., wallet addresses in `/api/balances`, Stripe webhook events, proof requests) against a strict schema (Zod or Joi).
- **Prevent Injection**
  - Use prepared statements or Supabase’s parameterized queries. Never interpolate user input into SQL.
  - Sanitize filenames and paths when generating or streaming PDFs to avoid path traversal.
- **Output Encoding**
  - On the verification UI, escape all dynamic values (user names, timestamps, balances) to prevent XSS.
- **Rate Limiting**
  - Apply rate limits (e.g., 10 req/min) on `/api/balances` and `/api/verify/[token]` to prevent abuse or DoS.

---

## 4. Data Protection & Privacy

- **Encryption in Transit**
  - Enforce HTTPS (TLS 1.2+) on all endpoints (Next.js server, Supabase, Stripe callbacks).
- **Encryption at Rest**
  - Ensure Supabase database is encrypted by default.
  - If storing generated PDFs in object storage (e.g., AWS S3), enable server-side encryption.
- **Secrets Management**
  - Store API keys and RPC URLs in environment variables or a secrets manager (e.g., AWS Secrets Manager). Avoid checking `.env.local` into Git.
- **PII Handling**
  - Mask or redact sensitive user data in logs.
  - Implement proper retention and deletion policies for proof requests, in line with GDPR/CCPA.

---

## 5. API & Service Security

- **CORS Policy**
  - Restrict origins to the authorized UI domains in `next.config.js` or a CORS middleware.
- **HTTP Methods & Status Codes**
  - Enforce POST for state-changing routes (`/checkout-session`, `/generate-proof`). Use GET only for safe, idempotent actions (`/verify/[token]`).
- **Stripe Webhooks**
  - Validate webhook signatures using `stripe.webhooks.constructEvent`.
  - Process only the `checkout.session.completed` event and idempotently update user payment status.
- **Blockchain RPC Calls**
  - Throttle and cache RPC queries in `lib/eth.ts` to avoid provider rate-limit bans.

---

## 6. Web Application Security Hygiene

- **Security Headers** (set via Next.js `headers()` API or a middleware)
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `Content-Security-Policy`: restrict scripts, styles, and frames to trusted sources.
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer-when-downgrade`
- **CSRF Protection**
  - For any form-based or state-mutating endpoint not under Clerk’s guard, implement anti-CSRF tokens.
- **Cookie Security**
  - Set `Secure`, `HttpOnly`, and `SameSite=Strict` on any session or auth cookies.

---

## 7. Infrastructure & Configuration Management

- **Environment Hardening**
  - Disable debug logs in production (`NEXT_PUBLIC_NODE_ENV=production`).
  - Close unused ports; allow only 80/443 incoming.
- **Database Least Privilege**
  - Create a database role for the application with only `SELECT`, `INSERT`, `UPDATE` on required tables (`users`, `proof_requests`).
- **CI/CD Secrets**
  - Use environment-scoped secrets in your CI system (GitHub Actions, GitLab CI). Do not echo them in logs.

---

## 8. Dependency Management

- **Vulnerability Scanning**
  - Integrate SCA (e.g., `npm audit`, Snyk, Dependabot) and fix critical/high vulnerabilities promptly.
- **Lockfiles & Pinning**
  - Commit `package-lock.json` and ensure deterministic builds.
- **Minimal Footprint**
  - Only include necessary packages. Regularly review transitive dependencies for unused or unmaintained modules.

---

## 9. Testing, Monitoring & Incident Response

- **Automated Testing**
  - Unit tests for `lib/eth.ts` balance logic, endpoint schema validation.
  - Integration tests for `/api/checkout-session`, `/api/generate-proof`, and webhook processing.
  - E2E tests (Cypress/Playwright) exercising the full payment → proof generation flow.
- **Logging & Monitoring**
  - Centralize logs (e.g., LogDNA, Datadog). Capture request metadata, error stacks (sanitized), and performance metrics.
  - Alert on repeated failures or suspicious patterns (multiple invalid tokens, high 500 rates).
- **Incident Response**
  - Define a process for key rotation (API keys, JWT signing keys).
  - Maintain playbooks for data breaches and service outages.

---

## 10. Recommendations & Next Steps

- **Background PDF Generation**: Offload heavy PDF creation to a queue (Inngest, Supabase Edge Functions) to improve API responsiveness.
- **KYC Integration**: If using Persona or similar, secure the KYC webhook and validate payload signatures. Enforce KYC status check before proof generation.
- **Advanced Rate Limiting**: Use a CDN or API gateway (e.g., Cloudflare Workers) for global rate controls.
- **Regular Security Reviews**: Schedule quarterly code and architecture reviews focusing on new features and evolving threat models.

**By rigorously following these guidelines, the codeguide-crypto-proof project will maintain a high security posture, protect user data, and foster trust for end users and third-party verifiers.**

---

*Last updated:* 2024-06-XX

*Document version:* 1.0.0