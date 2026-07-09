import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const viewports = [
  { name: 'mobile-portrait-sm', width: 375, height: 667 },
  { name: 'mobile-portrait-md', width: 390, height: 844 },
  { name: 'tablet-portrait', width: 768, height: 1024 },
  { name: 'tablet-landscape', width: 1024, height: 768 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 }
];

const pages = [
  { name: 'landing', url: '/' },
  { name: 'try_calculator', url: '/try' },
  { name: 'login', url: '/login' },
  { name: 'signup', url: '/signup' }
];

test.describe('Responsive Layout checks', () => {
  // Ensure screenshot output directory exists
  const screenshotsDir = path.join(__dirname, 'screenshots', 'responsive');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  for (const vp of viewports) {
    for (const pageInfo of pages) {
      test(`Page [${pageInfo.name}] on viewport [${vp.name}: ${vp.width}x${vp.height}]`, async ({ page }) => {
        // Set viewport size
        await page.setViewportSize({ width: vp.width, height: vp.height });
        
        // Go to page
        await page.goto(pageInfo.url);
        
        // Wait for page to render fully
        await page.waitForTimeout(200);

        // Assert: No horizontal scrolling
        const overflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(overflow).toBe(false);

        // Take layout screenshot
        const screenshotPath = path.join(screenshotsDir, `${pageInfo.name}_${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: false });
      });
    }
  }
});
