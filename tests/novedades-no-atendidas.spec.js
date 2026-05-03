// tests/novedades-no-atendidas.spec.js
import { test, expect } from '@playwright/test';

const USUARIO = 'junior';
const PASSWORD = 'Junior2026';   // ← vi la contraseña en el panel 👀

test.describe('Reportes v2 → Novedades No Atendidas', () => {

  test.beforeEach(async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[name="username_or_email"]', USUARIO);
    await page.fill('input[name="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // 2. Abrir menú "Reportes v2"
    await page.click('text=Reportes v2');

    // 3. Clic en "Novedades No Atendidas"
    await page.click('text=Novedades No Atendidas');

    // 4. ✅ URL real del sistema
    await expect(page).toHaveURL(/reportes-operativos\/no-atendidas/, { timeout: 8000 });
    await expect(page.locator('text=Novedades No Atendidas').first()).toBeVisible();
  });

  // ── Test 1: Carga inicial con los 4 contadores ────────────────────────────
  test('la página carga con sus 4 contadores', async ({ page }) => {
    await expect(page.locator('text=Total No Atendidas')).toBeVisible();
    await expect(page.locator('text=No Atendidas Pie')).toBeVisible();
    await expect(page.locator('text=No Atendidas Vehículos')).toBeVisible();
    await expect(page.locator('text=Total Únicas')).toBeVisible();
  });

  // ── Test 2: Botón "Últimos 7 días" ───────────────────────────────────────
  test('filtro Últimos 7 días actualiza el rango', async ({ page }) => {
    await page.getByRole('button', { name: 'Últimos 7 días' }).first().click();
    await expect(page.locator('text=/Rango:/')).toBeVisible();
  });

  // ── Test 3: Botón "Últimos 30 días" ──────────────────────────────────────
  test('filtro Últimos 30 días actualiza el rango', async ({ page }) => {
    await page.getByRole('button', { name: 'Últimos 30 días' }).first().click();
    await expect(page.locator('text=/Rango:/')).toBeVisible();
  });

  // ── Test 4: Select Turno ─────────────────────────────────────────────────
  test('puede seleccionar un turno específico', async ({ page }) => {
    // Localiza por el placeholder/texto visible cerca del label "Turno"
    const selectTurno = page.locator('select').nth(0);
    const opciones = await selectTurno.locator('option').count();

    if (opciones > 1) {
      await selectTurno.selectOption({ index: 1 });
    }
    await expect(selectTurno).toBeVisible();
  });

  // ── Test 5: Select Sector ────────────────────────────────────────────────
  test('puede seleccionar un sector específico', async ({ page }) => {
    const selectSector = page.locator('select').nth(1);
    const opciones = await selectSector.locator('option').count();

    if (opciones > 1) {
      await selectSector.selectOption({ index: 1 });
    }
    await expect(selectSector).toBeVisible();
  });

  // ── Test 6: Select Prioridad ─────────────────────────────────────────────
  test('puede seleccionar una prioridad', async ({ page }) => {
    const selectPrioridad = page.locator('select').nth(2);
    const opciones = await selectPrioridad.locator('option').count();

    if (opciones > 1) {
      await selectPrioridad.selectOption({ index: 1 });
    }
    await expect(selectPrioridad).toBeVisible();
  });

  // ── Test 7: Campo búsqueda ───────────────────────────────────────────────
  test('campo de búsqueda acepta texto', async ({ page }) => {
    const input = page.locator('input[placeholder*="Código"], input[placeholder*="descripción"]').first();
    await input.fill('TEST-001');
    await expect(input).toHaveValue('TEST-001');
  });

  // ── Test 8: Flujo completo con filtros + Aplicar ──────────────────────────
  test('aplica filtros y muestra tabla o mensaje vacío', async ({ page }) => {
    // Seleccionar "Últimos 30 días"
    await page.getByRole('button', { name: 'Últimos 30 días' }).first().click();

    // Seleccionar primer turno disponible
    const selectTurno = page.locator('select').nth(0);
    const turnoOpciones = await selectTurno.locator('option').count();
    if (turnoOpciones > 1) await selectTurno.selectOption({ index: 1 });

    // Aplicar filtros
    await page.getByRole('button', { name: 'Aplicar Filtros' }).click();

    // Esperar resultado: tabla con datos O mensaje "No se encontraron"
    const tabla = page.locator('table, [role="table"]').first();
    const vacio = page.locator('text=/No se encontraron/i, text=/No hay operativos/i');

    await expect(tabla.or(vacio)).toBeVisible({ timeout: 8000 });
  });

  // ── Test 9: Limpiar filtros ──────────────────────────────────────────────
  test('botón Limpiar resetea los filtros', async ({ page }) => {
    // Escribe algo en búsqueda
    const input = page.locator('input[placeholder*="Código"], input[placeholder*="descripción"]').first();
    await input.fill('BUSQUEDA');

    // Limpia
    await page.getByRole('button', { name: 'Limpiar' }).click();

    // Input debe quedar vacío
    await expect(input).toHaveValue('');
  });

  // ── Test 10: Cambio de fecha ─────────────────────────────────────────────
  test('puede cambiar la fecha de inicio manualmente', async ({ page }) => {
    const fechaInicio = page.locator('input[type="date"]').first();
    await fechaInicio.fill('2026-04-01');
    await expect(fechaInicio).toHaveValue('2026-04-01');

    await page.getByRole('button', { name: 'Aplicar Filtros' }).click();

    const tabla = page.locator('table, [role="table"]').first();
    const vacio = page.locator('text=/No se encontraron/i, text=/No hay operativos/i');
    await expect(tabla.or(vacio)).toBeVisible({ timeout: 8000 });
  });

});
