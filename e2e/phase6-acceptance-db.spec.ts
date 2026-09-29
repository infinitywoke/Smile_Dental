import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createTestPatient, cleanupTestData, createTestClinicalRecord, TENANT_SMILE, TENANT_BOB as TENANT_OTHER } from './helpers/testDb';
import * as crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const USER_ID = '10000000-0000-0000-0000-000000000001';

test.describe('Phase 6 — Database & Invariants Acceptance Gate', () => {
  let p1: any;

  test.beforeAll(async () => {
    p1 = await createTestPatient(TENANT_SMILE, 'P6-DB-Patient');
  });

  test.afterAll(async () => {
    await cleanupTestData([p1.id]);
  });

  test('Temporal Integrity', async () => {
    const start = new Date();
    start.setFullYear(start.getFullYear() + 2);
    const end = new Date(start.getTime() + 30 * 60000);

    // 1. Valid
    const res1 = await supabase.from('appointments').insert({
      tenant_id: TENANT_SMILE,
      patient_id: p1.id,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      booking_source: 'PHONE',
      reason: 'Test'
    });
    expect(res1.error).toBeNull();

    // 2. Zero Duration
    const res2 = await supabase.from('appointments').insert({
      tenant_id: TENANT_SMILE,
      patient_id: p1.id,
      scheduled_start: start.toISOString(),
      scheduled_end: start.toISOString(),
      booking_source: 'PHONE',
      reason: 'Test'
    });
    expect(res2.error?.code).toBe('23514');

    // 3. Reversed Interval
    const res3 = await supabase.from('appointments').insert({
      tenant_id: TENANT_SMILE,
      patient_id: p1.id,
      scheduled_start: end.toISOString(),
      scheduled_end: start.toISOString(),
      booking_source: 'PHONE',
      reason: 'Test'
    });
    expect(res3.error?.code).toBe('23514');
  });

  test('Double Booking & NULL Specialist (Main Dentist)', async () => {
    const start = new Date();
    start.setFullYear(start.getFullYear() + 2);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60000); // 1 hour

    // Appointment 1 (NULL specialist -> MAIN_DENTIST)
    const res1 = await supabase.from('appointments').insert({
      tenant_id: TENANT_SMILE,
      patient_id: p1.id,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      booking_source: 'PHONE',
      reason: 'Test'
    });
    expect(res1.error).toBeNull();

    // Appointment 2 (NULL specialist -> MAIN_DENTIST) overlapping
    const overlapStart = new Date(start.getTime() + 30 * 60000);
    const overlapEnd = new Date(start.getTime() + 90 * 60000);
    const res2 = await supabase.from('appointments').insert({
      tenant_id: TENANT_SMILE,
      patient_id: p1.id,
      scheduled_start: overlapStart.toISOString(),
      scheduled_end: overlapEnd.toISOString(),
      booking_source: 'PHONE', // overlapping scheduled appointment
      reason: 'Test'
    });
    expect(res2.error?.code).toBe('23P01');

    // Appointment 3 (Walk-in overlapping -> should also be rejected)
    const res3 = await supabase.from('appointments').insert({
      tenant_id: TENANT_SMILE,
      patient_id: p1.id,
      scheduled_start: overlapStart.toISOString(),
      scheduled_end: overlapEnd.toISOString(),
      booking_source: 'WALK_IN',
      reason: 'Test'
    });
    expect(res3.error?.code).toBe('23P01');

    // Appointment 4 (different specialist -> allowed)
    const specId = crypto.randomUUID();
    const res4 = await supabase.from('appointments').insert({
      tenant_id: TENANT_SMILE,
      patient_id: p1.id,
      scheduled_start: overlapStart.toISOString(),
      scheduled_end: overlapEnd.toISOString(),
      booking_source: 'PHONE',
      assigned_specialist: specId,
      reason: 'Test'
    });
    expect(res4.error).toBeNull();

    // Appointment 5 (different tenant -> allowed)
    const p2 = await createTestPatient(TENANT_OTHER, 'P6-Other');
    const res5 = await supabase.from('appointments').insert({
      tenant_id: TENANT_OTHER,
      patient_id: p2.id,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      booking_source: 'PHONE',
      reason: 'Test'
    });
    expect(res5.error).toBeNull();
    await cleanupTestData([p2.id]);

    // Appointment 6 (back-to-back -> allowed)
    const bbEnd = new Date(end.getTime() + 30 * 60000);
    const res6 = await supabase.from('appointments').insert({
      tenant_id: TENANT_SMILE,
      patient_id: p1.id,
      scheduled_start: end.toISOString(),
      scheduled_end: bbEnd.toISOString(),
      booking_source: 'PHONE',
      reason: 'Test'
    });
    expect(res6.error).toBeNull();
  });

  test('State Integrity (Exact State Machine)', async () => {
    const start = new Date();
    start.setFullYear(start.getFullYear() + 2);
    start.setHours(14, 0, 0, 0);
    const end = new Date(start.getTime() + 30 * 60000);

    const { data: appt } = await supabase.from('appointments').insert({
      tenant_id: TENANT_SMILE,
      patient_id: p1.id,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      booking_source: 'PHONE',
      status: 'SCHEDULED',
      reason: 'Test'
    }).select().single();

    // SCHEDULED -> IN_PROGRESS (Illegal)
    let res = await supabase.from('appointments').update({ status: 'IN_PROGRESS' }).eq('id', appt.id);
    expect(res.error?.message).toContain('Invalid transition from SCHEDULED to IN_PROGRESS');

    // SCHEDULED -> COMPLETED (Illegal)
    res = await supabase.from('appointments').update({ status: 'COMPLETED' }).eq('id', appt.id);
    expect(res.error?.message).toContain('Invalid transition from SCHEDULED to COMPLETED');

    // SCHEDULED -> NO_SHOW (Legal)
    res = await supabase.from('appointments').update({ status: 'NO_SHOW' }).eq('id', appt.id);
    expect(res.error).toBeNull();

    // NO_SHOW -> SCHEDULED (Illegal)
    res = await supabase.from('appointments').update({ status: 'SCHEDULED' }).eq('id', appt.id);
    expect(res.error?.message).toContain('NO_SHOW can only transition to CHECKED_IN or CANCELLED');

    // NO_SHOW -> CHECKED_IN (Legal)
    res = await supabase.from('appointments').update({ status: 'CHECKED_IN' }).eq('id', appt.id);
    expect(res.error).toBeNull();

    // CHECKED_IN -> COMPLETED (Illegal)
    res = await supabase.from('appointments').update({ status: 'COMPLETED' }).eq('id', appt.id);
    expect(res.error?.message).toContain('Invalid transition from CHECKED_IN to COMPLETED');

    // CHECKED_IN -> IN_PROGRESS (Legal)
    res = await supabase.from('appointments').update({ status: 'IN_PROGRESS' }).eq('id', appt.id);
    expect(res.error).toBeNull();

    // IN_PROGRESS -> COMPLETED (Fails because missing clinical record)
    res = await supabase.from('appointments').update({ status: 'COMPLETED' }).eq('id', appt.id);
    expect(res.error?.message).toContain('A COMPLETED appointment must have a corresponding clinical record');

    // Create clinical record
    await createTestClinicalRecord({ tenantId: TENANT_SMILE, patientId: p1.id, appointmentId: appt.id });

    // IN_PROGRESS -> COMPLETED (Succeeds)
    res = await supabase.from('appointments').update({ status: 'COMPLETED' }).eq('id', appt.id);
    expect(res.error).toBeNull();

    // COMPLETED -> CANCELLED (Illegal terminal reversion)
    res = await supabase.from('appointments').update({ status: 'CANCELLED' }).eq('id', appt.id);
    expect(res.error?.message).toContain('Cannot transition from COMPLETED to active state');
  });
});
