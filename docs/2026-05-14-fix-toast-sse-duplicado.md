# Fix: Toast SSE duplicado en creación interna de novedades

**Fecha:** 2026-05-14  
**Tipo:** Bug Fix  
**Módulo:** Novedades — Notificaciones en tiempo real (SSE)  
**Archivo modificado:** `src/pages/novedades/NovedadesPage.jsx`

---

## Problema

Cuando un operador creaba una novedad desde el **formulario completo** de registro, aparecían dos toasts simultáneamente:

1. **Toast verde** ✅ `toast.success("Novedad XXXXXX creada exitosamente")` — confirmación de la respuesta HTTP
2. **Toast rojo** 🚨 `"Nueva Novedad Recibida"` — alerta SSE pensada para novedades del voice gateway externo

El operador veía ambas notificaciones, lo que generaba confusión ya que el toast rojo estaba reservado para indicar novedades entrantes desde canales externos (WhatsApp, Telegram, App Móvil via `city_sec_voice_gateway`).

---

## Causa Raíz

En `NovedadesPage.jsx` existían dos refs de guardia para suprimir el toast SSE:

| Ref | Propósito | ¿Se leía en el callback SSE? |
|-----|-----------|------------------------------|
| `isCreatingManually` | Activado **antes** del `await createNovedad()` para cubrir la race condition | ❌ **Nunca se comprobaba** |
| `justCreatedNovedad` | Activado **después** de recibir la respuesta HTTP (10s de ventana) | ✅ Sí |

El flag `isCreatingManually` fue diseñado exactamente para resolver la race condition (el SSE del backend llega antes que la respuesta HTTP porque viajan por conexiones TCP distintas), pero **la condición `if (isCreatingManually.current) return;` nunca fue añadida** al callback `handleNuevaNovedad`.

**Secuencia del bug (form completo):**
```
1. isCreatingManually.current = true     ← línea 2418 (ANTES del await)
2. await createNovedad() → backend crea novedad y emite SSE (al mismo tiempo)
3. SSE llega al cliente  → handleNuevaNovedad() → no comprueba isCreatingManually → 🚨 TOAST SSE
4. Respuesta HTTP llega  → justCreatedNovedad.current = { id } → ✅ TOAST VERDE
   Resultado: 2 toasts (bug)
```

---

## Solución Aplicada

### Cambio 1 — Guard en `handleNuevaNovedad` (línea ~644)

Se añadió la comprobación de `isCreatingManually.current` al inicio del callback SSE, inmediatamente después del check de duplicado por ID:

```js
// AÑADIDO:
if (isCreatingManually.current) {
  console.log("[SSE] Creación manual en curso - suprimiendo toast SSE:", novedad.id);
  return;
}
```

Este guard actúa **durante** la petición HTTP (desde antes del `await` hasta que el backend responde), cubriendo el escenario de race condition donde el SSE llega antes que la respuesta HTTP.

### Cambio 2 — Eliminar `isCreatingManually` del form rápido (líneas 1368 y 1425)

El **formulario rápido** (quick form) usa intencionalmente el toast SSE como feedback de confirmación al creador (el toast verde fue eliminado de esa rama). Por tanto, el form rápido **no debe activar** el flag `isCreatingManually`.

Se eliminaron:
- `isCreatingManually.current = true;` (antes del await del form rápido)
- `setTimeout(() => { isCreatingManually.current = false; }, 3000);` (en el finally del form rápido)

El **formulario completo** mantiene sus líneas equivalentes (2418 y 2444) intactas.

---

## Comportamiento Resultante

| Escenario | `isCreatingManually` activo | Toast SSE 🚨 | Toast verde ✅ |
|-----------|-----------------------------|-------------|----------------|
| **Form completo** crea novedad | ✅ Sí | ❌ Suprimido | ✅ Aparece |
| **Form rápido** crea novedad | ❌ No | ✅ Aparece (como antes) | ❌ (eliminado intencionalmente) |
| **Voice Gateway** (BOT/WhatsApp) | ❌ No | ✅ Aparece | — |
| **Otro usuario** interno crea | ❌ No | ✅ Aparece | — |

---

## Cambios Adicionales en Esta Sesión

### ESLint — Corrección del script `lint` en `package.json`

El comando `eslint . --ignore-path .gitignore` era incompatible con ESLint 9 (flat config). Se actualizó a `eslint .`.

### ESLint — Globals de Node.js para archivos de configuración

Se añadió en `eslint.config.js` una entrada específica para archivos de configuración del proyecto (`playwright.config.js`, `vite.config.js`, etc.) con `globals.node` para evitar el error `'process' is not defined`.

### Triggers MySQL — Fix `DEFINER='root'@'%'` (Backend)

Al reinstalar Windows/MySQL, 8 triggers de la BD `citizen_security` tenían `DEFINER='root'@'%'` (usuario inexistente en la nueva instalación). Se recrearon todos con `DEFINER='root'@'localhost'` mediante el script `migrations/fix_definer_triggers.sql` en el repositorio del backend.

**Triggers corregidos:**
- `trg_historial_estado_novedades_calcular_lapso_minutos`
- `trg_calcular_tiempo_respuesta`
- `trg_calcular_tiempo_respuesta_operativo`
- `trg_direcciones_completa_insert`
- `trg_direcciones_completa_update`
- `trg_actualizar_dias_inoperativos`
- `trg_mantenimiento_correctivo_insert`
- `trg_mantenimiento_finalizado`

### PRD del Proyecto

Se creó `PRD.md` en la raíz del proyecto con la documentación completa del sistema CitySecure (módulos, API, stack tecnológico, requisitos no funcionales, despliegue).

---

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/pages/novedades/NovedadesPage.jsx` | Bug fix: guard `isCreatingManually` en callback SSE; eliminar flag del form rápido |
| `package.json` | Fix script `lint` para ESLint 9 |
| `eslint.config.js` | Añadir globals Node.js para archivos de configuración |
| `docs/2026-05-14-fix-toast-sse-duplicado.md` | Este informe |
| `PRD.md` | Documento nuevo (Product Requirements Document) |

---

## Testing

1. **Form completo** → crear novedad → solo aparece toast verde ✅, sin toast SSE
2. **Form rápido** → crear novedad → aparece toast SSE 🚨 como confirmación
3. **Voice Gateway** envía novedad → operador conectado ve toast SSE 🚨
4. **2 sesiones simultáneas** → usuario A crea (form completo) → usuario B ve 🚨, usuario A solo ve ✅
