# CLAUDE.md — Guía para Claude Code

## Proyecto

**CitySecure Frontend v2** — SPA de gestión de seguridad ciudadana (serenazgo) para municipalidades peruanas. Backend separado (Node/Express/Sequelize). Este repo es solo frontend.

---

## Comandos esenciales

```bash
npm run dev       # Dev server en http://localhost:5173
npm run build     # Build producción → dist/
npm run lint      # ESLint (debe pasar sin errores)
npm run preview   # Preview del build
```

**Antes de subir a GitHub**: ejecutar ESLint + build. Preguntar siempre al usuario si desea hacer push.

---

## Stack tecnológico (versiones reales)

| Librería | Versión |
|---|---|
| React | 19.2.0 |
| Vite | 7.2.4 |
| React Router DOM | 7.11.0 |
| TailwindCSS | 3.4.17 |
| Zustand | 5.0.9 |
| @tanstack/react-query | 5.90.12 |
| React Hook Form | 7.68.0 |
| Zod | 4.2.1 |
| Axios | 1.13.2 |
| Lucide React | 0.562.0 |
| React Hot Toast | 2.6.0 |
| React Leaflet | 5.0.0 |
| Recharts | 3.8.1 |
| ExcelJS | 4.4.0 |

---

## Arquitectura

```
src/
├── components/          # Componentes reutilizables
│   ├── common/          # ConfirmModal, ThemeToggle, etc. (barrel: index.js)
│   ├── admin/           # Modales de usuarios, roles, permisos
│   ├── calles/          # Modales de calles, cuadrantes, sectores
│   ├── catalogos/       # Modales de radios, unidades
│   ├── direcciones/     # Formularios y vistas de direcciones
│   ├── novedades/       # Componentes del módulo novedades
│   └── vehiculos/       # AbastecimientoModal, etc.
├── pages/               # Una carpeta por módulo
│   ├── admin/           # AdminUsuariosPage, RolesPermisosPage, PermisosPage
│   ├── calles/          # CallesPage, SectoresCuadrantesPage, DireccionesPage...
│   ├── catalogos/       # RadiosTetraPage, UnidadesOficinaPage
│   ├── dashboard/
│   ├── novedades/       # NovedadesPage (monolítico ~5000 líneas)
│   ├── operativos/      # turnos, vehiculos/, personal/
│   └── reportes-operativos/
├── services/            # Un archivo por entidad (ej: novedadesService.js)
├── store/               # Zustand stores (useAuthStore.js)
├── rbac/                # rbac.js, canPerformAction(), ROLE_SLUGS
├── forms/               # Schemas Zod
├── hooks/               # useBodyScrollLock, etc.
├── utils/               # errorUtils, dateHelper, direccionCodeHelper...
├── layouts/             # AppShell.jsx
├── routes/              # AppRouter.jsx, ProtectedRoute.jsx
└── config/              # Configuraciones
```

---

## Convenciones de código

### Archivos y componentes
- Componentes: `PascalCase.jsx` → `NovedadDetalleModal.jsx`
- Servicios/hooks/utils: `camelCase.js` → `novedadesService.js`
- Constantes: `UPPER_SNAKE_CASE`

### Patrones establecidos — seguir siempre

**Eliminaciones y acciones destructivas** → usar `ConfirmModal` de `../../components/common`, nunca `window.confirm`:
```jsx
const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null, loading: false });

const handleEliminar = (item) => setConfirmModal({ isOpen: true, item, loading: false });

const handleConfirmEliminar = async () => {
  setConfirmModal(s => ({ ...s, loading: true }));
  try {
    await servicio.delete(confirmModal.item.id);
    toast.success("...");
    cargar();
  } catch (err) {
    toast.error(extractValidationErrors(err) || "Error al eliminar");
  } finally {
    setConfirmModal({ isOpen: false, item: null, loading: false });
  }
};

<ConfirmModal
  isOpen={confirmModal.isOpen}
  title="Eliminar X"
  message={`¿Seguro de eliminar "${confirmModal.item?.nombre}"?`}
  confirmText="Eliminar"
  type="danger"
  loading={confirmModal.loading}
  onClose={() => setConfirmModal({ isOpen: false, item: null, loading: false })}
  onConfirm={handleConfirmEliminar}
/>
```

**Toasts de operaciones largas** → feedback inmediato:
```js
const toastId = toast.loading("Procesando...");
// ... operación ...
toast.dismiss(toastId);
toast.success("Listo");
```

**Fechas en hora local** (nunca `toISOString()` para fechas de UI):
```js
const now = new Date();
const fecha = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
```

**RBAC** → siempre usar `canPerformAction(user, "permiso.slug")` o `useAuthStore s => s.hasAnyPermission`.

**Errores de API** → usar `extractValidationErrors` de `../../utils/errorUtils`.

### Estilo visual
- Color primario: **verde oliva** `bg-primary-700` (#4e8c1f) para botones principales
- Dark mode: todas las clases con variante `dark:` homologadas
- Iconos: solo `lucide-react`
- Iconos calendario dark mode: clase `[&::-webkit-calendar-picker-indicator]:dark:invert`

---

## Restricciones importantes

- **No usar `window.confirm` ni `alert()`** — reemplazar con `ConfirmModal` (tipo danger/warning) o `toast`
- **No usar `toISOString()`** para generar fechas que se muestran en la UI (desfase UTC)
- **No modificar** `NovedadesPage.jsx` sin entender su estructura (~5000 líneas, múltiples sub-vistas)
- **No crear** archivos `.md` de documentación sin que el usuario lo pida explícitamente
- **No añadir** comentarios explicativos en el código salvo que el WHY sea no obvio
- **No hacer push** a GitHub sin preguntar al usuario primero
- Los permisos del sistema (`es_sistema: true`) no se pueden editar ni eliminar

---

## Archivos clave

| Archivo | Propósito |
|---|---|
| `src/store/useAuthStore.js` | Estado global de auth, user, permisos |
| `src/rbac/rbac.js` | `canPerformAction()`, `ROLE_SLUGS`, `getUserRoleSlugs()` |
| `src/services/api.js` | Axios instance con interceptors |
| `src/components/common/index.js` | Barrel de ConfirmModal, ThemeToggle, etc. |
| `src/utils/errorUtils.js` | `extractValidationErrors()` |
| `src/utils/dateHelper.js` | Helpers de fechas en local TZ |
| `src/layouts/AppShell.jsx` | Shell principal con sidebar |
| `src/routes/AppRouter.jsx` | Rutas protegidas con RBAC |
| `src/index.css` | Estilos globales + dark mode calendar icon fix |
| `.claude/rules/dploy-dev.instructions.md` | Reglas de deploy (ESLint + build + preguntar push) |

---

## Tono de respuestas

- **Conciso**: respuestas cortas y directas, sin repetir lo obvio
- **En español**: todo el texto de UI y mensajes al usuario en español peruano
- **Sin emojis** salvo que el usuario los pida
- **Sin resúmenes al final** de cada respuesta
- Antes de implementar algo no trivial, proponer el enfoque en 2–3 líneas y esperar confirmación
