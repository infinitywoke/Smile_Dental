const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  console.log('--- RUNNING DESKTOP SMOKE TEST ---');
  const desktopContext = await browser.newContext();
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('https://smile-dental-dusky.vercel.app/');
  console.log('Title:', await desktopPage.title());
  await desktopPage.goto('https://smile-dental-dusky.vercel.app/login');
  const hasLoginForm = await desktopPage.locator('input[type="email"]').isVisible();
  console.log('Has Login Form:', hasLoginForm);

  console.log('--- RUNNING MOBILE SMOKE TEST ---');
  const mobileContext = await browser.newContext({ ...devices['Pixel 5'] });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('https://smile-dental-dusky.vercel.app/');
  console.log('Mobile Title:', await mobilePage.title());
  await browser.close();
  console.log('Smoke Test Completed Successfully');
})();
