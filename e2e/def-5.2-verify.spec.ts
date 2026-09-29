import { test, expect } from '@playwright/test';
import { adminClient } from './helpers/testDb';

const TENANT_SMILE = '11111111-1111-1111-1111-111111111111';

test.describe('DEF-5.2 Invariant Verification', () => {
  let patientId: string;
  let apptId: string;

  test.beforeAll(async () => {
    // 1. Create Patient
    const pRes = await adminClient.from('patients').insert({
      tenant_id: TENANT_SMILE,
      name: 'DEF-5.2 Test Patient',
      phone: '555-000-5252'
    }).select().single();
    patientId = pRes.data.id;
  });

  test.afterAll(async () => {
    await adminClient.rpc('cleanup_test_data', { p_ids: [patientId] });
  });

  test.beforeEach(async () => {
    // 2. Create IN_PROGRESS Appointment
    const start = new Date();
    start.setHours(start.getHours() - 1);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
    
    const aRes = await adminClient.from('appointments').insert({
      tenant_id: TENANT_SMILE,
      patient_id: patientId,
      status: 'IN_PROGRESS',
      reason: 'DEF-5.2 Verification',
      booking_source: 'WALK_IN',
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString()
    }).select().single();
    apptId = aRes.data.id;
  });

  test.afterEach(async () => {
    await adminClient.from('appointments').delete().eq('id', apptId);
  });

  test('A. Direct database update: Cannot set COMPLETED without clinical record', async () => {
    const { error } = await adminClient.from('appointments')
      .update({ status: 'COMPLETED' })
      .eq('id', apptId);
    
    expect(error).not.toBeNull();
    expect(error?.message).toContain('Cannot complete an appointment without a clinical record');
  });

  test('D. Valid completion: Succeeds when clinical record is present', async () => {
    // Get a user for created_by
    const { data: userData } = await adminClient.from('users').select('id').eq('tenant_id', TENANT_SMILE).limit(1).single();
    
    // Insert record
    const { error: insertError } = await adminClient.from('clinical_records').insert({
      tenant_id: TENANT_SMILE,
      patient_id: patientId,
      appointment_id: apptId,
      chief_complaint: 'Testing Valid Completion',
      created_by: userData!.id
    });
    
    expect(insertError).toBeNull();

    // Update should now succeed
    const { error } = await adminClient.from('appointments')
      .update({ status: 'COMPLETED' })
      .eq('id', apptId);
    
    expect(error).toBeNull();
  });

  test('B. Application UI: Prevents completion without clinical documentation', async ({ page }) => {
    // Navigate to actual consultation UI
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await page.goto(`/dashboard/appointments/${apptId}/consultation`);

    // The UI intrinsically binds Save and Checkout. 
    // To prove the UI properly handles the underlying server action rejection, 
    // we click checkout (which saves), then we delete the record out from under it 
    // before it submits the final completion.
    await page.click('button:has-text("Complete & Checkout")');
    await expect(page.locator('text=Complete & Checkout').last()).toBeVisible(); // modal appears
    
    // Nuke the clinical record to simulate missing documentation state (Wait for it to be created first)
    let deleted = false;
    for (let i = 0; i < 10; i++) {
      const delRes = await adminClient.from('clinical_records').delete().eq('appointment_id', apptId).select();
      if (delRes.data && delRes.data.length > 0) {
        deleted = true;
        break;
      }
      await page.waitForTimeout(500);
    }
    expect(deleted).toBe(true);

    // The Complete Visit button is disabled if amount is empty, so we enter 0
    await page.fill('input[type="number"]', '0');

    // Attempt actual completion via the UI
    await page.click('button:has-text("Complete Visit")');
    
    // Verify appropriate UI error is shown
    await expect(page.locator('.bg-red-50')).toContainText('Cannot complete appointment without a saved clinical record', { timeout: 10000 });

    // Verify appointment remains non-COMPLETED in DB
    const { data: appt } = await adminClient.from('appointments').select('status').eq('id', apptId).single();
    expect(appt!.status).toBe('IN_PROGRESS');
  });

  test('C. RPC/Server Action: Directly calling completeVisitAction without clinical record fails', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const response = await page.request.post(`/api/test/def52casec?apptId=${apptId}`);
    const data = await response.json();
    
    expect(data.error).toBe('Cannot complete appointment without a saved clinical record');
    
    const { data: appt } = await adminClient.from('appointments').select('status').eq('id', apptId).single();
    expect(appt!.status).toBe('IN_PROGRESS');
  });

  test('E1. Invalid Concurrency: Concurrent completions with NO record safely reject', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const [res1, res2] = await Promise.all([
      page.request.post(`/api/test/def52casec?apptId=${apptId}`),
      page.request.post(`/api/test/def52casec?apptId=${apptId}`)
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();

    // Both must reject
    expect(data1.error).toBe('Cannot complete appointment without a saved clinical record');
    expect(data2.error).toBe('Cannot complete appointment without a saved clinical record');

    const { data: appt } = await adminClient.from('appointments').select('status').eq('id', apptId).single();
    expect(appt!.status).toBe('IN_PROGRESS');
  });

  test('E2. Valid Concurrency: Concurrent completions WITH record do not duplicate or corrupt state', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const { data: userData } = await adminClient.from('users').select('id').eq('tenant_id', TENANT_SMILE).limit(1).single();
    await adminClient.from('clinical_records').insert({
      tenant_id: TENANT_SMILE,
      patient_id: patientId,
      appointment_id: apptId,
      chief_complaint: 'Testing Valid Concurrency',
      created_by: userData!.id
    });

    const [res1, res2] = await Promise.all([
      page.request.post(`/api/test/def52casec?apptId=${apptId}`),
      page.request.post(`/api/test/def52casec?apptId=${apptId}`)
    ]);

    const { data: appt } = await adminClient.from('appointments').select('status').eq('id', apptId).single();
    expect(appt!.status).toBe('COMPLETED');
  });
});
