# Clinic OS — Phase 5 Test Matrix (Runtime Re-Audit)

| Test ID | Feature | Preconditions | Input/State | Expected Result | Actual Result | Status | Evidence Type | Defect ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-5.1** | Deep-link E2E: START_ENCOUNTER | Browser environment, seeded DB | Click action in Action Center | Navigates to `/dashboard/appointments/[id]/consultation`, state is `IN_PROGRESS` | E2E runner timed out during UI navigation | **BLOCKED** | BROWSER/E2E TEST | E2E-TimeOut |
| **TC-5.2** | Deep-link E2E: SCHEDULE_FOLLOWUP | Browser, active treatment plan | Click action | Navigates to `/new?action=schedule_followup&planId=[id]` | E2E runner timed out | **BLOCKED** | BROWSER/E2E TEST | E2E-TimeOut |
| **TC-5.3** | DB Runtime: Financial (Zero Items) | Patient with 0 items/payments | Execute SQL against `patient_financial_balances` view | Returns no row or `balance = 0` | Verified via `scripts/qa-phase5.ts` | **PASS** | DATABASE RUNTIME | None |
| **TC-5.4** | DB Runtime: Financial (Planned Item) | Patient with 1 PLANNED item (200), 0 payments | Execute SQL against view | `balance = 200` | Verified via `scripts/qa-phase5.ts` | **PASS** | DATABASE RUNTIME | None |
| **TC-5.5** | DB Runtime: Financial (Completed & Partial) | Patient with 1 COMPLETED item (500), 100 paid | Execute SQL against view | `balance = 400` | Verified via `scripts/qa-phase5.ts` | **PASS** | DATABASE RUNTIME | None |
| **TC-5.6** | DB Runtime: Tenant Isolation | Tenant A and B users | Authenticate as Tenant A vs B | Cross-tenant data strictly isolated | Verified via `scripts/qa-phase5.ts` (View filters natively via RLS) | **PASS** | SECURITY TEST | None |
| **TC-5.7** | Concurrency: START_ENCOUNTER | Two tabs simultaneously | Submit IN_PROGRESS status twice | DB idempotent update prevents duplicate states | Static logic relies on Postgres `UPDATE`, E2E blocked | **UNVERIFIED** | BROWSER/E2E TEST | E2E-TimeOut |
| **TC-5.8** | Action Engine E2E | Phase 4 tests exist | Execute `nextActionEngine.test.ts` | All 31 scenarios pass | All 31 scenarios passed | **PASS** | UNIT TEST | None |
| **TC-5.9** | Patient Command Centre | Multiple unresolved actions | Load `/dashboard/patients/[id]` | Shows primary + list of secondary | E2E runner timed out | **BLOCKED** | BROWSER/E2E TEST | E2E-TimeOut |
| **TC-5.10** | Global Action Center | Multiple patients | Load `/dashboard` | Grouped by patient ID | E2E runner timed out | **BLOCKED** | BROWSER/E2E TEST | E2E-TimeOut |
| **TC-5.11** | Deduplication | Same patient, 2 active plans | Deduplication logic evaluation | 1 follow up action generated | Confirmed via `handledPatients.add()` invariant | **PASS** | SOURCE INSPECTION | None |
| **TC-5.12** | Mobile UI | Global Dashboard on Mobile | Viewport 320px | No horizontal scrolling | Playwright visual test timed out | **BLOCKED** | BROWSER/E2E TEST | E2E-TimeOut |
| **TC-5.13** | Accessibility | Dashboard rendering | VoiceOver / Axe scan | Accessible regions, focus management | E2E runner timed out | **BLOCKED** | BROWSER/E2E TEST | E2E-TimeOut |
| **TC-5.14** | Action Inventory | COMPLETE_TREATMENT | Inspect Engine | Action must be present | Implemented in nextActionEngine.ts (item-level) | **PASS** | SOURCE INSPECTION | Fixed (DEF-5.1) |
| **TC-5.15** | Action Inventory | RESPOND_TO_BOOKING | Inspect Engine | Action must be present | Confirmed via `booking_requests` fetch | **PASS** | SOURCE INSPECTION | None |
| **TC-5.16** | Production Smoke | Full application | `npm run build` | Application builds and loads | Built successfully | **PASS** | PRODUCTION TEST | None |
