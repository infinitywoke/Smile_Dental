import { test, expect } from '@playwright/test';
import { 
  TENANT_SMILE, 
  TENANT_BOB, 
  createTestPatient, 
  createTestTreatmentPlan, 
  createTestTreatmentItem, 
  cleanupTestData,
  adminClient 
} from './helpers/testDb';

test.describe('Phase 5 Security & Tenant Isolation Suite', () => {
  let patientA: any;
  let patientB: any;

  test.beforeAll(async () => {
    patientA = await createTestPatient(TENANT_SMILE, 'Security TenantA Patient');
    patientB = await createTestPatient(TENANT_BOB, 'Security TenantB Patient');
  });

  test.afterAll(async () => {
    await cleanupTestData([patientA?.id, patientB?.id]);
  });

  test('A1: Unauthenticated request to /api/test/seed is strictly rejected (401)', async ({ request }) => {
    const res = await request.post('/api/test/seed', {
      data: {
        action: 'seedTreatment',
        payload: {
          patientId: patientA.id,
          planName: 'Hack Plan',
          procedure: 'Extraction',
          status: 'IN_PROGRESS'
        }
      }
    });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/Unauthorized/i);
  });

  test('A2: Cross-tenant execution in /api/test/seed is forbidden (403)', async ({ page }) => {
    // Login as Tenant A (Dr. Ananya)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Attempt to seed treatment for Tenant B's patient
    const res = await page.request.post('/api/test/seed', {
      data: {
        action: 'seedTreatment',
        payload: {
          patientId: patientB.id, // Belongs to Tenant B
          planName: 'Malicious Cross-Tenant Plan',
          procedure: 'Extraction',
          status: 'IN_PROGRESS'
        }
      }
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/forbidden|cross-tenant/i);
  });

  test('H1: Tenant isolation in Global Action Center - Tenant A cannot see Tenant B actions', async ({ page }) => {
    // Seed an IN_PROGRESS treatment for Patient B
    const planB = await createTestTreatmentPlan({
      tenantId: TENANT_BOB,
      patientId: patientB.id,
      name: 'Bob Secret Plan'
    });
    await createTestTreatmentItem({
      planId: planB.id,
      procedure: 'Bob Rare Surgery',
      status: 'IN_PROGRESS'
    });

    // Login as Tenant A
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Action Center must NOT contain Bob's patient or procedure
    const actionCenter = page.locator('section[aria-label="Global Action Center"]');
    await expect(actionCenter).not.toContainText('Security TenantB Patient');
    await expect(actionCenter).not.toContainText('Bob Rare Surgery');
  });

  test('H2: Cross-tenant direct navigation to patient file is rejected', async ({ page }) => {
    // Login as Tenant A
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Logged in as Tenant A, try navigating directly to Tenant B's patient profile
    await page.goto(`/dashboard/patients/${patientB.id}`);
    
    // Should show Next.js 404 not found
    await expect(page.locator('text=/404|could not be found|not found/i').first()).toBeVisible();
  });
});
