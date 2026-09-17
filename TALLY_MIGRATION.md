# Tally Historical Data Migration Guide

This document outlines the pipeline, policies, and manual workflows for migrating historical Tally ERP data into Smile Dental Clinic OS.

## 1. Source Data Assumptions
Tally data exported for import is assumed to be an array of JSON objects containing at minimum:
* `id` (source record ID)
* `date` (transaction date)
* `ledger_name` (patient identifier)
* `narration` (treatment details, age, phone numbers)
* `amount` (transaction value)
* `payment_mode` (UPI, CASH, etc.)

## 2. Raw-Data Preservation First
Tally is a historical accounting system, not a clinical EMR. When Tally data is imported, the original strings (ledger, narration, amount) are preserved verbatim inside `legacy_records`. This ensures strict provenance.

## 3. Parsing & Normalization
After preserving the raw strings, a secondary parsing pass attempts to extract:
* **Phones**: Scans ledger names and narrations for 10-digit Indian formats.
* **Ages**: Scans narrations for patterns like "Age 42".
* **Names**: Normalizes ledger strings by stripping phones, ages, and redundant whitespace.

*Note: Extracting an age does NOT alter the patient's canonical Date of Birth. Extracting narration does NOT create a modern canonical Clinical Record.*

## 4. Matching Algorithm & Confidence
The migration pipeline executes a deterministic, confidence-based matching system against canonical patients in the same tenant:
* **90% Confidence**: Exact phone match.
* **70% Confidence**: Exact normalized name match.
* **40% Confidence**: Partial name match.

## 5. Ambiguity Handling & Manual Review
The system refuses to automatically link records to patients if ambiguity exists. 
* A 90% confidence match is considered `AUTO_MATCHED` unless there are multiple patients sharing the exact phone.
* Anything lower than 90% (e.g. name only) falls into `MANUAL_REVIEW`.
* If zero patients match, it remains `UNMATCHED`.

## 6. Manual Review Workflow
Clinic staff use the **Historical Data Migration** dashboard (`/dashboard/migration`) to review import batches. For records marked `MANUAL_REVIEW`, the dashboard presents:
* The original Tally raw data.
* The extracted parsed data.
* The top candidate patients and their confidence scores.

Staff can choose to **Confirm Match**, **Keep Unmatched**, or **Reject Record**.

## 7. Clinical & Financial Data Separation
Imported Tally records are visible on a patient's profile under a distinct **Historical Tally Records** section. This prevents historical (and potentially unverified or non-clinical) accounting entries from corrupting the modern, immutable `payments` ledger or the structured `clinical_records` EMR workflow.

## 8. Idempotency & Tenant Isolation
Imports are fully idempotent. Re-uploading the same Tally file will safely skip already-imported source IDs using PostgreSQL `ON CONFLICT` constraints scoped to `(tenant_id, source_system, source_record_id)`.

All operations strictly mandate a `tenant_id`, guaranteeing cross-clinic data isolation at the Row Level Security (RLS) layer.

## 9. Eventual Production Procedure
When executing this migration for real clinic data in production:
1. Ensure the raw Tally data matches the expected JSON array schema.
2. Back up the production database.
3. Use the `/dashboard/migration/import` dry-run tool (modified for the secure upload pipeline) to stage the records.
4. Clinic staff will spend a period manually reviewing and linking the ambiguous records.
5. Only after confident reconciliation should the legacy source system be fully decommissioned.
