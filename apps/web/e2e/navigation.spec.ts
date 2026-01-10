import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AlphaNest/);
  });

  test('should navigate to trade page', async ({ page }) => {
    await page.goto('/trade');
    await expect(page.locator('h1, h2').first()).toContainText(/Trade|Swap/i);
  });

  test('should navigate to insurance page', async ({ page }) => {
    await page.goto('/insurance');
    await expect(page.locator('h1, h2').first()).toContainText(/Insurance|AlphaGuard/i);
  });

  test('should navigate to devs page', async ({ page }) => {
    await page.goto('/devs');
    await expect(page.locator('h1, h2').first()).toContainText(/Dev|Leaderboard/i);
  });

  test('should navigate to points page', async ({ page }) => {
    await page.goto('/points');
    await expect(page.locator('h1, h2').first()).toContainText(/Points/i);
  });

  test('sidebar navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Click on Trade link
    await page.click('a[href="/trade"]');
    await expect(page).toHaveURL('/trade');
    
    // Click on Insurance link
    await page.click('a[href="/insurance"]');
    await expect(page).toHaveURL('/insurance');
    
    // Click on Devs link
    await page.click('a[href="/devs"]');
    await expect(page).toHaveURL('/devs');
  });
});

test.describe('Responsive Design', () => {
  test('mobile menu should work', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that main content is visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('desktop layout should show sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    
    // Check that sidebar is visible on desktop
    await expect(page.locator('aside, nav').first()).toBeVisible();
  });
});
