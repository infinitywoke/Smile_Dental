import { test, expect } from '@playwright/test';
import { 
  TENANT_SMILE, 
  createTestPatient, 
  createTestTreatmentPlan, 
  createTestTreatmentItem, 
  cleanupTestData,
  adminClient 
} from './helpers/testDb';

const VIEWPORTS = [
  { name: 'Mobile 320px', width: 320, height: 568 },
  { name: 'Mobile 375px', width: 375, height: 667 },
  { name: 'Mobile 390px', width: 390, height: 844 },
  { name: 'Mobile 430px', width: 430, height: 932 },
  { name: 'Desktop 1280px', width: 1280, height: 800 },
];

test.describe('Phase 5 — Responsive Runtime Viewport Audit', () => {
  let patient: any;
  let plan: any;

  test.beforeAll(async () => {
    patient = await createTestPatient(TENANT_SMILE, 'Responsive Patient');
    plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      name: 'Responsive Plan'
    });
    await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Responsive Polish',
      status: 'IN_PROGRESS'
    });
  });

  test.afterAll(async () => {
    await adminClient.from('treatment_plans').delete().eq('id', plan?.id);
    await cleanupTestData([patient?.id]);
  });

  for (const vp of VIEWPORTS) {
    test(`G: Viewport ${vp.name} (${vp.width}x${vp.height}) renders without horizontal overflow or clipped actions`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      await page.goto('/login');
      await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');

      // 1. Dashboard Action Center verification
      const actionCenter = page.locator('section[aria-label="Global Action Center"]');
      await expect(actionCenter).toBeVisible();

      // Check horizontal overflow on dashboard
      const hasHorizontalScrollDashboard = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScrollDashboard).toBeFalsy();

      // 2. Patient Command Centre verification
      await page.goto(`/dashboard/patients/${patient.id}`);
      const patientActionCard = page.locator('div[role="region"][aria-label="Action Center"]');
      await expect(patientActionCard).toBeVisible();

      // Check horizontal overflow on patient page
      const hasHorizontalScrollPatient = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(hasHorizontalScrollPatient).toBeFalsy();

      // Check action button is clickable in viewport
      const resolveBtn = patientActionCard.locator('a[aria-label*="Resolve action:"]').first();
      await expect(resolveBtn).toBeVisible();
    });
  }
});
