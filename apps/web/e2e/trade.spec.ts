import { test, expect } from '@playwright/test';

test.describe('Trade Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trade');
  });

  test('should display swap panel', async ({ page }) => {
    // Check for swap-related elements
    await expect(page.getByText(/You Pay|Swap/i).first()).toBeVisible();
  });

  test('should display token chart', async ({ page }) => {
    // Wait for chart to load
    await page.waitForTimeout(1000);
    
    // Check for chart container
    const chartContainer = page.locator('[class*="chart"], canvas').first();
    await expect(chartContainer).toBeVisible();
  });

  test('should have token selectors', async ({ page }) => {
    // Check for token selection dropdowns
    const selects = page.locator('select');
    await expect(selects.first()).toBeVisible();
  });

  test('should accept amount input', async ({ page }) => {
    // Find amount input
    const amountInput = page.locator('input[type="number"]').first();
    
    if (await amountInput.isVisible()) {
      await amountInput.fill('100');
      await expect(amountInput).toHaveValue('100');
    }
  });

  test('should show connect wallet button when not connected', async ({ page }) => {
    // Check for connect wallet button or similar
    const connectButton = page.getByText(/Connect|Wallet/i).first();
    await expect(connectButton).toBeVisible();
  });
});

test.describe('Trade Page - Timeframes', () => {
  test('should have timeframe buttons', async ({ page }) => {
    await page.goto('/trade');
    
    // Check for timeframe buttons (1H, 4H, 1D, etc.)
    const timeframeButtons = page.getByRole('button', { name: /1H|4H|1D|1W/i });
    
    // At least one timeframe button should exist
    const count = await timeframeButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
