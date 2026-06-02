# CLAUDE.md — Guía para Claude Code

## Proyecto

**CitySecure Frontend v2** — SPA de gestión de seguridad ciudadana (serenazgo) para municipalidades peruanas. Backend separado (Node/Express/Sequelize/PostgreSQL). Este repo es solo frontend.

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

## Backend: URLs de producción

| Entorno | URL base |
|---|---|
| **Producción (Supabase)** | `https://citysecbackendsupabase-production.up.railway.app/api/v1` |
| Local | `http://localhost:3000/api/v1` |

El backend en producción usa **PostgreSQL (Supabase)** como base de datos, no MySQL. Esto afecta cómo se interpretan algunos campos booleanos y la codificación de ciertos filtros — ver sección "Trampas conocidas backend" más abajo.

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
| Zod | 4.4.0+ |
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

**Scroll exterior bloqueado en modales** — obligatorio en todo modal o panel que cubra la pantalla. Usar `useBodyScrollLock` del hook existente:
```jsx
import useBodyScrollLock from "../../hooks/useBodyScrollLock.js";

function MiModal({ onClose }) {
  useBodyScrollLock(true); // bloquea body.overflow mientras el modal está montado
  // ...
}
```
Sin esto el fondo sigue siendo scrolleable mientras el modal está abierto.

**Tecla ESC cierra modales/paneles** — obligatorio en todo modal o panel lateral:
```jsx
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };
  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [onClose]);
```
Si el modal tiene estado de guardado en progreso, ignorar ESC mientras `saving === true`.

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

## MCP disponibles

### Supabase (schema: `citysecure`)
Siempre usar el prefijo `citysecure.` en todas las queries:
```sql
SELECT slug FROM citysecure.permisos WHERE slug LIKE 'modulo.%' ORDER BY slug;
SELECT r.nombre, COUNT(rp.permiso_id) FROM citysecure.roles r
  JOIN citysecure.rol_permisos rp ON rp.rol_id = r.id GROUP BY r.nombre;
```
**Verificar slugs de permisos antes de implementar cualquier `canPerformAction`:**
```sql
SELECT slug FROM citysecure.permisos WHERE slug LIKE 'modulo.%' ORDER BY slug;
```

### MySQL local / Railway
- `mcp__mysql-local__mysql_query` → base de datos `citizen_security` (desarrollo)
- `mcp__mysql-railway__mysql_query` → base de datos `railway` (producción Railway)

---

## Restricciones importantes

- **Verificar slugs antes de usar `canPerformAction`** — los slugs son dinámicos (viven en la tabla `permisos` del backend). Antes de implementar cualquier check de permiso, consultar la BD con MCP (`SELECT slug FROM permisos WHERE slug LIKE 'modulo.%' ORDER BY slug`) o el PRD del backend (sección 2.2). Nunca asumir el slug — un slug inexistente en `ACTION_PERMISSIONS` hace que `canPerformAction` retorne `true` para todos.
- **No usar `window.confirm` ni `alert()`** — reemplazar con `ConfirmModal` (tipo danger/warning) o `toast`
- **No usar `toISOString()`** para generar fechas que se muestran en la UI (desfase UTC)
- **No modificar** `NovedadesPage.jsx` sin entender su estructura (~5000 líneas, múltiples sub-vistas)
- **No crear** archivos `.md` de documentación sin que el usuario lo pida explícitamente
- **No añadir** comentarios explicativos en el código salvo que el WHY sea no obvio
- **No hacer push** a GitHub sin preguntar al usuario primero
- Los permisos del sistema (`es_sistema: true`) no se pueden editar ni eliminar

---

## Trampas conocidas — RBAC con Supabase (PostgreSQL)

### 🚨 `canPerformAction` no bypasea el rol `admin`

`canPerformAction(user, key)` solo bypasea `super_admin` (via `isSuperAdmin`). Para `admin`, verifica permisos en `ACTION_PERMISSIONS[key]`. Si el permiso requerido no está asignado al rol `admin` en Supabase, el botón queda **oculto** aunque el backend sí lo permita (el backend tiene bypass por rol).

```js
// rbac.js — canPerformAction
if (isSuperAdmin(user)) return true;  // solo super_admin
// admin sin el permiso asignado → retorna false → botón oculto
```

**Regla**: cuando añadas un nuevo `ACTION_PERMISSIONS`, confirma que el permiso está asignado al rol `admin` en la migración `002_citysecure_seeds.sql`. Si no, el botón será invisible para `admin`.

### 🚨 Slug incorrecto en `usuarios_reset_password`

```js
// rbac.js:138 — INCORRECTO (slug de permiso legacy)
usuarios_reset_password: ["usuarios.reset_password.execute"],
// El backend exige: "usuarios.usuarios.reset_password"
```

Este slug legacy (`usuarios.reset_password.execute`) **no está asignado al rol `admin`** en Supabase. Por eso el botón "Resetear contraseña" solo lo ven los `super_admin`. Pendiente normalizar el slug y asignar el permiso correcto al rol `admin`.

### 🚨 `canAccessRoute` sí bypasea `admin` — pero `canPerformAction` no

- `canAccessRoute` → bypasea `super_admin` Y `admin`
- `canPerformAction` → bypasea solo `super_admin`

No confundir los dos. Para dar acceso a una **ruta** a `admin`, alcanza con `ROUTE_ACCESS`. Para mostrar un **botón de acción** a `admin`, el permiso debe estar asignado en la BD o usar `canAccessRoute` como fallback.

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

## Seguridad

Reglas derivadas de auditorías reales (Aikido.dev). Aplicar en todo desarrollo nuevo.

### Dependencias

**Revisar imports antes de instalar** — si una librería ya no se usa, eliminarla en lugar de mantenerla como superficie de ataque:
```js
// ❌ import * as XLSX from 'xlsx';  ← eliminado: no se usaba, tenía CVE High
```

**Dependencias transitivas vulnerables** — usar `overrides` en `package.json` para parchear sin esperar que el paquete padre actualice:
```json
"overrides": {
  "tmp": "0.2.6",
  "follow-redirects": "^1.16.0",
  "uuid": "^11.1.1",
  "brace-expansion": "^1.1.14"
}
```
Siempre verificar con `npm run build` después de un override de versión mayor (ej: uuid 8→11).

**Al agregar una dependencia nueva**, verificar primero si una ya instalada cubre el caso de uso (ej: `exceljs` ya estaba cuando se instaló `xlsx` redundantemente).

### Credenciales y secretos

**Nunca hardcodear credenciales en código fuente**, ni en archivos de test:
```js
// ❌ const PASSWORD = 'MiPassword2026';
// ✅
const PASSWORD = process.env.TEST_PASSWORD ?? '';
```

**Patrón para tests Playwright** — leer desde `.env.test` (en `.gitignore`):
- Plantilla: `.env.test.example` (commiteable, sin valores reales)
- Valor real: `.env.test` (en `.gitignore`, nunca commitear)
- `playwright.config.js` carga dotenv desde `.env.test`

Si una credencial ya fue commiteada al historial git, **cambiar la contraseña en el sistema** — no alcanza con eliminarla del código porque sigue en el historial.

### mcp-server (Express)

El `mcp-server/` es un servidor Express que debe cumplir:

1. **Helmet obligatorio** — instalar y aplicar antes de cualquier middleware de rutas:
```js
const helmet = require("helmet");
app.use(helmet());
app.use(express.json());
```

2. **Sin SQL dinámico libre** — nunca ejecutar queries arbitrarios del request body:
```js
// ❌  pool.query(req.body.query)
// ✅  validar que solo sean SELECT / SHOW / DESCRIBE antes de ejecutar
const trimmed = query.trim().toUpperCase();
if (!trimmed.startsWith("SELECT") && !trimmed.startsWith("SHOW") && !trimmed.startsWith("DESCRIBE")) {
  return res.status(403).json({ error: "Solo se permiten consultas de lectura" });
}
```

### Scripts de utilidad (Node.js en raíz)

Al escanear directorios con `fs.readdirSync`, siempre sanitizar con `path.basename()` para evitar path traversal:
```js
// ❌ const fullPath = path.join(dir, entry.name);
// ✅
const safeName = path.basename(entry.name);
const fullPath = path.join(dir, safeName);
```

### ESLint — globals por entorno

Los archivos Node.js (scripts raíz, tests, config) necesitan globals de Node para que ESLint no marque `process`, `__dirname`, etc. como `no-undef`. Ya configurado en `eslint.config.js`:
```js
files: ['playwright.config.js', 'tests/**/*.js', 'auto-document.js', 'preview-documentation.js'],
languageOptions: { globals: { ...globals.browser, ...globals.node } }
```
Al agregar nuevos scripts Node en la raíz, incluirlos en este bloque.

---

## Tono de respuestas

- **Conciso**: respuestas cortas y directas, sin repetir lo obvio
- **En español**: todo el texto de UI y mensajes al usuario en español peruano
- **Sin emojis** salvo que el usuario los pida
- **Sin resúmenes al final** de cada respuesta
- Antes de implementar algo no trivial, proponer el enfoque en 2–3 líneas y esperar confirmación
