// tests/login.spec.js
import { test, expect } from '@playwright/test';

// ─── Credenciales de prueba ───────────────────────────────────────────────────
const USUARIO_VALIDO = 'junior';      // ← cambia por tu usuario real
const PASSWORD_VALIDO = 'Junior2026';   // ← cambia por tu password real

test.describe('Login CitySecure', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  // ✅ Login exitoso
  test('login exitoso redirige al dashboard', async ({ page }) => {
    await page.fill('input[name="username_or_email"]', USUARIO_VALIDO);
    await page.fill('input[name="password"]', PASSWORD_VALIDO);
    await page.click('button[type="submit"]');

    // Espera el toast de bienvenida
    await expect(page.locator('.react-hot-toast, [data-hot-toast]').first()).toBeVisible({ timeout: 5000 });

    // Verifica redirección al dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
  });

  // ❌ Credenciales incorrectas → toast de error
  test('credenciales incorrectas muestra toast de error', async ({ page }) => {
    await page.fill('input[name="username_or_email"]', 'usuariofalso');
    await page.fill('input[name="password"]', 'passwordmalo123');
    await page.click('button[type="submit"]');

    // El toast de error debe aparecer
    const toast = page.locator('div[id^="react-hot-toast"], [data-hot-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  // ❌ Validación Zod: campos vacíos
  test('campos vacíos muestran errores de validación', async ({ page }) => {
    await page.click('button[type="submit"]');

    // Los mensajes de error de Zod aparecen como <p class="...text-red-600">
    const errores = page.locator('p.text-red-600');
    await expect(errores).toHaveCount(2); // username_or_email + password
    await expect(errores.first()).toHaveText('Requerido');
  });

  // 🔒 Botón ojo requiere usuario y password primero
  test('toggle password sin datos muestra toast de aviso', async ({ page }) => {
    // Click en el ojo sin haber escrito nada
    await page.click('button[aria-label="Mostrar contraseña"]');

    const toast = page.locator('div[id^="react-hot-toast"], [data-hot-toast]').first();
    await expect(toast).toBeVisible({ timeout: 3000 });
    await expect(toast).toContainText('usuario');
  });

  // 🔄 Botón submit muestra "Ingresando…" mientras carga
  test('botón muestra estado de carga al enviar', async ({ page }) => {
    await page.fill('input[name="username_or_email"]', USUARIO_VALIDO);
    await page.fill('input[name="password"]', PASSWORD_VALIDO);

    // Click y verificar el texto de carga inmediatamente
    await page.click('button[type="submit"]');
    await expect(page.locator('button[type="submit"]')).toHaveText('Ingresando…');
  });

});