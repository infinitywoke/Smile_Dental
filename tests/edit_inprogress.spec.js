import { test, expect } from '@playwright/test';

test('edit in_progress appointment', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'admin@smiledental.local');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  // Go to appointments
  await page.goto('http://localhost:3000/dashboard/appointments');
  
  // Create an appointment first
  await page.goto('http://localhost:3000/dashboard/appointments/new');
  // Select first patient
  await page.selectOption('select[name="patient_id"]', { index: 1 });
  await page.fill('input[name="date"]', '2026-10-10');
  await page.fill('input[name="start_time"]', '10:00');
  await page.fill('input[name="end_time"]', '11:00');
  await page.fill('input[name="reason"]', 'Test inprogress edit');
  await page.click('button[type="submit"]');
  
  // Wait for redirect to appointment details
  await page.waitForURL('**/dashboard/appointments/*');
  
  // Check in
  await page.click('button:has-text("Check In")');
  await page.waitForTimeout(500); // wait for state
  
  // The status is now CHECKED_IN. Let's start visit to make it IN_PROGRESS
  await page.click('a:has-text("Start Visit")');
  await page.waitForURL('**/consultation');
  
  // Save consultation (this sets it to IN_PROGRESS)
  await page.click('button:has-text("Save Consultation & Continue")');
  await page.waitForURL('**/dashboard/appointments/*');
  
  // Now edit it
  await page.click('a:has-text("Reschedule / Edit")');
  await page.waitForURL('**/edit');
  
  // Change time
  await page.fill('input[name="start_time"]', '12:00');
  await page.fill('input[name="end_time"]', '13:00');
  await page.click('button[type="submit"]');
  
  // Wait for it
  await page.waitForURL('**/dashboard/appointments/*');
  
  // Check if it's updated
  const text = await page.textContent('body');
  expect(text).toContain('12:00 PM');
});
