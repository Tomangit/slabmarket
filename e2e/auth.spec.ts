import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/');
    
    // Click sign in button
    const signInButton = page.locator('text=/sign in/i').first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.waitForURL('**/auth/signin');
      expect(page.url()).toContain('/auth/signin');
    }
  });

  test('should show sign in form', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Look for register link
    const registerLink = page.locator('a[href*="register"], text=/register/i').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await page.waitForURL('**/auth/register');
      expect(page.url()).toContain('/auth/register');
    }
  });

  test('should show register form', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

