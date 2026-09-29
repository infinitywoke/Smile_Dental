const fs = require('fs');
['e2e/actions-matrix.spec.ts', 'e2e/treatment-lifecycle.spec.ts'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/await page\.goto\('\/dashboard'\);\r?\n\s+await expect\(page\.locator\('section\[aria-label="Global Action Center"\]'\)\)\.not\.toContainText/g, "await page.goto('/dashboard');\n      await page.reload();\n      await expect(page.locator('section[aria-label=\"Global Action Center\"]')).not.toContainText");
  fs.writeFileSync(file, content);
  console.log('Fixed', file);
});
