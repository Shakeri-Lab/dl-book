import path from 'node:path'; import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/Users/hs9hd/Library/CloudStorage/Box-Box/Teaching/6050/Video_lectures/package.json');
const { chromium } = require('playwright');
const dir = process.argv[2];
const files = process.argv.slice(3);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1160, height: 1000 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', e => errs.push(e.message));
for (const f of files) {
  await page.goto(`file://${path.join(dir, f)}`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.MathJax && window.MathJax.startup && window.MathJax.startup.promise, null, { timeout: 30000 });
  await page.evaluate(() => window.MathJax.startup.promise);
  await page.waitForTimeout(400);
  const out = path.join(dir, f.replace('.html', '.png'));
  await page.locator('.card').screenshot({ path: out });
  console.log(out);
}
if (errs.length) console.error('ERRORS', errs);
await browser.close();
