import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () => {
  test('should show empty cart message when cart is empty', async ({ page }) => {
    await page.goto('/cart');
    
    // Check for empty cart message
    const emptyMessage = page.locator('text=/empty/i, text=/pusty/i').first();
    await expect(emptyMessage).toBeVisible();
  });

  test('should have link to marketplace from empty cart', async ({ page }) => {
    await page.goto('/cart');
    
    // Look for link to marketplace
    const marketplaceLink = page.locator('a[href="/marketplace"]').first();
    await expect(marketplaceLink).toBeVisible();
  });
});

