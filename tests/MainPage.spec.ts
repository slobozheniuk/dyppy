import { test, expect } from '@playwright/test';

test.describe('MainPage', () => {
  test('should display Header and search text box', async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');

    // Look for Header
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Look for the search text box. Wait for it to be visible.
    const searchInput = page.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();

    // Wait until network is idle so that components load
    await page.waitForLoadState('networkidle');

    // Take a screenshot of the whole page
    await expect(page).toHaveScreenshot('main-page.png', { fullPage: true, maxDiffPixelRatio: 0.1 });
  });
});
