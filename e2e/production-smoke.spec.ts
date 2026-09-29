import { test, expect } from '@playwright/test';
import { 
  TENANT_SMILE, 
  createTestPatient, 
  createTestTreatmentPlan, 
  createTestTreatmentItem, 
  cleanupTestData,
  adminClient 
} from './helpers/testDb';

test.describe('Phase 5 — Production Mode Smoke Test', () => {
  let patient: any;
  let plan: any;
  let item: any;

  test.beforeAll(async () => {
    patient = await createTestPatient(TENANT_SMILE, 'Smoke Test Patient');
    plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      name: 'Smoke Plan'
    });
    item = await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Smoke Composite Restoration',
      status: 'IN_PROGRESS'
    });
  });

  test.afterAll(async () => {
    await adminClient.from('treatment_plans').delete().eq('id', plan?.id);
    await cleanupTestData([patient?.id]);
  });

  test('Full Production Journey: Login -> Dashboard -> Action Center -> Deep Link -> Resolve -> Logout', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);

    // 2. Action Center on Dashboard
    const actionCenter = page.locator('section[aria-label="Global Action Center"]');
    await expect(actionCenter).toContainText('Smoke Composite Restoration');

    // 3. Deep link click to Patient file
    const resolveLink = actionCenter.locator(`a[href*="${patient.id}"]`).first();
    await resolveLink.click();
    await page.waitForURL(new RegExp(`.*dashboard/patients/${patient.id}`));

    // 4. Patient file renders Action Card
    const patientAction = page.locator('div[role="region"][aria-label="Action Center"]');
    await expect(patientAction).toContainText('Smoke Composite Restoration');

    // 5. Treatment Resolution
    const row = page.locator('li', { hasText: 'Smoke Composite Restoration' });
    await row.locator('svg.text-blue-500').click();

    // Verify DB
    await expect.poll(async () => {
      const { data } = await adminClient.from('treatment_items').select('status').eq('id', item.id).single();
      return data?.status;
    }, { timeout: 10000 }).toBe('COMPLETED');

    // 6. Return to Dashboard and verify Action Center updated
    await page.goto('/dashboard');
    await expect(page.locator('section[aria-label="Global Action Center"]')).not.toContainText('Smoke Composite Restoration');

    // 7. Logout
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*login/);
  });
});
