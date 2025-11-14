import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check if main header is visible
    await expect(page.locator('text=Slab Market').first()).toBeVisible();
    
    // Check if marketplace link exists
    await expect(page.locator('a[href="/marketplace"]')).toBeVisible();
  });

  test('should navigate to marketplace', async ({ page }) => {
    await page.goto('/');
    
    // Click marketplace link
    await page.click('a[href="/marketplace"]');
    
    // Wait for navigation
    await page.waitForURL('**/marketplace');
    
    // Check if we're on marketplace page
    expect(page.url()).toContain('/marketplace');
  });
});

test.describe('Authentication', () => {
  test('should show sign in page', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check if sign in form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show register page', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Check if register form is visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

test.describe('Marketplace', () => {
  test('should display marketplace page', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Check if page loads
    await expect(page.locator('text=Marketplace').first()).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Check if search input exists
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="szukaj" i]');
    await expect(searchInput.first()).toBeVisible();
  });
});

