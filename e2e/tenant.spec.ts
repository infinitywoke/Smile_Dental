import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

test.describe('Phase 15.2 Final Verification - Tenant Isolation', () => {

  test('Tenant Isolation - Cross-tenant access is rejected', async ({ request, page }) => {
    // 1. Log in as dr.ananya (Tenant 1)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const apiReq = async (action: string, payload: any) => {
      const res = await page.request.post('/api/test/specialist', { data: { action, payload }});
      return await res.json();
    };

    // Create a patient in Tenant 1
    await page.goto('/dashboard/patients/new');
    await page.fill('input[name="name"]', 'Tenant One Patient');
    await page.fill('input[name="phone"]', '1111111111');
    await page.click('button:has-text("Save Patient")');
    await page.waitForURL(/.*dashboard\/patients\/[0-9a-fA-F\-]{36}/);
    const p1Id = page.url().split('/').pop()!;
    
    // Create a referral in Tenant 1
    const resRef = await apiReq('createSpecialistReferral', {
      patient_id: p1Id,
      specialist_name: 'Dr. T1',
      reason: 'Cross Tenant Test',
      estimated_cost: 1000,
      advance_percentage: 50
    });
    expect(resRef.success).toBe(true);

    const q = await apiReq('queryLatestReferral', { patientId: p1Id });
    const ref1Id = q.data.id;

    // Logout
    await page.context().clearCookies();

    // 2. Log in as dr.bob (Tenant 2)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.bob@competitor.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Attempt to query Tenant 1's patient (should fail or return empty due to RLS)
    const t2Query = await apiReq('queryReferral', { id: ref1Id });
    // Since RLS is on, data will be null
    expect(t2Query.data).toBeNull();

    // Attempt to make a payment to Tenant 1's referral
    const t2Pay = await apiReq('recordPayment', {
      patientId: p1Id, // Trying to use tenant 1's patient
      amount: 500,
      paymentDate: '2026-09-17',
      paymentMode: 'CASH',
      specialistReferralId: ref1Id
    });
    
    // The query inside recordPayment for the patient should fail because of RLS
    // so it returns 'Patient not found'
    expect(t2Pay.error).toBe('Patient not found');
  });

});
