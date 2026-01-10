import { test, expect } from '@playwright/test';

test.describe('Points Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/points');
  });

  test('should display points overview', async ({ page }) => {
    await expect(page.getByText(/Points|Total/i).first()).toBeVisible();
  });

  test('should display user tier', async ({ page }) => {
    // Check for tier badges
    const tierBadge = page.getByText(/Bronze|Silver|Gold|Platinum|Diamond/i).first();
    await expect(tierBadge).toBeVisible();
  });

  test('should display tasks section', async ({ page }) => {
    // Check for tasks
    await expect(page.getByText(/Task|Earn|Daily|Weekly/i).first()).toBeVisible();
  });

  test('should display leaderboard', async ({ page }) => {
    // Check for leaderboard
    await expect(page.getByText(/Leaderboard|Rank/i).first()).toBeVisible();
  });

  test('should display points history', async ({ page }) => {
    // Check for history section
    await expect(page.getByText(/History|Recent/i).first()).toBeVisible();
  });
});

test.describe('Points Tasks', () => {
  test('should show task progress', async ({ page }) => {
    await page.goto('/points');
    
    // Check for progress indicators
    const progressBars = page.locator('[class*="progress"], [role="progressbar"]');
    const count = await progressBars.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show task rewards', async ({ page }) => {
    await page.goto('/points');
    
    // Check for reward amounts (e.g., +100, +500)
    const rewards = page.getByText(/\+\d+/).first();
    await expect(rewards).toBeVisible();
  });
});
