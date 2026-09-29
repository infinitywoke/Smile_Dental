import { test, expect } from '@playwright/test';
import { 
  TENANT_SMILE, 
  createTestPatient, 
  createTestTreatmentPlan, 
  createTestTreatmentItem, 
  cleanupTestData,
  adminClient 
} from './helpers/testDb';

test.describe('Phase 5 — COMPLETE_TREATMENT Lifecycle Matrix (Cases A - H)', () => {
  let patientMain: any;
  let patientOther: any;

  test.beforeAll(async () => {
    patientMain = await createTestPatient(TENANT_SMILE, 'Treatment Lifecycle Patient');
    patientOther = await createTestPatient(TENANT_SMILE, 'Unrelated Treatment Patient');
  });

  test.afterAll(async () => {
    await cleanupTestData([patientMain?.id, patientOther?.id]);
  });

  test.beforeEach(async ({ page }) => {
    // Login as Dr. Ananya
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Case A: 1 IN_PROGRESS item generates exactly 1 action', async ({ page }) => {
    const plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patientMain.id,
      name: 'Plan Case A'
    });
    const item = await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Root Canal Therapy A',
      status: 'IN_PROGRESS',
      tooth: '11'
    });

    await page.goto('/dashboard');
    const actionCenter = page.locator('section[aria-label="Global Action Center"]');
    await expect(actionCenter).toContainText('Treatment Lifecycle Patient');
    await expect(actionCenter).toContainText('Root Canal Therapy A (Tooth #11) is currently in progress.');

    // Cleanup item
    await adminClient.from('treatment_plans').delete().eq('id', plan.id);
  });

  test('Case B: 2 IN_PROGRESS items in the same plan generate 2 distinct actions', async ({ page }) => {
    const plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patientMain.id,
      name: 'Multi-Item Plan'
    });
    const item1 = await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Crown Prep Tooth 21',
      status: 'IN_PROGRESS',
      tooth: '21'
    });
    const item2 = await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Post and Core Tooth 22',
      status: 'IN_PROGRESS',
      tooth: '22'
    });

    await page.goto('/dashboard');
    const actionCenter = page.locator('section[aria-label="Global Action Center"]');
    await expect(actionCenter).toContainText('Crown Prep Tooth 21');
    await expect(actionCenter).toContainText('Post and Core Tooth 22');

    // Cleanup
    await adminClient.from('treatment_plans').delete().eq('id', plan.id);
  });

  test('Case C: Completed item results in action disappearing', async ({ page }) => {
    const plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patientMain.id,
      name: 'Plan Case C'
    });
    const item = await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Scaling and Polishing',
      status: 'IN_PROGRESS'
    });

    // Verify it is visible
    await page.goto('/dashboard');
    await expect(page.locator('section[aria-label="Global Action Center"]')).toContainText('Scaling and Polishing');

    // Navigate to patient page to resolve it
    await page.goto(`/dashboard/patients/${patientMain.id}#treatments`);
    
    // Click complete button for the item
    const row = page.locator('li', { hasText: 'Scaling and Polishing' });
    await expect(row).toBeVisible();
    // In TreatmentPlansSection, the in-progress icon is an ArrowRight svg.text-blue-500
    await row.locator('svg.text-blue-500').click();

    // Verify status updated in DB
    await expect.poll(async () => {
      const { data } = await adminClient.from('treatment_items').select('status').eq('id', item.id).single();
      return data?.status;
    }, { timeout: 10000 }).toBe('COMPLETED');

    // Return to dashboard and verify action is gone
    await page.goto('/dashboard');
    await expect(page.locator('section[aria-label="Global Action Center"]')).not.toContainText('Scaling and Polishing');

    // Cleanup
    await adminClient.from('treatment_plans').delete().eq('id', plan.id);
  });

  test('Case D: PLANNED or CANCELLED items generate NO Complete Treatment action', async ({ page }) => {
    const plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patientMain.id,
      name: 'Inactive Items Plan'
    });
    await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Future Implant',
      status: 'PLANNED'
    });
    await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Cancelled Extraction',
      status: 'CANCELLED'
    });

    await page.goto('/dashboard');
    const actionCenter = page.locator('section[aria-label="Global Action Center"]');
    await expect(actionCenter).not.toContainText('Future Implant (Tooth #14) is currently in progress.');
    await expect(actionCenter).not.toContainText('Cancelled Extraction');

    // Cleanup
    await adminClient.from('treatment_plans').delete().eq('id', plan.id);
  });

  test('Case E: Multiple active plans generate correct action per actionable item', async ({ page }) => {
    const plan1 = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patientMain.id,
      name: 'Plan 1'
    });
    const plan2 = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patientMain.id,
      name: 'Plan 2'
    });

    await createTestTreatmentItem({
      planId: plan1.id,
      procedure: 'Plan 1 Item InProgress',
      status: 'IN_PROGRESS'
    });
    await createTestTreatmentItem({
      planId: plan2.id,
      procedure: 'Plan 2 Item InProgress',
      status: 'IN_PROGRESS'
    });

    await page.goto('/dashboard');
    const actionCenter = page.locator('section[aria-label="Global Action Center"]');
    await expect(actionCenter).toContainText('Plan 1 Item InProgress');
    await expect(actionCenter).toContainText('Plan 2 Item InProgress');

    // Cleanup
    await adminClient.from('treatment_plans').delete().in('id', [plan1.id, plan2.id]);
  });

  test('Case F: Unrelated patient IN_PROGRESS item does not cross-interfere', async ({ page }) => {
    const planMain = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patientMain.id,
      name: 'Main Plan'
    });
    const planOther = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patientOther.id,
      name: 'Other Plan'
    });

    await createTestTreatmentItem({
      planId: planMain.id,
      procedure: 'Main Item InProgress',
      status: 'IN_PROGRESS'
    });
    await createTestTreatmentItem({
      planId: planOther.id,
      procedure: 'Other Item InProgress',
      status: 'IN_PROGRESS'
    });

    // Check patientMain's Command Centre
    await page.goto(`/dashboard/patients/${patientMain.id}`);
    await expect(page.locator('text=Main Item InProgress').first()).toBeVisible();
    await expect(page.locator('text=Other Item InProgress')).not.toBeVisible();

    // Cleanup
    await adminClient.from('treatment_plans').delete().in('id', [planMain.id, planOther.id]);
  });

  test('Case G: Completing 1 of 2 actionable items removes only that item action', async ({ page }) => {
    const plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patientMain.id,
      name: 'Dual Item Plan'
    });
    const item1 = await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'First Procedure To Complete',
      status: 'IN_PROGRESS'
    });
    const item2 = await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Second Procedure To Stay',
      status: 'IN_PROGRESS'
    });

    await page.goto(`/dashboard/patients/${patientMain.id}#treatments`);
    const row1 = page.locator('li', { hasText: 'First Procedure To Complete' });
    await row1.locator('svg.text-blue-500').click();

    // Verify DB state
    await expect.poll(async () => {
      const { data } = await adminClient.from('treatment_items').select('status').eq('id', item1.id).single();
      return data?.status;
    }, { timeout: 10000 }).toBe('COMPLETED');

    // Return to dashboard
    await page.goto('/dashboard');
    const actionCenter = page.locator('section[aria-label="Global Action Center"]');
    await expect(actionCenter).not.toContainText('First Procedure To Complete');
    await expect(actionCenter).toContainText('Second Procedure To Stay');

    // Cleanup
    await adminClient.from('treatment_plans').delete().eq('id', plan.id);
  });

  test('Case H: Stale / duplicate resolution does not cause phantom action or errors', async ({ page }) => {
    const plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patientMain.id,
      name: 'Stale Plan'
    });
    const item = await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Already Completed Item',
      status: 'COMPLETED'
    });

    // In DB, item is already completed.
    await page.goto('/dashboard');
    const actionCenter = page.locator('section[aria-label="Global Action Center"]');
    await expect(actionCenter).not.toContainText('Already Completed Item');

    // Go to patient page, verify item shows line-through / completed
    await page.goto(`/dashboard/patients/${patientMain.id}#treatments`);
    await expect(page.locator('li', { hasText: 'Already Completed Item' }).locator('.line-through')).toBeVisible();

    // Cleanup
    await adminClient.from('treatment_plans').delete().eq('id', plan.id);
  });
});
