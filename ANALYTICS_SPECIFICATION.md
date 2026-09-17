# Clinic Analytics Specification

This document defines the metrics and calculations used in the Phase 13 Clinic Intelligence & Analytics dashboard.

## Global Principles
* **Time Basis**: By default, calculations filter records by their relevant primary timestamp (e.g., `created_at` for requests, `start_time` for appointments, `payment_date` for payments) falling within the selected date range.
* **Tenant Isolation**: All queries must enforce `tenant_id` at the database level (RLS).
* **Modern vs Legacy**: Financial metrics exclusively use modern canonical `payments` records. Legacy Tally amounts are explicitly excluded to prevent contamination of verified financial data.
* **Zero Handling**: Denominators of zero yield `N/A` or `0` rather than crashing or throwing errors.

## 1. Overview KPIs
* **New Patients**: Count of `patients` where `created_at` falls in the date range.
* **Completed Visits**: Count of `appointments` where `status = 'COMPLETED'` and `start_time` in range.
* **Booking Requests**: Count of `booking_requests` where `created_at` in range.
* **Conversion Rate**: (Converted booking requests in range) / (Total booking requests in range).
* **Modern Payments Collected**: Sum of `amount` from `payments` where `payment_date` in range.
* **No-show Rate**: (No-show appointments in range) / (Total appointments in range).

## 2. Acquisition & Conversion
* **Requests by Source**: Group `booking_requests` by `source` where `created_at` in range.
* **Conversion Funnel**:
  * **Requests**: Total `booking_requests` in range.
  * **Contacted**: Count of `booking_requests` with status `CONTACTED`, `CONVERTED` (since converted implies contacted).
  * **Converted**: Count of `booking_requests` with status `CONVERTED`.
  * **Appointment Created**: Count of converted requests where the resulting patient has at least one appointment.
  * **Completed Visit**: Count of converted requests where the resulting patient has at least one `COMPLETED` appointment.

## 3. Appointments / Operations
* **Total Appointments**: Count of `appointments` where `start_time` in range.
* **Completed / Cancelled / No-Shows**: Grouped by `status`.
* **Completion / Cancellation / No-Show Rate**: Count of status / Total Appointments.
* **Appointments by Day**: Grouped by `DATE(start_time)`.

## 4. Treatments & Clinical
* **Treatment Plans Created**: Count of `treatment_plans` where `created_at` in range.
* **Treatment Items Planned**: Count of `treatment_items` where `created_at` in range and `status = 'PLANNED'`.
* **Treatment Items In Progress**: Count of `treatment_items` where `status = 'IN_PROGRESS'`.
* **Treatment Items Completed**: Count of `treatment_items` where `status = 'COMPLETED'`.
* **Estimated Treatment Value**: Sum of `cost` from `treatment_items` where `created_at` in range.

## 5. Financials (Modern Canonical Only)
* **Total Collected**: Sum of `amount` from `payments` where `payment_date` in range.
* **Payments by Mode**: Sum of `amount` grouped by `payment_method`.
* **Payments Over Time**: Sum of `amount` grouped by `DATE(payment_date)`.
* **Average Payment**: Total Collected / Count of `payments`.
