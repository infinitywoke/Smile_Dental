const { test, expect } = require('@playwright/test');

test('assistant access', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"]', 'priya.assistant@smiledental.test');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/.*dashboard/);
  
  await page.goto('http://localhost:3000/dashboard/patients');
  await expect(page).toHaveURL(/.*dashboard\/patients/);
});
