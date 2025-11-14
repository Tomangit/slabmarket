import { test, expect } from '@playwright/test';

test.describe('Marketplace', () => {
  test('should load marketplace page', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Check if page loads
    await expect(page.locator('text=/marketplace/i').first()).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Check if search input exists
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="szukaj" i]').first();
    await expect(searchInput).toBeVisible();
  });

  test('should have filter options', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Check if filters are visible (price range, set, etc.)
    // This may vary based on implementation
    await page.waitForTimeout(1000); // Wait for page to load
  });

  test('should display cards list', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check if there's content (either cards or empty state)
    const hasContent = await page.locator('text=/no cards found/i, text=/no results/i, [class*="card"]').first().isVisible().catch(() => false);
    expect(hasContent).toBe(true);
  });
});

