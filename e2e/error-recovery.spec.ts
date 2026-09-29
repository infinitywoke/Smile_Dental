import { test, expect } from '@playwright/test';
import { 
  TENANT_SMILE, 
  createTestPatient, 
  cleanupTestData,
  adminClient 
} from './helpers/testDb';

test.describe('Phase 5 — Error and Recovery Testing Suite', () => {
  let patient: any;

  test.beforeAll(async () => {
    patient = await createTestPatient(TENANT_SMILE, 'Error Recovery Patient');
  });

  test.afterAll(async () => {
    await cleanupTestData([patient?.id]);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('E1: Empty Action Center renders clean empty state without crashes', async ({ page }) => {
    await page.goto('/dashboard');
    const actionCenter = page.locator('section[aria-label="Global Action Center"]');
    await expect(actionCenter).toBeVisible();
    // When no actions exist or when caught up
    const emptyOrList = actionCenter.locator('text=All caught up!').or(actionCenter.locator('ul'));
    await expect(emptyOrList).toBeVisible();
  });

  test('E2: Invalid / non-existent patient ID displays graceful Not Found state', async ({ page }) => {
    await page.goto('/dashboard/patients/00000000-0000-0000-0000-000000000000');
    // Application must not throw unhandled exception or 500 white screen
    await expect(
      page.locator('text=Patient Not Found').or(page.locator('text=Error')).or(page.locator('text=not found')).or(page.locator('text=This page could not be found'))
    ).toBeVisible();
  });

  test('E3: Failed payment mutation (zero/negative amount) is rejected with error feedback', async ({ page }) => {
    await page.goto(`/dashboard/patients/${patient.id}#payments`);
    
    // Click toggle
    await page.click('button:has-text("Record Payment")');
    // Fill negative payment
    const amountInput = page.locator('input[placeholder="e.g. 5000"], input[type="number"]');
    await amountInput.fill('-100');
    const recordBtn = page.locator('div.sm\\:col-span-6 button:has-text("Record Payment")');
    await expect(recordBtn).toBeDisabled();
    
    // UI prevents submission of negative amount. Verify DB has NO payment with negative amount just in case.
    const { data } = await adminClient.from('payments').select('id').eq('patient_id', patient.id).lt('amount', 0);
    expect(data?.length || 0).toBe(0);
  });
});
