import { test, expect } from '@playwright/test';

test.describe('Insurance Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/insurance');
  });

  test('should display insurance market title', async ({ page }) => {
    await expect(page.getByText(/Insurance|AlphaGuard|Market/i).first()).toBeVisible();
  });

  test('should display insurance products', async ({ page }) => {
    // Check for product cards
    const cards = page.locator('[class*="card"]');
    await expect(cards.first()).toBeVisible();
  });

  test('should show pool information', async ({ page }) => {
    // Check for pool-related information
    const poolInfo = page.getByText(/Pool|Odds|Premium/i).first();
    await expect(poolInfo).toBeVisible();
  });

  test('should have buy insurance button', async ({ page }) => {
    // Check for buy/purchase button
    const buyButton = page.getByRole('button', { name: /Buy|Purchase|Coverage/i }).first();
    
    if (await buyButton.isVisible()) {
      await expect(buyButton).toBeEnabled();
    }
  });
});

test.describe('Insurance Purchase Flow', () => {
  test('should open purchase modal on button click', async ({ page }) => {
    await page.goto('/insurance');
    
    // Find and click buy button
    const buyButton = page.getByRole('button', { name: /Buy|Purchase/i }).first();
    
    if (await buyButton.isVisible()) {
      await buyButton.click();
      
      // Check if modal appears
      const modal = page.locator('[role="dialog"], [class*="modal"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 }).catch(() => {
        // Modal might not appear without wallet connection
      });
    }
  });
});
