// tests/forgot-password.spec.js
import { test, expect } from '@playwright/test';

// ─── Datos de prueba ──────────────────────────────────────────────────────────
const EMAIL_REGISTRADO = 'romily.robles1@gmail.com'; // usuario real en la BD
const EMAIL_NO_EXISTE  = 'noexiste@citysecure.test';  // nunca registrado

test.describe('Recuperación de contraseña — /forgot-password', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
    // La página carga con el formulario vacío
    await expect(page.locator('h1')).toHaveText('Recuperar contraseña');
  });

  // ✅ Flujo completo: email registrado → pantalla de confirmación
  test('flujo completo: email registrado muestra pantalla de confirmación', async ({ page }) => {
    // 1. Ingresar email
    await page.fill('input[type="email"]', EMAIL_REGISTRADO);

    // 2. Enviar formulario
    await page.click('button[type="submit"]');

    // 3. La pantalla de confirmación aparece con el título correcto
    await expect(page.locator('text=Revisa tu email')).toBeVisible({ timeout: 12000 });

    // 4. El email ingresado aparece en el mensaje de confirmación
    await expect(page.locator(`text=${EMAIL_REGISTRADO}`)).toBeVisible();

    // 5. El link de retorno al login está disponible
    await expect(page.getByRole('link', { name: /Volver al login/i })).toBeVisible();

    // 6. El formulario ya no es visible (fue reemplazado por la confirmación)
    await expect(page.locator('button[type="submit"]')).not.toBeVisible();
  });

  // ✅ Email no existente → también muestra confirmación (seguridad: no revela si el email existe)
  test('email no registrado también muestra confirmación por seguridad', async ({ page }) => {
    await page.fill('input[type="email"]', EMAIL_NO_EXISTE);
    await page.click('button[type="submit"]');

    // El backend siempre responde con éxito aunque el email no exista
    await expect(page.locator('text=Revisa tu email')).toBeVisible({ timeout: 12000 });
  });

  // ❌ Campo vacío → toast de error, no avanza
  test('campo vacío muestra toast de error y no avanza', async ({ page }) => {
    // Clic sin ingresar email
    await page.click('button[type="submit"]');

    // Aparece toast de error
    const toast = page.locator('div[id^="react-hot-toast"], [data-hot-toast]').first();
    await expect(toast).toBeVisible({ timeout: 3000 });
    await expect(toast).toContainText('email');

    // El formulario sigue visible (no avanzó a la confirmación)
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('text=Revisa tu email')).not.toBeVisible();
  });

  // 🔄 Botón muestra estado de carga "Enviando..." mientras procesa
  test('botón muestra "Enviando..." mientras la petición está en vuelo', async ({ page }) => {
    await page.fill('input[type="email"]', EMAIL_REGISTRADO);

    // Click y verificar el texto de carga inmediatamente
    await page.click('button[type="submit"]');
    await expect(page.locator('button[type="submit"]')).toHaveText('Enviando...');
  });

  // 🔗 Link "Volver al login" en el formulario navega a /login
  test('link "Volver al login" navega correctamente a /login', async ({ page }) => {
    await page.getByRole('link', { name: /Volver al login/i }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  // 🔗 Link "Volver al login" en la confirmación también navega a /login
  test('link de regreso en pantalla de confirmación navega a /login', async ({ page }) => {
    // Llegar a la pantalla de confirmación
    await page.fill('input[type="email"]', EMAIL_REGISTRADO);
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Revisa tu email')).toBeVisible({ timeout: 12000 });

    // Clic en el link de la confirmación
    await page.getByRole('link', { name: /Volver al login/i }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

});
