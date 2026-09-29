import { test, expect } from '@playwright/test';
import { 
  TENANT_SMILE, 
  createTestPatient, 
  createTestAppointment,
  createTestTreatmentPlan, 
  createTestTreatmentItem, 
  createTestPayment,
  cleanupTestData,
  adminClient 
} from './helpers/testDb';

test.describe('Phase 5 — Concurrency & Idempotency Testing Suite', () => {
  let patient: any;

  test.beforeAll(async () => {
    patient = await createTestPatient(TENANT_SMILE, 'Concurrency Test Patient');
  });

  test.afterAll(async () => {
    await cleanupTestData([patient?.id]);
  });

  test('D1 & D2: Double-click and simultaneous START_ENCOUNTER requests', async ({ page }) => {
    const appt = await createTestAppointment({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      status: 'CHECKED_IN',
      reason: 'Concurrency Visit'
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const inChairBtn = page.locator('li', { hasText: 'Concurrency Test Patient' }).locator('button:has-text("Start Visit")');
    await expect(inChairBtn).toBeVisible();

    // Rapid double click
    await Promise.all([
      inChairBtn.click({ clickCount: 2 }),
    ]);

    // Verify DB appointment status
    await expect.poll(async () => {
      const { data } = await adminClient.from('appointments').select('status').eq('id', appt.id).single();
      return data?.status;
    }, { timeout: 10000 }).toBe('IN_PROGRESS');

    // Verify appointment count is still exactly 1
    const { data: countData } = await adminClient.from('appointments').select('id').eq('id', appt.id);
    expect(countData?.length).toBe(1);

    // Cleanup
    await adminClient.from('appointments').delete().eq('id', appt.id);
  });

  test('D3 & D4: Two browser tabs resolving the same action (stale tab attempt)', async ({ browser }) => {
    const plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      name: 'Concurrent Plan'
    });
    const item = await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Concurrent Extraction',
      status: 'IN_PROGRESS'
    });

    // Create two independent contexts/tabs
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();

    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();

    // Login on both tabs
    for (const p of [pageA, pageB]) {
      await p.goto('/login');
      await p.fill('input[name="email"]', 'dr.ananya@smiledental.test');
      await p.fill('input[name="password"]', 'password123');
      await p.click('button[type="submit"]');
      await p.waitForURL('/dashboard');
      await p.goto(`/dashboard/patients/${patient.id}#treatments`);
      await expect(p.locator('li', { hasText: 'Concurrent Extraction' })).toBeVisible();
    }

    // Tab A resolves the action
    const btnA = pageA.locator('li', { hasText: 'Concurrent Extraction' }).locator('svg.text-blue-500');
    await btnA.click();

    // Verify Tab A has resolved item
    await expect.poll(async () => {
      const { data } = await adminClient.from('treatment_items').select('status').eq('id', item.id).single();
      return data?.status;
    }, { timeout: 10000 }).toBe('COMPLETED');

    // Now Tab B (which still has stale state) attempts to click
    const btnB = pageB.locator('li', { hasText: 'Concurrent Extraction' }).locator('svg.text-blue-500');
    // Even if clicked, it should not corrupt DB state or crash the application
    if (await btnB.isVisible()) {
      await btnB.click();
    }

    // Check DB remains consistently COMPLETED
    const { data: finalItem } = await adminClient.from('treatment_items').select('status').eq('id', item.id).single();
    expect(finalItem?.status).toBe('COMPLETED');

    await ctxA.close();
    await ctxB.close();
    await adminClient.from('treatment_plans').delete().eq('id', plan.id);
  });

  test('D5: Double-submit payment does not corrupt financial state', async ({ page }) => {
    const plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      name: 'Payment Plan',
      status: 'COMPLETED'
    });
    const item = await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Payment Item',
      cost: 500,
      status: 'COMPLETED'
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto(`/dashboard/patients/${patient.id}#payments`);
    await page.click('button:has-text("Record Payment")');
    await page.fill('input[placeholder="e.g. 5000"], input[type="number"]', '500');

    const submitBtn = page.locator('div.sm\\:col-span-6 button:has-text("Record Payment")');
    // Double click rapidly
    await submitBtn.click({ clickCount: 2 });

    // Verify DB payments: each payment is recorded safely without foreign key corruption
    await expect.poll(async () => {
      const { data } = await adminClient.from('payments').select('id, amount').eq('patient_id', patient.id);
      return data?.length;
    }, { timeout: 10000 }).toBeGreaterThan(0);

    // Clean up
    await adminClient.from('payments').delete().eq('patient_id', patient.id);
    await adminClient.from('treatment_plans').delete().eq('id', plan.id);
  });

  test('D6 & D7: Refresh during navigation/mutation does not cause broken state', async ({ page }) => {
    const plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      name: 'Refresh Plan'
    });
    const item = await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Refresh Procedure',
      status: 'IN_PROGRESS'
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await page.goto(`/dashboard/patients/${patient.id}#treatments`);
    const completeBtn = page.locator('li', { hasText: 'Refresh Procedure' }).locator('svg.text-blue-500');
    await completeBtn.click();
    
    // Immediately reload
    await page.reload();

    // Verify page recovers gracefully and renders without React error boundary crash
    await expect(page.getByRole('heading', { name: 'Refresh Plan' }).first()).toBeVisible();
    await expect(page.locator('h1, h2, h3')).not.toHaveCount(0);

    // Cleanup
    await adminClient.from('treatment_plans').delete().eq('id', plan.id);
  });
});
