// tests/login.spec.js
import { test, expect } from '@playwright/test';

test('login exitoso redirige al dashboard', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="email"]', 'junior');
  await page.fill('input[name="password"]', 'Junior2026');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});

test('login con credenciales incorrectas muestra error', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="email"]', 'malo@test.com');
  await page.fill('input[name="password"]', 'wrongpass');
  await page.click('button[type="submit"]');

  await expect(page.locator('[role="alert"]')).toBeVisible();
});