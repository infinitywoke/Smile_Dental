# Production Readiness Checklist

This document tracks the status of the Smile Dental Clinic OS for production launch.

## 1. Application [READY]
* **Build Status**: Next.js production build completes with 0 errors (`npm run build`).
* **Type Safety**: Unnecessary `any` aliases (e.g. `Patient = any`) removed and bound to database-generated types.
* **Linting**: No critical errors. Minor unused-import warnings remain (Tech Debt).

## 2. Database [READY]
* **Schema**: Relational integrity and constraints (Foreign Keys) are strictly defined.
* **Migrations**: Supabase migrations are ordered and idempotent.
* **Indexes**: Basic indexes exist for `tenant_id` and `patient_id`.

## 3. Authentication [READY]
* **Session Management**: Handled securely via `@supabase/ssr` cookies.
* **Middleware**: `/dashboard` routes are strictly protected.

## 4. RLS / Security [READY]
* **Tenant Isolation**: Row-Level Security (RLS) is enabled on all tables, filtering `tenant_id` by the authenticated user's assigned tenant.
* **Service Role**: `SUPABASE_SERVICE_ROLE_KEY` is restricted strictly to server-side Node scripts (e.g., E2E testing/migration) and is never exposed to the Next.js client.

## 5. Secrets [REQUIRES CONFIGURATION]
* **Production Variables**: Must provision real production keys for:
  * `NEXT_PUBLIC_SUPABASE_URL`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  * `SUPABASE_SERVICE_ROLE_KEY` (if used in CI/CD)
* **Local env**: `.env.local` remains out of source control.

## 6. Tally Migration [POST-LAUNCH]
* **Status**: Pipeline and UI are built (`/dashboard/migration`), tested, and locked.
* **Action**: Do not run production migration until the clinic is fully onboarded and staff are trained on the manual review UI.

## 7. Backups [REQUIRES CONFIGURATION]
* **Database**: Must enable Supabase Point-in-Time Recovery (PITR) and daily logical backups on the production project.
* **Tally Source**: Original Tally JSON exports must be backed up securely in a secure cloud bucket (e.g., AWS S3 or Google Cloud Storage) outside the application database.

## 8. Monitoring & Error Handling [POST-LAUNCH]
* **Action**: Integrate a production error tracking service (e.g., Sentry) to monitor unhandled server-side exceptions and client crashes.
* **Current State**: Errors are caught safely in React Error Boundaries and Server Actions return `{ error: string }` tuples.

## 9. Domain & Hosting [REQUIRES CONFIGURATION]
* **Hosting**: Deploy to Vercel or a dedicated Node.js server.
* **Domain**: Map clinic domain (e.g., `smiledental.in`) and provision SSL certificates.

## 10. Public Website [READY]
* **Security**: No patient health data is exposed.
* **Booking**: Booking requests use secure server actions. No direct database writes from the client browser.

## 11. Known Limitations & Edge Cases
* **Local Development Port Conflicts**: Windows Hyper-V occasionally reserves ports (e.g., 54321-54330), causing local `supabase start` to fail. This does not affect cloud production environments but temporarily blocks local E2E database verification.
* **Double Booking**: While the UI manages appointment slots, strict overlapping time constraints are not currently enforced at the PostgreSQL database trigger level.

---
**Status**: The system architecture is fundamentally sound. The application is technically ready to be deployed to a staging environment for final clinic acceptance testing.
