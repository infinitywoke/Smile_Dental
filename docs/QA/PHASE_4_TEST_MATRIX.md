# Phase 4 Test Matrix: Action Resolution

## 1. Encounter State Resolution

| Test ID | Feature | Scenario | Preconditions | Action | Expected Result | Actual Result | Pass/Fail | Notes |
|---------|---------|----------|---------------|--------|-----------------|---------------|-----------|-------|
| EN-01 | Appointment State | Start Encounter changes state | Appointment is `CHECKED_IN` | Click "Start Visit" on Dashboard | Navigates to Consultation Hub AND updates DB status to `IN_PROGRESS`. `START_ENCOUNTER` action vanishes. | | | |
| EN-02 | Appointment State | Continue Encounter resolves | Appointment is `IN_PROGRESS` | Click "Complete Checkout" | Appointment status becomes `COMPLETED`. `CONTINUE_ENCOUNTER` action vanishes. | | | |

## 2. Referral State Resolution

| Test ID | Feature | Scenario | Preconditions | Action | Expected Result | Actual Result | Pass/Fail | Notes |
|---------|---------|----------|---------------|--------|-----------------|---------------|-----------|-------|
| REF-01 | Referrals | Mark Scheduled | Referral is `ADVANCE_PAID` | Click "Mark Scheduled" | Status updates to `SCHEDULED`. `REVIEW_REFERRAL` action vanishes. | | | |
| REF-02 | Referrals | Mark Completed | Referral is `SCHEDULED` | Click "Mark Completed" | Status updates to `COMPLETED`. No new actions generated. | | | |

## 3. Recall Logic Resolution

| Test ID | Feature | Scenario | Preconditions | Action | Expected Result | Actual Result | Pass/Fail | Notes |
|---------|---------|----------|---------------|--------|-----------------|---------------|-----------|-------|
| REC-01 | Recall | Recall triggers accurately | Patient has 0 active treatments, 0 future appts, last appt > 6 months ago | View Action Center | `SET_RECALL` action is present. | | | |
| REC-02 | Recall | Recall suppresses correctly | Patient has 0 active treatments, 0 future appts, last appt < 6 months ago | View Action Center | `SET_RECALL` action is NOT present. | | | |

## 4. Financial Resolution

| Test ID | Feature | Scenario | Preconditions | Action | Expected Result | Actual Result | Pass/Fail | Notes |
|---------|---------|----------|---------------|--------|-----------------|---------------|-----------|-------|
| FIN-01 | Balance | Payment clears balance | Patient has `COLLECT_PAYMENT` action | Record payment equal to balance | `COLLECT_PAYMENT` action vanishes immediately. | | | |

## 5. Documentation Resolution

| Test ID | Feature | Scenario | Preconditions | Action | Expected Result | Actual Result | Pass/Fail | Notes |
|---------|---------|----------|---------------|--------|-----------------|---------------|-----------|-------|
| DOC-01 | Notes | Save Notes clears action | Appointment `COMPLETED` but no notes. `COMPLETE_NOTES` action present. | Save consultation form | `COMPLETE_NOTES` action vanishes. | | | |

## 6. Scheduling Resolution

| Test ID | Feature | Scenario | Preconditions | Action | Expected Result | Actual Result | Pass/Fail | Notes |
|---------|---------|----------|---------------|--------|-----------------|---------------|-----------|-------|
| SCH-01 | Booking | Scheduling clears followup | Patient has `ACTIVE` treatment but 0 future appts. `SCHEDULE_FOLLOWUP` present. | Create a future appointment | `SCHEDULE_FOLLOWUP` action vanishes. | | | |

## 7. Web Booking Resolution

| Test ID | Feature | Scenario | Preconditions | Action | Expected Result | Actual Result | Pass/Fail | Notes |
|---------|---------|----------|---------------|--------|-----------------|---------------|-----------|-------|
| WEB-01 | Web Req | Conversion clears booking | Booking is `PENDING`. `RESPOND_TO_BOOKING` present. | Convert to Patient / Approve | `RESPOND_TO_BOOKING` action vanishes. | | | |
