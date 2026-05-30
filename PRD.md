# PRD — CitySecure Frontend v2

**Producto**: Sistema de gestión de seguridad ciudadana (serenazgo)
**Cliente**: Municipalidades peruanas
**Versión frontend**: 2.x
**Última actualización**: 2026-05-30

---

## 1. Propósito del sistema

CitySecure es una SPA web que centraliza la operación diaria de unidades de serenazgo: registro de novedades (incidentes), gestión de turnos operativos, control de vehículos y personal, administración territorial (calles, sectores, cuadrantes) y generación de reportes Excel.

---

## 2. Usuarios y roles

| Rol | Capacidades principales |
|---|---|
| `super_admin` | Acceso total. Reactivar registros eliminados. Gestionar permisos del sistema. |
| `admin` | CRUD de personal, vehículos, operativos, novedades. Sin acceso a permisos del sistema. |
| `supervisor` | Gestión de operativos, atención de novedades, cambio de estados. Acceso a Auditoría. |
| `operador` | Registro de novedades y operativos. Consulta. |
| `consulta` | Solo lectura. |

El acceso se controla mediante **RBAC granular por permiso** (`canPerformAction(user, "modulo.recurso.accion")`), con comprobación adicional a nivel de rol para operaciones especiales (reactivar, cambiar estado, etc.).

**Regla crítica de seguridad:** Las rutas sensibles (`auditoria`) se protegen **exclusivamente por rol** en `ROUTE_ACCESS`, sin entrada en `ROUTE_PERMISSIONS`. Esto evita que roles operativos con permisos de lectura de auditoría asignados individualmente puedan acceder al panel. Si una ruta tiene entrada en `ROUTE_PERMISSIONS` y el usuario tiene cualquiera de esos permisos asignados (aunque sea por su rol), `canAccessRoute` devuelve `true` antes de llegar al filtro de roles.

---

## 3. Módulos del sistema

### 3.1 Dashboard
Panel principal con estadísticas de operativos activos, novedades del día y KPIs generales.

### 3.2 Control de Accesos
- **Permisos** (`PermisosPage`): CRUD de permisos del sistema (slugs). Permisos con `es_sistema=true` son de solo lectura.
- **Roles** (`RolesPermisosPage`): CRUD de roles, asignación de permisos, copia de roles.
- **Estados Novedad por Rol** (`RolEstadosNovedadPage`): qué estados puede asignar cada rol.
- **Usuarios** (`AdminUsuariosPage`): CRUD, soft-delete, reset de contraseña.
- **Auditoría** (`AuditoriaPage`): panel de consulta del registro de acciones del sistema. Acceso: super_admin, admin, supervisor.

### 3.3 Personal
Registro de efectivos de serenazgo: información personal, cargo, unidad asignada.

### 3.4 Vehículos
- Catálogo de vehículos operativos.
- **Talleres** (`TalleresPage`): registro y consulta de talleres mecánicos.
- **Abastecimiento de combustible** (`AbastecimientoModal`): registro por vehículo con filtros de fecha.

### 3.5 Novedades (`NovedadesPage`)
Módulo central del sistema (~5000 líneas). Funcionalidades:
- Registro de incidentes con tipo/subtipo, ubicación (mapa Leaflet), descripción.
- Listado con filtros avanzados (fecha, tipo, estado, cuadrante, sector).
- Modal de Atención: Tab Seguimiento (estado, datos afectados, pérdidas, fecha cierre), Tab Historial.
- Paginación servidor con chevrones de navegación.

### 3.6 Calles y Territorio
- **Tipos de Vía** (`TiposViaPage`): catálogo de tipos de vía.
- **Calles** (`CallesPage`): catálogo maestro con código normalizado.
- **Calles–Cuadrantes** (`CallesCuadrantesPage`): Master-Detail calle → cuadrantes asignados.
- **Sectores y Cuadrantes** (`SectoresCuadrantesPage`): jerarquía sector → subsector → cuadrante.
- **Direcciones** (`DireccionesPage`): catálogo con geocodificación, código `D-XXXXXX`, modal de ajuste en mapa.
- **Direcciones Eliminadas** (`DireccionesEliminadasPage`): listado y reactivación (solo `super_admin`).

### 3.7 Catálogos
- **Radios TETRA** (`RadiosTetraPage`): inventario, asignación a personal, cambio de estado.
- **Unidades/Oficinas** (`UnidadesOficinaPage`): jerarquía organizacional con pre-check de dependencias antes de eliminar.
- **Cargos** (`CargosPage`): catálogo de cargos del personal.
- **Tipos y Subtipos de Novedad** (`TiposSubtiposNovedadPage`): catálogo de clasificación de incidentes.

### 3.8 Configuración
- **Horarios de Turnos** (`HorariosTurnosPage`): catálogo de horarios disponibles para operativos.
- **Ubigeo** (`UbigeoPage`): consulta del catálogo geográfico del Perú (1,875 registros).

### 3.9 Operativos
- **Turnos** (`OperativosTurnoPage`): apertura y cierre de turnos con sector y hora.
- **Vehículos por turno** (`OperativosVehiculosPage`): asignación de tripulación, kilometraje, abastecimiento.
- **Cuadrantes por vehículo** (`CuadrantesPorVehiculo`): patrullaje con hora ingreso/salida.
- **Personal por turno**: asignación de efectivos a pie.

### 3.10 Tracking GPS (`/operativos/tracking`)
Mapa operativo en tiempo real con Leaflet:
- Visualización de posición de vehículos en servicio sobre el mapa de Chorrillos.
- Actualización en tiempo real via SSE (`/api/v1/tracking/stream`) o polling configurable.
- Panel lateral con estado de cada unidad (en servicio, patrullando, en base).
- Permiso requerido: `tracking.vehiculos.read` (read) / `tracking.vehiculos.update` (update posición).

### 3.11 Reportes Operativos
Generación de Excel multi-hoja con ExcelJS:
- **Hoja Resumen**: KPIs del turno + 3 gráficos Recharts incrustados.
- **Hoja Novedades**: detalle de incidentes filtrados por fecha.
- **Hoja No Atendidas**: novedades en estado PENDIENTE.
- **Hoja Recursos**: personal y vehículos del turno.

### 3.12 Autenticación
- **Login** (`LoginPage`): formulario con JWT.
- **Recuperar contraseña** (`ForgotPasswordPage`): envío de email con link de reset via Resend SDK.
- **Restablecer contraseña** (`ResetPasswordPage`): formulario con token de URL, indicador de fortaleza de contraseña. Redirige al login tras éxito.

---

## 4. Módulo de Auditoría — Detalle (`AuditoriaPage`)

### Acceso
Solo roles: `super_admin`, `admin`, `supervisor`. Protegido exclusivamente por `ROUTE_ACCESS` (no por `ROUTE_PERMISSIONS`).

### Filtros disponibles
| Filtro | Tipo | Valores |
|---|---|---|
| Desde / Hasta | date | Rango de `created_at` |
| Acción | select | CREATE, UPDATE, DELETE, LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_CHANGE, EXPORT, IMPORT, VIEW |
| Módulo | text | Libre (ej: Novedades, Vehículos) |
| Severidad | select | BAJA, MEDIA, ALTA, CRITICA |
| Resultado | select | EXITO, FALLO, DENEGADO |
| Usuario | select (dropdown) | Lista de usuarios activos ordenada alfabéticamente, límite 100 |
| Filas por página | select | 25, 50, 100 |

### Tabla
Columnas: Fecha · Usuario · Acción (badge) · Módulo · Entidad · Descripción (truncada) · Severidad (badge) · Resultado (badge) · IP

Toda la fila es clickeable para abrir el modal de detalle.

### Modal de detalle
Muestra todos los campos incluyendo `datos_anteriores` / `datos_nuevos` en JSON formateado, metadata, user_agent, mensaje_error y duración. Bloquea el scroll del body mientras está abierto (`useBodyScrollLock`).

### Exportación CSV
Botón "Exportar CSV" descarga hasta 10,000 registros con los filtros activos.

---

## 5. Patrones UX estables

| Patrón | Implementación |
|---|---|
| Confirmaciones destructivas | `ConfirmModal` (type `danger`/`warning`) — **nunca** `window.confirm` ni `alert()` |
| Notificaciones | `react-hot-toast` — siempre `toast.success/error/loading` |
| Feedback en operaciones largas | `toast.loading(id)` inmediato → `toast.dismiss(id)` al terminar |
| Dark mode | Clases `dark:` en todos los elementos; iconos calendario global en `src/index.css` con `filter: brightness(0) invert(1)` |
| Fechas en hora local | `getFullYear/getMonth/getDate()` — nunca `toISOString()` para inputs de fecha |
| Permisos en UI | `canPerformAction(user, slug)` oculta/deshabilita elementos sin permiso |
| Pre-checks antes de eliminar | Handler async verifica dependencias (`checkCanDelete`) → si falla: `toast.error`; si pasa: abre modal |
| Scroll bloqueado en modales | `useBodyScrollLock(true)` — **obligatorio** en todo modal o panel que cubra la pantalla. Sin esto el fondo sigue siendo scrolleable |
| Tecla ESC cierra modales | `window.addEventListener("keydown")` en `useEffect` de cada modal — obligatorio |
| **Botón "Cerrar" en modales** | El botón "Cerrar" (o "×") presente en **todos** los modales de la app sirve **únicamente para descartar/cerrar el modal** sin ejecutar ninguna acción sobre el registro. NO es una acción de negocio. Para modificar el estado de un registro (ej. cambiar un turno a "Cerrado") siempre se usa el flujo: **ícono lápiz (editar) → modal de edición → modificar campo Estado → botón Guardar**. |

---

## 6. Decisiones técnicas adoptadas

| Decisión | Motivo |
|---|---|
| ExcelJS en lugar de xlsx | Permite estilos, imágenes y múltiples hojas con control total |
| React 19 sin TypeScript | Proyecto en JS puro con JSDoc; no migrar a TS sin decisión explícita |
| Zustand 5 | Estado global mínimo (auth, theme); server state con React Query 5 |
| Zod 4 + React Hook Form 7 | Validación con schemas; resolvers hookform |
| TailwindCSS utility-first | Dark mode con variante `dark:`, sin CSS modules |
| `ConfirmModal` centralizado | UX uniforme en toda la app para acciones destructivas |
| `ROUTE_ACCESS` para rutas admin sensibles | Las rutas de solo-admin (auditoría) no deben estar en `ROUTE_PERMISSIONS` para evitar bypass por permisos individuales |
| `useBodyScrollLock` en modales | Impide scroll del fondo mientras el modal está abierto; hook reutilizable en `src/hooks/` |

---

## 7. Restricciones del producto

1. **Permisos `es_sistema=true`** no se pueden modificar ni eliminar desde la UI.
2. **Eliminaciones**: siempre soft-delete en backend. La UI siempre confirma con `ConfirmModal`.
3. **Reactivación**: solo `super_admin`.
4. **RBAC doble**: frontend oculta/deshabilita + backend valida en cada request.
5. **Idioma**: toda la UI y mensajes toast en español peruano.
6. **Sin emojis** en la UI salvo iconos SVG de Lucide.
7. **Usuarios en dropdowns**: `limit=100` máximo (validación del backend). Si hay más de 100 usuarios activos, revisar estrategia de paginación.

---

## 8. Estado actual del desarrollo (2026-05-30)

### Backend: migración MySQL → PostgreSQL (Supabase) — completada
El backend en producción ahora usa **PostgreSQL vía Supabase** (antes MySQL Railway).
- URL producción: `https://citysecbackendsupabase-production.up.railway.app/api/v1`
- 2 591 registros migrados desde MySQL (19 tablas) — migraciones `001`–`007` aplicadas
- Supabase schema: `citysecure` (no `public`)
- 7 migraciones SQL en `city_sec_backend_claude/supabase/migrations/`

Bugs corregidos como parte de la migración PostgreSQL:
- **Reset de contraseña**: el hook `afterUpdate` de `Usuario.js` generaba `realizado_por=null`, abortando silenciosamente la transacción en PostgreSQL. `require_password_change` nunca se grababa → el modal de cambio no aparecía tras el reset. Corregido en `ee2242c`.
- **`/personal/stats`**: `sequelize.fn("CURRENT_DATE")` generaba `CURRENT_DATE()` — válido en MySQL, error de sintaxis en PostgreSQL. Corregido a `sequelize.literal("CURRENT_DATE")`. Corregido en `cafe9bf`.
- Otros fixes previos: `Op.iLike` para búsquedas case-insensitive, comparaciones boolean/integer, GROUP BY estricto.

### Completado en el sprint mayo 2026
- **Tracking GPS** (`/operativos/tracking`) — Mapa Operativo en tiempo real con Leaflet, SSE y panel lateral de estado de unidades
- **Flujo recuperación de contraseña** — `ForgotPasswordPage` + `ResetPasswordPage`
- **Tests Playwright** — 6 tests del flujo forgot-password
- **Panel de Auditoría** (`/admin/auditoria`) — filtros completos, exportación CSV, modal con JSON diff
- **Fix seguridad RBAC** — `auditoria` solo por rol, no por permisos
- **ESLint 0 errores**

### Completado anteriormente
- Migración completa `window.confirm` → `ConfirmModal` en 17 archivos
- Reportes Operativos en Excel con gráficos Recharts incrustados
- Dark mode homologado en toda la app
- Módulo completo de Novedades, Operativos, Calles, Vehículos, Personal
- Administración completa (usuarios, roles, permisos del sistema)
- Talleres, Horarios de Turnos, Ubigeo

### Deuda técnica conocida
- `NovedadesPage.jsx` es un monolito de ~5000 líneas; candidato a refactor modular
- Bundle size > 2.6 MB minificado (ExcelJS aporta ~936 KB)
- 42 warnings de ESLint (dependencias faltantes en `useEffect`) en archivos preexistentes — no bloquean
- Tests Playwright solo cubren flujo forgot-password; pendiente cobertura de login, novedades, operativos
- Dropdown de usuarios en Auditoría limitado a 100 activos
- **Slug incorrecto**: `ACTION_PERMISSIONS.usuarios_reset_password` usa `usuarios.reset_password.execute` pero el backend exige `usuarios.usuarios.reset_password`. El botón "Resetear contraseña" solo lo ven los `super_admin` — pendiente normalizar slug y asignar permiso a rol `admin` en Supabase.
- **`canPerformAction` no bypasea `admin`**: todos los botones de acción verifican permisos en `ACTION_PERMISSIONS`. Si el permiso no está asignado al rol `admin` en Supabase seeds, el botón queda oculto aunque el backend lo permita.

---

## 9. Variables de entorno relevantes

### Frontend (`.env.local` / Railway)
| Variable | Valor desarrollo | Valor producción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api/v1` | `https://citysecbackendsupabase-production.up.railway.app/api/v1` |

### Backend (Railway — relevantes para el frontend)
| Variable | Propósito |
|---|---|
| `FRONTEND_PUBLIC_URL` | URL pública del frontend (para links en emails de reset password). Distinta de `FRONTEND_URL` que puede apuntar a URL interna de Railway |
| `RESEND_API_KEY` | SDK de Resend para envío de emails (reemplaza SMTP bloqueado en Railway) |
| `DB_DIALECT` | `postgres` en producción Supabase |
| `DB_SCHEMA` | `citysecure` en producción Supabase |
