const { test, expect } = require('@playwright/test');

test('edit patient', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'dr.ananya@smiledental.test');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
  
  await page.goto('http://localhost:3000/dashboard/patients');
  await expect(page).toHaveURL(/.*dashboard\/patients/);
  
  // click first patient
  await page.click('ul[role="list"] li a');
  
  // click edit
  await page.click('text="Edit"');
  
  await expect(page).toHaveURL(/.*dashboard\/patients\/.*\/edit/);
  
  // look for Edit Patient heading
  await expect(page.locator('h1', { hasText: 'Edit Patient' })).toBeVisible();
});
