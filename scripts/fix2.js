const fs = require('fs');
['e2e/treatment-lifecycle.spec.ts'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/await page\.goto\('\/dashboard'\);\r?\n\s+const actionCenter = page\.locator\('section\[aria-label="Global Action Center"\]'\);\r?\n\s+await expect/g, "await page.goto('/dashboard');\n      await page.reload();\n      const actionCenter = page.locator('section[aria-label=\"Global Action Center\"]');\n      await expect");
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
