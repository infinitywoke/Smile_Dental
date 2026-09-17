import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

test.describe('Specialist Referral Workflow & Integration', () => {

  test('Specialist integration matrix', async ({ request, page }) => {
    // 1. Setup tenant & login via UI to get cookies
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const apiReq = async (action: string, payload: any) => {
      const res = await page.request.post('/api/test/specialist', {
        data: { action, payload }
      });
      return await res.json();
    };

    // Helper to extract patient ID
    const createPatient = async (name: string, phone: string) => {
      await page.goto('/dashboard/patients/new');
      await page.fill('input[name="name"]', name);
      await page.fill('input[name="phone"]', phone);
      await page.click('button:has-text("Save Patient")');
      await page.waitForURL(/.*dashboard\/patients\/[0-9a-fA-F\-]{36}/);
      return page.url().split('/').pop()!;
    };

    const patientAId = await createPatient('Specialist Patient A', '5550001000');
    const patientBId = await createPatient('Specialist Patient B', '5550002000');

    // Create a referral for patient A
    const resRef = await apiReq('createSpecialistReferral', {
      patient_id: patientAId,
      specialist_name: 'Dr. Smith',
      reason: 'Root Canal',
      estimated_cost: 1000,
      advance_percentage: 50 // 500 required
    });
    console.log('createSpecialistReferral resRef:', resRef);
    expect(resRef.success).toBe(true);

    const refQuery = await apiReq('queryLatestReferral', { patientId: patientAId });
    const referralA = refQuery.data;
    expect(referralA.advance_required).toBe(500);
    expect(referralA.status).toBe('PENDING_ADVANCE');

    // 1. 0% paid -> scheduling rejected
    const appt0 = await apiReq('createAppointment', {
      patient_id: patientAId,
      date: '2026-10-01',
      start_time: '10:00',
      end_time: '11:00',
      reason: 'Specialist Visit',
      assigned_specialist: 'Dr. Smith',
      specialist_referral_id: referralA.id
    });
    expect(appt0.error).toContain('Specialist appointments require the advance payment');

    // 2. 25% paid ($250) -> rejected
    await apiReq('recordPayment', {
      patientId: patientAId,
      amount: 250,
      paymentDate: '2026-09-17',
      paymentMode: 'CASH',
      specialistReferralId: referralA.id
    });
    const ref25 = await apiReq('queryReferral', { id: referralA.id });
    expect(ref25.data.status).toBe('PENDING_ADVANCE'); // Still pending

    const appt25 = await apiReq('createAppointment', {
      patient_id: patientAId,
      date: '2026-10-01',
      start_time: '10:00',
      end_time: '11:00',
      reason: 'Specialist Visit',
      specialist_referral_id: referralA.id
    });
    expect(appt25.error).toContain('Specialist appointments require the advance payment');

    // 3. 49.99% paid (another $249) -> total $499 -> rejected
    await apiReq('recordPayment', {
      patientId: patientAId,
      amount: 249,
      paymentDate: '2026-09-17',
      paymentMode: 'CASH',
      specialistReferralId: referralA.id
    });
    const ref49 = await apiReq('queryReferral', { id: referralA.id });
    expect(ref49.data.status).toBe('PENDING_ADVANCE');

    // 4. exactly 50% paid (another $1) -> total $500 -> allowed
    await apiReq('recordPayment', {
      patientId: patientAId,
      amount: 1,
      paymentDate: '2026-09-17',
      paymentMode: 'CASH',
      specialistReferralId: referralA.id
    });
    const ref50 = await apiReq('queryReferral', { id: referralA.id });
    expect(ref50.data.status).toBe('ADVANCE_PAID');

    const appt50 = await apiReq('createAppointment', {
      patient_id: patientAId,
      date: '2026-10-01',
      start_time: '12:00',
      end_time: '13:00',
      reason: 'Specialist Visit',
      specialist_referral_id: referralA.id
    });
    console.log('appt50:', appt50);
    expect(appt50.success).toBe(true);

    const refFinal = await apiReq('queryReferral', { id: referralA.id });
    expect(refFinal.data.status).toBe('SCHEDULED');

    // 9. Payment from another patient -> rejected
    const payMismatch = await apiReq('recordPayment', {
      patientId: patientBId,
      amount: 100,
      paymentDate: '2026-09-17',
      paymentMode: 'CASH',
      specialistReferralId: referralA.id
    });
    expect(payMismatch.error).toContain('Payment patient mismatch');

    // 7. custom 25% threshold
    await apiReq('createSpecialistReferral', {
      patient_id: patientBId,
      specialist_name: 'Dr. Jones',
      reason: 'Braces',
      estimated_cost: 2000,
      advance_percentage: 25 // 500 required
    });
    const refBQuery = await apiReq('queryLatestReferral', { patientId: patientBId });
    const referralB = refBQuery.data;
    expect(referralB.advance_required).toBe(500);
    
    // Pay 500
    await apiReq('recordPayment', {
      patientId: patientBId,
      amount: 500,
      paymentDate: '2026-09-17',
      paymentMode: 'CASH',
      specialistReferralId: referralB.id
    });
    const refBAfter = await apiReq('queryReferral', { id: referralB.id });
    expect(refBAfter.data.status).toBe('ADVANCE_PAID');

  });

});
