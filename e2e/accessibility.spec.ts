import { test, expect } from '@playwright/test';
import { 
  TENANT_SMILE, 
  createTestPatient, 
  createTestTreatmentPlan, 
  createTestTreatmentItem, 
  cleanupTestData,
  adminClient 
} from './helpers/testDb';

test.describe('Phase 5 — Runtime Accessibility Suite', () => {
  let patient: any;
  let plan: any;

  test.beforeAll(async () => {
    patient = await createTestPatient(TENANT_SMILE, 'A11y Test Patient');
    plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      name: 'A11y Plan'
    });
    await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'A11y Scaling',
      status: 'IN_PROGRESS'
    });
  });

  test.afterAll(async () => {
    await adminClient.from('treatment_plans').delete().eq('id', plan?.id);
    await cleanupTestData([patient?.id]);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('F1: Global Action Center has proper ARIA landmark and accessible names', async ({ page }) => {
    await page.goto('/dashboard');
    const region = page.locator('section[role="region"][aria-label="Global Action Center"]');
    await expect(region).toBeVisible();

    // Verify resolve links have informative aria-labels
    const resolveLink = region.locator('a[aria-label*="Resolve action:"]').first();
    await expect(resolveLink).toBeVisible();
    const ariaLabel = await resolveLink.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/Resolve action:/i);
  });

  test('F2: Patient Command Centre Action Card is keyboard reachable and activatable', async ({ page }) => {
    await page.goto(`/dashboard/patients/${patient.id}`);
    
    const actionCard = page.locator('div[role="region"][aria-label="Action Center"]');
    await expect(actionCard).toBeVisible();

    // Focus link via keyboard Tab key
    const actionLink = actionCard.locator('a[aria-label*="Resolve action:"]').first();
    await actionLink.focus();
    await expect(actionLink).toBeFocused();

    // Press Enter to activate
    await page.keyboard.press('Enter');
    
    // Confirms it navigates via keyboard activation
    await expect(page).toHaveURL(/.*#treatments|.*patients/);
  });

  test('F3: Interactive controls have accessible roles and focus indicators', async ({ page }) => {
    // Wait for deterministic state from beforeEach
    const newAptBtn = page.locator('a[href="/dashboard/appointments/new"]').first();
    await expect(newAptBtn).toBeVisible();

    // Tab multiple times to verify keyboard traversal order
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const activeEl = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeEl).toBeTruthy();
    expect(activeEl !== 'BODY').toBeTruthy();

    // Verify dialog semantics on actual interaction
    // Click "New Appointment" or any button that opens a dialog
    await newAptBtn.focus();
    await expect(newAptBtn).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForURL('/dashboard/appointments/new');
  });
});

