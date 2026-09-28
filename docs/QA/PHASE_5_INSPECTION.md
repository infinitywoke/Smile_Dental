# Phase 5 Inspection: Action Center Intelligence & Resolution UX

## Executive Summary
The Phase 4 Action Engine successfully deterministicized clinic memory. However, this Phase 5 inspection reveals that the UI projection of this memory—the Action Center—functions as a flat, context-poor alert list rather than a contextual working memory. Critical workflow gaps include severe context switching (deep links dropping users onto generic pages), loss of action density (the Command Centre only showing 1 action), and a critical performance bottleneck (full table scans for global financial calculations). Phase 5 must enrich these actions with actionable context and reduce resolution friction.

## Current Action Center Architecture
- **Single Source of Truth**: Maintained. The `nextActionEngine` computes actions on the fly based on current database state. No fabricated `next_actions` table exists.
- **Projections**: 
  - `getTodayActions()` filters out `NOW` actions and maps the remainder onto the dashboard's "Needs Attention" sidebar.
  - `getPatientNextAction()` grabs only `actions[0]` for the Patient Command Centre.
- **Operational Separation**: The Dashboard correctly separates Operational Cockpit (Now/Waiting/Up Next) from Unfinished Work (Needs Attention).

## Action Inventory & Context Audit

| Action | Current Title | Current Description | Patient Context | Clinical/Financial Context | Missing Context |
|---|---|---|---|---|---|
| **START_ENCOUNTER** | Waiting Room | Patient is waiting... | Name | Missing | Appointment reason, scheduled time |
| **CONTINUE_ENCOUNTER**| In Chair | Consultation in progress... | Name | Missing | Current procedure, elapsed time in chair |
| **COMPLETE_NOTES** | Missing Clinical Note | Completed appt lacks docs... | Name | Missing | Date of visit, original reason for visit |
| **COLLECT_PAYMENT** | Outstanding Balance | ₹X remains unpaid. | Name | Balance amount | Which treatment plan/item is unpaid, what was already paid |
| **REVIEW_REFERRAL** | Specialist Referral | Referral to [Specialist]... | Name | Specialist Name | Reason for referral, tooth/procedure |
| **SCHEDULE_FOLLOWUP** | Schedule Follow-up | [Plan] has no appt... | Name | Plan Name | Urgency, next specific treatment item required |
| **RESPOND_TO_BOOKING**| New Booking Request | [Reason] | Name (from web) | Reason | Patient matching (if existing patient) |
| **SET_RECALL** | Routine Recall | Due for 6-month checkup... | Name | None | Exact date of last visit, whether active treatment exists |

## Action Resolution & Deep-Link Audit

| Triggering State | Action | Current URL | Resolution Friction | Next State |
|---|---|---|---|---|
| Checked In | `START_ENCOUNTER` | `/dashboard/appointments/[id]/consultation` | Low. Opens directly. | `IN_PROGRESS` |
| Completed & No Notes | `COMPLETE_NOTES` | `/dashboard/appointments/[id]/consultation` | Medium. User must find the notes tab and type. | Disappears |
| Balance > 0 | `COLLECT_PAYMENT` | `/dashboard/patients/[id]#payments` | **High**. Dumps user on profile. User must scroll, click Record Payment, infer amounts. | Updates Balance |
| Referral Pending | `REVIEW_REFERRAL` | `/dashboard/patients/[id]#referrals` | **High**. Generic profile page drop. | `SCHEDULED` |
| Active Plan / No Appt | `SCHEDULE_FOLLOWUP`| `/dashboard/appointments/new?patientId=[id]` | **High**. Opens blank booking form. User must remember *why* they are booking. | Appt Scheduled |

## Action Chain Map
The engine successfully forms chains:
**Encounter Workflow:** `START_ENCOUNTER` → `CONTINUE_ENCOUNTER` → `COMPLETE_NOTES` → `COLLECT_PAYMENT` → `SCHEDULE_FOLLOWUP`.
*UX Gap:* The chains are logical, but visually invisible. The user resolves one action, is returned to the dashboard, and must hunt for the next action in the list.

## Priority Audit
**Current Rules:** Statically mapped by type (e.g., Booking = URGENT, Notes/Referral = HIGH, Payment/Follow-up = NORMAL, Recall = LOW).
**Weaknesses:** 
1. **Time-blindness:** A follow-up from 6 months ago has the identical `NORMAL` priority as one from 5 minutes ago.
2. **Value-blindness:** A payment action for ₹150,000 is `NORMAL`, identical to a ₹50 balance. 
3. **Burial Risk:** A high volume of `NORMAL` actions interleaves, hiding genuinely overdue items.

## Grouping / Ordering Audit
**Current Behavior:** Flat list `<ul>` sorted by Priority Weight, then Timestamp.
**Issues:** If "John Doe" has missing notes and an outstanding payment, John appears twice in the list in completely different places (HIGH vs NORMAL). This destroys patient context. Rahil cannot look at a patient and say, "Before John leaves, I need to do X and Y."

## Patient Command Centre Consistency
**Current Behavior:** `getPatientNextAction(patient.id)` returns ONLY `actions[0]`.
**Issues:** If a patient has multiple unfinished actions (e.g. `COMPLETE_NOTES` and `COLLECT_PAYMENT`), the Command Centre drops the lower-priority action entirely. The dentist assumes only one thing is pending. This is a severe discrepancy between global state and local state.

## Financial Context Audit (Limitation Carried Forward)
- **Current Data:** Global Balance (₹Total Estimated - ₹Total Paid).
- **Missing Data:** Granular invoice linkage. 
- **Limitation:** As noted in Phase 4, `PLANNED` items currently inflate the balance artificially. *Deferred per instructions.*

## Treatment, Referral, and Recall Context
- The database contains the necessary data (`treatment_items` for Follow-ups, `reason` for Referrals, `scheduled_start` for Recall calculation), but the engine does not project this data into the `ClinicAction` payload.

## Mobile & Accessibility Audit
- **Mobile:** Truncation of descriptions happens rapidly. Touch targets for "RESOLVE" are small because the link is embedded inside the card flex layout.
- **A11y:** Action cards lack `aria-labelledby`. The colored badges (Priority) rely heavily on color differentiation which may fail contrast ratios.

## Performance Audit (High Risk)
**Current Architecture:** `getClinicWideActions()` fetches *all* `payments` and *all* `treatment_items` across the entire database into server memory to calculate balances for every patient on every dashboard load. 
**Risk:** O(N) memory scaling. Will crash Vercel serverless function limits within months of active clinic usage.

## Security Carry-Forward
- **Multi-tenant cross-bleed** isolation remains unverified due to lack of distinct multi-tenant fixtures in testing environments.

---

## Phase 5 Recommendations

### MUST FIX
1. **Performance:** Refactor `getClinicWideActions()` financial loop. Aggregate balances via a database-level query or view, not in-memory mapping of every historical item.
2. **Command Centre Action Loss:** Update `NextActionCard` and `getPatientActions` to display *all* pending actions for a patient in the Command Centre, not just `actions[0]`.
3. **Action Grouping:** Group the Dashboard Action Center by Patient so Rahil can resolve a patient's entire cluster of unfinished work at once.
4. **Resolution Friction (Deep Links):** Pre-fill context. `SCHEDULE_FOLLOWUP` must pass the reason/plan into the booking URL.

### SHOULD FIX
1. **Action Payload Context:** Add `reason`, `tooth`, or `specialist_name` into the `description` string natively inside `computePatientActions`.
2. **Duplicate Follow-up Actions:** Deduplicate `SCHEDULE_FOLLOWUP` if a patient has multiple active plans but needs a single appointment.
3. **Dynamic Priority:** Elevate priority based on timestamp (e.g. if a follow-up is > 30 days old, escalate to HIGH).

### COULD FIX
1. Dedicated "Resolve" modals instead of navigating away and losing dashboard context.

### DEFER
1. Redesigning the core financial billing engine (Invoices vs Estimates).
2. Automated communication (WhatsApp / AI Scribing).

---

## Proposed Implementation Sequence
1. **Phase 5.1 (Performance & Safety):** Fix the global financial balance table scan in `getClinicWideActions`.
2. **Phase 5.2 (Patient Context & Grouping):** Modify dashboard UI to group by `patientName`. Update Command Centre to list all actions.
3. **Phase 5.3 (Payload Enrichment):** Pass specific `treatment_items`, `appointment.reason`, and `referral.reason` into the action descriptions.
4. **Phase 5.4 (Resolution Friction):** Upgrade deep links to pass URL parameters (e.g., `?reason=FollowUp&planId=123`) so destination pages automatically focus on the required task.
