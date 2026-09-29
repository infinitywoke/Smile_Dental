import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createTestPatient, createTestAppointment, cleanupTestData, TENANT_SMILE } from './helpers/testDb';
import * as crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

test.describe('Phase 6 — UI Workflow Acceptance Gate', () => {
  let p1: any;

  test.beforeEach(async ({ page }) => {
    p1 = await createTestPatient(TENANT_SMILE, 'P6-UI-Patient');
    await page.goto('/login');
    await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test.afterEach(async () => {
    await cleanupTestData([p1.id]);
  });

  test('Create appointment via form', async ({ page }) => {
    // Navigate to new appointment page
    await page.goto(`/dashboard/appointments/new?patientId=${p1.id}`);
    
    // Wait for form to load
    await expect(page.locator('#reason')).toBeVisible();
    
    // Fill form fields
    await page.selectOption('#patient_id', p1.id);
    await page.fill('#reason', 'Phase 6 Test Visit');
    
    // Use a date far in the future to avoid collisions
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    futureDate.setMonth(0);
    futureDate.setDate(15);
    await page.fill('#date', futureDate.toISOString().split('T')[0]);
    await page.fill('#start_time', '10:00');
    await page.fill('#end_time', '11:00');
    
    await page.click('button:has-text("Save Appointment")');
    
    // After successful creation, the server action redirects to appointment detail page
    await page.waitForURL(/.*\/appointments\/[0-9a-f-]+$/, { timeout: 15000 });
    await expect(page.locator('text=Phase 6 Test Visit')).toBeVisible();
    await expect(page.locator('text=Check In')).toBeVisible();
  });

  test('Check In and Start Visit progression', async ({ page }) => {
    // Pre-create an appointment via DB
    const appt = await createTestAppointment({
      tenantId: TENANT_SMILE,
      patientId: p1.id,
      status: 'SCHEDULED'
    });

    await page.goto(`/dashboard/appointments/${appt.id}`);
    await expect(page.locator('text=Check In')).toBeVisible();

    // Check In
    await page.locator('button:has-text("Check In")').click();
    // After revalidation, Start Visit button should appear
    await expect(page.locator('text=Start Visit')).toBeVisible({ timeout: 10000 });
  });

  test('Edit/Reschedule link navigates to edit page', async ({ page }) => {
    const appt = await createTestAppointment({
      tenantId: TENANT_SMILE,
      patientId: p1.id,
      status: 'SCHEDULED'
    });

    await page.goto(`/dashboard/appointments/${appt.id}`);
    
    // Click Edit / Reschedule link
    await page.locator('a:has-text("Edit / Reschedule")').click();
    await expect(page).toHaveURL(new RegExp(`.*/appointments/${appt.id}/edit`));
    
    // Verify the form loads with appointment data
    await expect(page.locator('#reason')).toBeVisible();
  });

  test('Stale-state recovery shows alert', async ({ page }) => {
    const appt = await createTestAppointment({
      tenantId: TENANT_SMILE,
      patientId: p1.id,
      status: 'SCHEDULED'
    });

    await page.goto(`/dashboard/appointments/${appt.id}`);
    await expect(page.locator('text=Check In')).toBeVisible();
    
    // Simulate concurrent DB change AFTER the page loaded (stale updated_at)
    await supabase.from('appointments').update({ status: 'CONFIRMED' }).eq('id', appt.id);

    // Intercept the alert dialog
    let alertText = '';
    page.on('dialog', async dialog => {
      alertText = dialog.message();
      await dialog.accept();
    });

    // Click Check In with stale updatedAt
    await page.locator('button:has-text("Check In")').click();

    // The server action should detect the stale updated_at and return an error alert
    await expect.poll(() => alertText, { timeout: 10000 }).toContain('modified by another user');
  });

  test('Cancel appointment shows confirmation and updates', async ({ page }) => {
    const appt = await createTestAppointment({
      tenantId: TENANT_SMILE,
      patientId: p1.id,
      status: 'SCHEDULED'
    });

    await page.goto(`/dashboard/appointments/${appt.id}`);
    
    // Accept the confirm dialog
    page.on('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.locator('button:has-text("Cancel")').first().click();
    
    // After cancellation, the action buttons should disappear (no Check In, no Cancel visible)
    // The page revalidates showing the appointment without active action buttons
    await expect(page.locator('button:has-text("Check In")')).not.toBeVisible({ timeout: 10000 });
    
    // Verify in DB that status is CANCELLED
    const { data } = await supabase.from('appointments').select('status').eq('id', appt.id).single();
    expect(data?.status).toBe('CANCELLED');
  });
});
