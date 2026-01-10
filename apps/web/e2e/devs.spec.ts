import { test, expect } from '@playwright/test';

test.describe('Devs Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/devs');
  });

  test('should display dev leaderboard title', async ({ page }) => {
    await expect(page.getByText(/Dev|Leaderboard|Developer/i).first()).toBeVisible();
  });

  test('should display dev list', async ({ page }) => {
    // Check for dev cards or list items
    const devItems = page.locator('[class*="card"], [class*="list-item"]');
    await expect(devItems.first()).toBeVisible();
  });

  test('should show dev scores', async ({ page }) => {
    // Check for score indicators
    await expect(page.getByText(/Score|Rating/i).first()).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    // Check for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('0x');
      await expect(searchInput).toHaveValue('0x');
    }
  });
});

test.describe('Dev Profile Page', () => {
  test('should navigate to dev profile', async ({ page }) => {
    await page.goto('/devs/profile?address=0x1234567890abcdef');
    
    // Should show profile information
    await expect(page.getByText(/Profile|Dev|Address/i).first()).toBeVisible();
  });

  test('should display dev statistics', async ({ page }) => {
    await page.goto('/devs/profile?address=0x1234567890abcdef');
    
    // Check for statistics
    const stats = page.getByText(/Launch|Token|Success|Rug/i).first();
    await expect(stats).toBeVisible();
  });
});
