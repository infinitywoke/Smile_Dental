import { test, expect } from '@playwright/test';
import { 
  TENANT_SMILE, 
  createTestPatient, 
  createTestAppointment,
  createTestClinicalRecord,
  createTestTreatmentPlan, 
  createTestTreatmentItem, 
  createTestReferral,
  createTestBookingRequest,
  createTestPayment,
  cleanupTestData,
  adminClient 
} from './helpers/testDb';

test.describe('Phase 5 — Complete Action Center 9-Action E2E Matrix', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('1. START_ENCOUNTER: Precondition -> Waiting Room Cockpit -> Start Visit -> In Chair DB update -> Action resolves', async ({ page }) => {
    const patient = await createTestPatient(TENANT_SMILE, 'Patient-Act1-StartVisit');
    const appt = await createTestAppointment({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      status: 'CHECKED_IN',
      reason: 'Emergency Visit Act1'
    });

    try {
      // 1. Appears in Waiting Room on Dashboard
      await page.goto('/dashboard');
      const waitingRoom = page.locator('section', { hasText: 'Waiting Room' });
      await expect(waitingRoom).toContainText('Patient-Act1-StartVisit');
      await expect(waitingRoom).toContainText('Emergency Visit Act1');

      // 2. Patient command centre check
      await page.goto(`/dashboard/patients/${patient.id}`);
      await expect(page.locator('text=Waiting Room')).toBeVisible();

      // 3. User clicks "Start Visit" to start encounter
      await page.goto('/dashboard');
      const row = page.locator('li', { hasText: 'Patient-Act1-StartVisit' });
      await row.locator('button:has-text("Start Visit")').click();

      // 4. Verify DB state changed to IN_PROGRESS
      await expect.poll(async () => {
        const { data } = await adminClient.from('appointments').select('status').eq('id', appt.id).single();
        return data?.status;
      }, { timeout: 10000 }).toBe('IN_PROGRESS');

      // 4.5 Wait for the redirect to Clinical Hub to finish
      await page.waitForURL(/\/dashboard\/appointments\/.*\/consultation/);

      // 5. Verify Action resolves: Waiting room no longer has this patient, now in "Now / In Chair"
      await page.goto('/dashboard');
      await expect(page.locator('section', { hasText: 'Waiting Room' })).not.toContainText('Patient-Act1-StartVisit');
      await expect(page.locator('section', { hasText: 'Now / In Chair' })).toContainText('Patient-Act1-StartVisit');
    } finally {
      await cleanupTestData([patient.id]);
    }
  });

  test('2. CONTINUE_ENCOUNTER: In Chair -> Deep link to Clinical Hub', async ({ page }) => {
    const patient = await createTestPatient(TENANT_SMILE, 'Patient-Act2-Continue');
    const appt = await createTestAppointment({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      status: 'IN_PROGRESS',
      reason: 'Consultation Act2'
    });

    try {
      // Verify it appears in Now / In Chair
      await page.goto('/dashboard');
      const inChair = page.locator('section', { hasText: 'Now / In Chair' });
      await expect(inChair).toContainText('Patient-Act2-Continue');
      await expect(inChair).toContainText('Consultation Act2');

      // Click Open Clinical Hub
      await inChair.locator('a:has-text("Open Clinical Hub")').click();
      await page.waitForURL(`/dashboard/appointments/${appt.id}/consultation`);
      await expect(page.getByRole('heading', { name: "Today's Consultation" }).or(page.getByRole('heading', { name: 'Treatment Planner' })).first()).toBeVisible();
    } finally {
      await cleanupTestData([patient.id]);
    }
  });

  test('3. COMPLETE_NOTES: Past IN_PROGRESS appointment -> Consultation -> Save notes -> Action disappears', async ({ page }) => {
    const patient = await createTestPatient(TENANT_SMILE, 'Patient-Act3-Notes');
    
    // Create an appointment from yesterday
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    
    const appt = await createTestAppointment({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      status: 'IN_PROGRESS',
      reason: 'Cleaning Done Act3',
      scheduledStart: pastDate.toISOString()
    });

    try {
      const dbApt = await adminClient.from('appointments').select('*').eq('id', appt.id).single();
      console.log('Test 3 DB Apt:', dbApt.data);
      console.log('TodayStart in JS:', new Date(new Date().setHours(0,0,0,0)).toISOString());
      await page.goto('/dashboard');
      const actionCenter = page.locator('section[aria-label="Global Action Center"]');
      await expect(actionCenter).toContainText('Patient-Act3-Notes');
      await expect(actionCenter).toContainText('Missing Clinical Note');

      // Deep link navigation
      await actionCenter.locator(`a[href*="${appt.id}"]`).first().click();
      await page.waitForURL(new RegExp(`.*dashboard/appointments/${appt.id}/consultation.*`));

      // Fill notes & save draft
      await page.locator('#chief_complaint').fill('Patient notes recorded for Act3');
      await page.click('button:has-text("Save Draft")');

      // Verify record in DB
      await expect.poll(async () => {
        const { data } = await adminClient.from('clinical_records').select('id').eq('appointment_id', appt.id);
        return data?.length;
      }, { timeout: 10000 }).toBeGreaterThan(0);

      // Now complete the appointment to clear the action
      await page.click('button:has-text("Complete & Checkout")');
      await page.waitForURL(new RegExp(`.*dashboard/appointments/${appt.id}.*`));

      // Verify action disappears on dashboard
      await page.goto('/dashboard');
      await page.reload();
      await expect(page.locator('section[aria-label="Global Action Center"]')).not.toContainText('Patient-Act3-Notes');
    } finally {
      await cleanupTestData([patient.id]);
    }
  });

  test('4. COMPLETE_TREATMENT: In progress treatment item -> Complete -> Disappears', async ({ page }) => {
    const patient = await createTestPatient(TENANT_SMILE, 'Patient-Act4-Treatment');
    const plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      name: 'Plan Act4'
    });
    const item = await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Extraction Act4',
      status: 'IN_PROGRESS'
    });

    try {
      await page.goto('/dashboard');
      const actionCenter = page.locator('section[aria-label="Global Action Center"]');
      await expect(actionCenter).toContainText('Patient-Act4-Treatment');
      await expect(actionCenter).toContainText('Extraction Act4');

      // Resolve via patient file
      await page.goto(`/dashboard/patients/${patient.id}#treatments`);
      const row = page.locator('li', { hasText: 'Extraction Act4' });
      await row.locator('svg.text-blue-500').click();

      // Verify DB
      await expect.poll(async () => {
        const { data } = await adminClient.from('treatment_items').select('status').eq('id', item.id).single();
        return data?.status;
      }, { timeout: 10000 }).toBe('COMPLETED');

      // Verify dashboard reflects resolution
      await page.goto('/dashboard');
      await page.reload();
      await expect(page.locator('section[aria-label="Global Action Center"]')).not.toContainText('Extraction Act4');
    } finally {
      await cleanupTestData([patient.id]);
    }
  });

  test('5. SCHEDULE_FOLLOWUP: Active plan with PLANNED item and no upcoming appt -> Action visible -> Book -> Action disappears', async ({ page }) => {
    const patient = await createTestPatient(TENANT_SMILE, 'Patient-Act5-Followup');
    const plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      name: 'Ortho Plan Act5'
    });
    await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Adjustment Act5',
      cost: 0,
      status: 'PLANNED'
    });

    try {
      await page.goto('/dashboard');
      const actionCenter = page.locator('section[aria-label="Global Action Center"]');
      await expect(actionCenter).toContainText('Patient-Act5-Followup');
      await expect(actionCenter).toContainText('Schedule Follow-up');

      // Book upcoming appointment to resolve
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      await createTestAppointment({
        tenantId: TENANT_SMILE,
        patientId: patient.id,
        status: 'SCHEDULED',
        scheduledStart: tomorrow.toISOString(),
        reason: 'Adjustment Act5 Followup'
      });

      // Refresh and verify action disappears
      await page.goto('/dashboard');
      await page.reload();
      await expect(page.locator('section[aria-label="Global Action Center"]')).not.toContainText('Patient-Act5-Followup');
    } finally {
      await cleanupTestData([patient.id]);
    }
  });

  test('6. COLLECT_PAYMENT: Outstanding balance -> Record payment -> Balance resolves', async ({ page }) => {
    const patient = await createTestPatient(TENANT_SMILE, 'Patient-Act6-Payment');
    const plan = await createTestTreatmentPlan({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      name: 'Plan Act6',
      status: 'COMPLETED'
    });
    await createTestTreatmentItem({
      planId: plan.id,
      procedure: 'Bleaching Act6',
      cost: 1500,
      status: 'COMPLETED'
    });

    try {
      await page.goto('/dashboard');
      const actionCenter = page.locator('section[aria-label="Global Action Center"]');
      await expect(actionCenter).toContainText('Patient-Act6-Payment');
      await expect(actionCenter).toContainText('Outstanding Balance');

      // Record payment in UI
      await page.goto(`/dashboard/patients/${patient.id}#payments`);
      await page.click('button:has-text("Record Payment")');
      await page.fill('input[placeholder="e.g. 5000"], input[type="number"]', '1500');
      await page.locator('div.sm\\:col-span-6 button:has-text("Record Payment")').click();

      // Verify payment in DB
      await expect.poll(async () => {
        const { data } = await adminClient.from('payments').select('id').eq('patient_id', patient.id);
        return data?.length;
      }, { timeout: 10000 }).toBeGreaterThan(0);

      // Verify action resolves on dashboard
      await page.goto('/dashboard');
      await page.reload();
      await expect(page.locator('section[aria-label="Global Action Center"]')).not.toContainText('Patient-Act6-Payment');
    } finally {
      await cleanupTestData([patient.id]);
    }
  });

  test('7. REVIEW_REFERRAL: Specialist referral with ADVANCE_PAID -> Appears -> Resolves when scheduled', async ({ page }) => {
    const patient = await createTestPatient(TENANT_SMILE, 'Patient-Act7-Referral');
    const ref = await createTestReferral({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      specialistName: 'Dr. Rao Act7',
      reason: 'Apicoectomy Act7',
      status: 'ADVANCE_PAID'
    });

    try {
      await page.goto('/dashboard');
      const actionCenter = page.locator('section[aria-label="Global Action Center"]');
      await expect(actionCenter).toContainText('Patient-Act7-Referral');
      await expect(actionCenter).toContainText('Dr. Rao Act7');

      // Update referral status to SCHEDULED in DB
      await adminClient.from('specialist_referrals').update({ status: 'SCHEDULED' }).eq('id', ref.id);

      // Refresh and verify action disappears
      await page.goto('/dashboard');
      await page.reload();
      await expect(page.locator('section[aria-label="Global Action Center"]')).not.toContainText('Dr. Rao Act7');
    } finally {
      await cleanupTestData([patient.id]);
    }
  });

  test('8. RESPOND_TO_BOOKING: Public web booking request -> Action visible -> Resolves on accept/reject', async ({ page }) => {
    const phone = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const req = await createTestBookingRequest({
      tenantId: TENANT_SMILE,
      name: 'Prospect-Act8',
      phone,
      reason: 'Wisdom Consult Act8'
    });

    try {
      await page.goto('/dashboard');
      const actionCenter = page.locator('section[aria-label="Global Action Center"]');
      await expect(actionCenter).toContainText('Prospect-Act8');
      await expect(actionCenter).toContainText('Wisdom Consult Act8');

      // Deep link clicks through to /dashboard/requests
      await actionCenter.locator('a[href*="/dashboard/requests"]').first().click();
      await page.waitForURL('/dashboard/requests');
      await expect(page.locator('text=Prospect-Act8')).toBeVisible();

      // Mark booking as CONVERTED in DB
      await adminClient.from('booking_requests').update({ status: 'CONVERTED' }).eq('id', req.id);

      // Refresh dashboard and verify action is resolved
      await page.goto('/dashboard');
      await page.reload();
      await expect(page.locator('section[aria-label="Global Action Center"]')).not.toContainText('Prospect-Act8');
    } finally {
      await adminClient.from('booking_requests').delete().eq('id', req.id);
    }
  });

  test('9. SET_RECALL: Visit completed > 6 months ago -> Recall action in Patient Command Centre -> Books appointment -> Resolves', async ({ page }) => {
    const patient = await createTestPatient(TENANT_SMILE, 'Patient-Act9-Recall');
    const eightMonthsAgo = new Date();
    eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);
    const eightMonthsAgoEnd = new Date(eightMonthsAgo.getTime() + 30 * 60000);

    const oldAppt = await createTestAppointment({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      status: 'COMPLETED',
      scheduledStart: eightMonthsAgo.toISOString(),
      scheduledEnd: eightMonthsAgoEnd.toISOString(),
      updatedAt: eightMonthsAgo.toISOString()
    });
    // Add clinical record so it does NOT generate COMPLETE_NOTES
    await createTestClinicalRecord({
      tenantId: TENANT_SMILE,
      patientId: patient.id,
      appointmentId: oldAppt.id
    });

    try {
      // Check Patient Command Centre
      await page.goto(`/dashboard/patients/${patient.id}`);
      await expect(page.getByRole('heading', { name: /Routine Recall/i })).toBeVisible();

      // Book upcoming appointment to resolve recall
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      await createTestAppointment({
        tenantId: TENANT_SMILE,
        patientId: patient.id,
        status: 'SCHEDULED',
        scheduledStart: futureDate.toISOString(),
        reason: 'Routine Cleaning Recall Act9'
      });

      // Refresh patient page and verify recall action is gone
      await page.goto(`/dashboard/patients/${patient.id}`);
      await expect(page.getByRole('heading', { name: /Routine Recall/i })).not.toBeVisible();
    } finally {
      await cleanupTestData([patient.id]);
    }
  });
});
