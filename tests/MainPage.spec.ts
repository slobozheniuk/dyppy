import { test, expect } from '@playwright/test';

test.describe('MainPage', () => {
  test('should display Header and search text box', async ({ page }) => {
    // Navigate to the main page
    await page.goto('/');

    // Wait for a little bit to let data load and render
    await page.waitForTimeout(2000); // adjust as necessary

    // Look for Header (assuming it has some distinguishing text or role)
    // Looking at common apps, header might contain "Super Smash Bros" or similar, or be an actual <header> tag
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Look for the search text box. Usually it's an input with type "search" or type "text" and placeholder "Search..."
    const searchInput = page.locator('input[type="text"]');
    await expect(searchInput).toBeVisible();

    // Take a screenshot of the whole page
    await expect(page).toHaveScreenshot('main-page.png', { fullPage: true });
  });
});
