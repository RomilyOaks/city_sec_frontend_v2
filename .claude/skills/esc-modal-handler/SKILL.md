---
name: esc-modal-handler
description: >
  Guía para implementar y depurar el manejo correcto de la tecla ESC en modales
  de CitySecure. Usar SIEMPRE que el usuario reporte que ESC no cierra un modal,
  que ESC navega hacia atrás en lugar de cerrar el modal activo, que presionar ESC
  causa un crash (ReferenceError / TDZ), o cuando se pida agregar soporte ESC a un
  nuevo modal o panel lateral. También usar al revisar componentes con múltiples
  modales en cadena (modal dentro de panel dentro de página).
---

# CitySecure — Manejo correcto de ESC en modales

## El problema raíz en este proyecto

CitySecure tiene páginas con **capas de modales en cadena**:

```
Página (panel A)
  └─ Panel intermedio (ej. NovedadesPorCuadrante / NovedadesPersonalModal)
       ├─ Modal de edición   (showEditModal)
       ├─ Modal de detalle   (viewingNovedad)
       ├─ Modal de borrado   (showDeleteModal / deletingNovedad)
       └─ Modal Eye          (showEyeModal)  ← el más olvidado
```

Cada capa tiene su propio listener `document.addEventListener("keydown", …, true)`.
El que se registra **primero** (el padre) dispara antes, llama `stopPropagation()`,
y los hijos nunca reciben el evento.

---

## Regla 1 — Cadena de prioridades ESC (orden obligatorio)

Cuando un panel intermedio maneja ESC con `document.addEventListener`, la cadena
debe cerrar modales de mayor a menor profundidad **antes** de navegar hacia atrás:

```js
if (event.key === "Escape") {
  event.preventDefault();
  event.stopPropagation();

  // Prioridad 1: modal más profundo primero (Eye, confirmación, etc.)
  if (showEyeModal) {
    setShowEyeModal(false);
    setSelectedEyeOperativo(null);  // inline — ver Regla 3
    return;
  }

  // Prioridad 2: modal de edición
  if (showEditModal) {
    handleCloseEditModal();
    return;
  }

  // Prioridad 3: modal de detalle/view
  if (viewingNovedad) {
    handleCloseViewModal();
    return;
  }

  // Prioridad 4: modal de confirmación de borrado
  if (deletingNovedad) {
    cancelDeleteNovedad();
    return;
  }

  // Última prioridad: navegar hacia atrás
  handleBack();   // o onClose() si es un modal
}
```

**Síntoma cuando falta una prioridad:** ESC salta directo a `handleBack()` aunque
haya un modal abierto, porque ninguna condición anterior coincide.

---

## Regla 2 — Dependencias del useEffect

Todos los estados y handlers usados **dentro** del callback o en el **array de deps**
deben incluirse en ese array:

```js
useEffect(() => {
  const handleKeyDown = (event) => { … };
  document.addEventListener("keydown", handleKeyDown, true);
  return () => document.removeEventListener("keydown", handleKeyDown, true);
}, [
  handleBack,
  showEyeModal,           // ← agregar cuando se añade la prioridad Eye
  showEditModal,
  handleCloseEditModal,
  viewingNovedad,
  handleCloseViewModal,
  deletingNovedad,
  cancelDeleteNovedad,
]);
```

---

## Regla 3 — NUNCA referenciar un useCallback definido después del useEffect (TDZ)

### El crash

```
Uncaught ReferenceError: Cannot access 'X' before initialization
```

Ocurre cuando:
1. `useEffect(callback, [deps])` está en la **línea N**
2. El array de deps incluye `handleCloseEyeModal`
3. `handleCloseEyeModal = useCallback(…)` está en la **línea N+400**

Durante el render, React evalúa `[deps]` en la línea N. El `const` de línea N+400
aún no existe → **TDZ crash**.

### La solución: inlinear los setters de estado

Los setters de `useState` son referencias estables (no cambian entre renders).
Siempre están disponibles desde la primera línea del componente:

```js
// ✅ CORRECTO — inlinear setters, no referenciar el useCallback tardío
if (showEyeModal) {
  setShowEyeModal(false);
  setSelectedEyeOperativo(null);
  return;
}

// ❌ INCORRECTO — handleCloseEyeModal definido 400 líneas después
if (showEyeModal) {
  handleCloseEyeModal();   // TDZ crash en producción (minificado)
  return;
}
```

Los setters de estado pueden aparecer en el array de deps sin riesgo:

```js
}, [
  showEyeModal,
  setSelectedEyeOperativo,   // ✅ setter estable, no causa TDZ
  …
]);
```

---

## Regla 4 — Modales propios vs. panel padre (capture phase)

Cuando un modal tiene su **propio** handler de ESC interno (ej. `EyeVehiculoModal.jsx`):

```js
// Dentro del modal:
document.addEventListener("keydown", handleKeyDown, true);
```

Y el panel padre también tiene su handler con capture:

```js
// Dentro del panel:
document.addEventListener("keydown", handleKeyDown, true);
```

El **padre** siempre gana porque se registra antes (el modal se monta después).
`stopPropagation()` en el padre impide que el modal reciba el evento.

**Consecuencia:** el handler ESC interno del modal nunca llega a ejecutarse.
**Solución:** el padre maneja el cierre del modal via estado (`showXModal`), no
depender del handler interno del modal para esta lógica.

---

## Regla 5 — Modales simples (sin panel padre con ESC propio)

Para modales que no tienen un padre que intercepte ESC, el patrón estándar es:

```js
// Dentro del modal:
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [onClose]);
```

Usar `window` (no `document`) y sin capture (`true`) es suficiente aquí.
Solo usar `document + capture` cuando el componente necesita interceptar ANTES
que sus hijos.

---

## Checklist de diagnóstico ESC

Cuando ESC no funciona como se espera:

- [ ] ¿Hay un panel padre con `document.addEventListener(…, true)` que intercepta antes?
- [ ] ¿La cadena de prioridades en el padre incluye **todos** los modales hijos?
- [ ] ¿El modal que falta en la cadena tiene un estado booleano (`showXModal`)?
- [ ] ¿Algún handler referencia un `useCallback` definido después del `useEffect`? (TDZ)
- [ ] Si es TDZ: ¿se puede reemplazar la llamada con los setters de estado directamente?
- [ ] ¿El array de deps del `useEffect` está completo con los nuevos estados/handlers?

---

## Archivos de referencia en CitySecure

| Archivo | Patrón implementado |
|---|---|
| `src/pages/operativos/vehiculos/NovedadesPorCuadrante.jsx` | Cadena de 5 prioridades + ESC panel vehicular |
| `src/pages/operativos/personal/NovedadesPersonalModal.jsx` | Cadena con inline setters (corrección TDZ) |
| `src/pages/operativos/vehiculos/EyeVehiculoModal.jsx` | Handler ESC interno (subordinado al padre) |
| `src/pages/novedades/NovedadesPage.jsx` | Modales independientes con `window + bubble` |

---

## Ejemplo completo — panel intermedio con Eye modal

```jsx
// En el componente panel (ej. NovedadesPorCuadrante.jsx)

// Estados
const [showEyeModal, setShowEyeModal]             = useState(false);
const [selectedEyeOperativo, setSelectedEyeOperativo] = useState(null);
const [showEditModal, setShowEditModal]            = useState(false);
const [viewingNovedad, setViewingNovedad]          = useState(null);
const [deletingNovedad, setDeletingNovedad]        = useState(null);

// Handler ESC — TODOS los estados usados están definidos ANTES de este useEffect
useEffect(() => {
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();

      if (showEyeModal) {
        setShowEyeModal(false);          // inlinear — evita TDZ
        setSelectedEyeOperativo(null);   // inlinear — evita TDZ
        return;
      }
      if (showEditModal) { handleCloseEditModal(); return; }
      if (viewingNovedad) { handleCloseViewModal(); return; }
      if (deletingNovedad) { cancelDeleteNovedad(); return; }
      handleBack();
    }
  };

  document.addEventListener("keydown", handleKeyDown, true);
  return () => document.removeEventListener("keydown", handleKeyDown, true);
}, [
  showEyeModal,
  setSelectedEyeOperativo,
  showEditModal,
  handleCloseEditModal,
  viewingNovedad,
  handleCloseViewModal,
  deletingNovedad,
  cancelDeleteNovedad,
  handleBack,
]);
```
