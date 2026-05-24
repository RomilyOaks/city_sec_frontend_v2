# PRD — CitySecure Frontend v2

**Producto**: Sistema de gestión de seguridad ciudadana (serenazgo)
**Cliente**: Municipalidades peruanas
**Versión frontend**: 2.x
**Última actualización**: 2026-05-24

---

## 1. Propósito del sistema

CitySecure es una SPA web que centraliza la operación diaria de unidades de serenazgo: registro de novedades (incidentes), gestión de turnos operativos, control de vehículos y personal, administración territorial (calles, sectores, cuadrantes) y generación de reportes Excel.

---

## 2. Usuarios y roles

| Rol | Capacidades principales |
|---|---|
| `super_admin` | Acceso total. Reactivar registros eliminados. Gestionar permisos del sistema. |
| `admin` | CRUD de personal, vehículos, operativos, novedades. Sin acceso a permisos del sistema. |
| `supervisor` | Gestión de operativos, atención de novedades, cambio de estados. |
| `operador` | Registro de novedades y operativos. Consulta. |
| `consulta` | Solo lectura. |

El acceso se controla mediante **RBAC granular por permiso** (`canPerformAction(user, "modulo.recurso.accion")`), con comprobación adicional a nivel de rol para operaciones especiales (reactivar, cambiar estado, etc.).

---

## 3. Módulos del sistema

### 3.1 Dashboard
Panel principal con estadísticas de operativos activos, novedades del día y KPIs generales.

### 3.2 Administración
- **Usuarios** (`AdminUsuariosPage`): CRUD, soft-delete, reset de contraseña.
- **Roles** (`RolesPermisosPage`): CRUD de roles, asignación de permisos, copia de roles.
- **Permisos** (`PermisosPage`): CRUD de permisos del sistema (slugs). Permisos con `es_sistema=true` son de solo lectura.

### 3.3 Personal
Registro de efectivos de serenazgo: información personal, cargo, unidad asignada.

### 3.4 Vehículos
- Catálogo de vehículos operativos.
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
- **Calles–Cuadrantes** (`CallesCuadrantesPage` en pages y components): Master-Detail calle → cuadrantes asignados.
- **Sectores y Cuadrantes** (`SectoresCuadrantesPage`): jerarquía sector → subsector → cuadrante.
- **Direcciones** (`DireccionesPage`): catálogo con geocodificación, código `D-XXXXXX`, modal de ajuste en mapa.
- **Direcciones Eliminadas** (`DireccionesEliminadasPage`): listado y reactivación (solo `super_admin`).

### 3.7 Catálogos
- **Radios TETRA** (`RadiosTetraPage`): inventario, asignación a personal, cambio de estado.
- **Unidades/Oficinas** (`UnidadesOficinaPage`): jerarquía organizacional con pre-check de dependencias antes de eliminar.

### 3.8 Operativos
- **Turnos** (`OperativosTurnosPage`): apertura y cierre de turnos con sector y hora.
- **Vehículos por turno** (`OperativosVehiculosPage`): asignación de tripulación, kilometraje, abastecimiento.
- **Cuadrantes por vehículo** (`CuadrantesPorVehiculo`): patrullaje con hora ingreso/salida, pre-check de novedades antes de eliminar.
- **Personal por turno** (`OperativosPersonalPage`): asignación de efectivos a pie.
- **Asignación cuadrante–vehículo** (`CuadranteVehiculosModal`): gestión con reactivación de registros anulados.

### 3.9 Reportes Operativos (`ReportesOperativosPage`)
Generación de Excel multi-hoja con ExcelJS:
- **Hoja Resumen**: KPIs del turno + 3 gráficos Recharts incrustados (capturas canvas → imagen en celdas).
- **Hoja Novedades**: detalle de incidentes filtrados por fecha con `fecha_despacho`.
- **Hoja No Atendidas**: novedades en estado PENDIENTE (endpoint `/novedades`).
- **Hoja Recursos**: personal y vehículos del turno (columna "Recurso").
- Botón con feedback inmediato: loading state + `toast.loading` antes del procesamiento.
- Fechas de filtro en hora local (no UTC).

---

## 4. Patrones UX estables

| Patrón | Implementación |
|---|---|
| Confirmaciones destructivas | `ConfirmModal` (type `danger`/`warning`) — **nunca** `window.confirm` ni `alert()` |
| Notificaciones | `react-hot-toast` — siempre `toast.success/error/loading` |
| Feedback en operaciones largas | `toast.loading(id)` inmediato → `toast.dismiss(id)` al terminar |
| Dark mode | Clases `dark:` en todos los elementos; iconos calendario global en `src/index.css` con `filter: brightness(0) invert(1)` |
| Fechas en hora local | `getFullYear/getMonth/getDate()` — nunca `toISOString()` para inputs de fecha |
| Permisos en UI | `canPerformAction(user, slug)` oculta/deshabilita elementos sin permiso |
| Pre-checks antes de eliminar | Handler async verifica dependencias (`checkCanDelete`) → si falla: `toast.error`; si pasa: abre modal |

---

## 5. Decisiones técnicas adoptadas

| Decisión | Motivo |
|---|---|
| ExcelJS en lugar de xlsx | Permite estilos, imágenes y múltiples hojas con control total |
| React 19 sin TypeScript | Proyecto en JS puro con JSDoc; no migrar a TS sin decisión explícita |
| Zustand 5 | Estado global mínimo (auth, theme); server state con React Query 5 |
| Zod 4 + React Hook Form 7 | Validación con schemas; resolvers hookform |
| TailwindCSS utility-first | Dark mode con variante `dark:`, sin CSS modules |
| `ConfirmModal` centralizado | UX uniforme en toda la app para acciones destructivas — migración completada mayo 2026 |
| React Query para server state | Cache, loading/error states, invalidación automática en módulos nuevos |

---

## 6. Restricciones del producto

1. **Permisos `es_sistema=true`** no se pueden modificar ni eliminar desde la UI.
2. **Eliminaciones**: siempre soft-delete en backend (Sequelize `paranoid: true`). La UI siempre confirma con `ConfirmModal` antes de llamar al API.
3. **Reactivación**: solo `super_admin`. Disponible en DireccionesEliminadasPage, CuadranteVehiculosModal y CuadranteVehiculoFormModal.
4. **RBAC doble**: frontend oculta/deshabilita + backend valida en cada request.
5. **Idioma**: toda la UI y mensajes toast en español peruano.
6. **Sin emojis** en la UI salvo iconos SVG de Lucide.

---

## 7. Estado actual del desarrollo (2026-05-24)

### Completado recientemente
- Migración completa `window.confirm` → `ConfirmModal` en 17 archivos (mayo 2026)
- Reportes Operativos en Excel con gráficos Recharts incrustados
- Dark mode homologado en toda la app (iconos calendario, paginación, etc.)
- Módulo completo de Novedades con modal de Atención rediseñado
- Módulo de Operativos completo (turnos, vehículos, personal, cuadrantes)
- Administración completa (usuarios, roles, permisos del sistema)
- Módulo de Calles y Territorio con geocodificación

### Deuda técnica conocida
- `NovedadesPage.jsx` es un monolito de ~5000 líneas; candidato a refactor modular
- Bundle size > 2.6 MB minificado (ExcelJS aporta ~936 KB gzip: 270 KB)
- Sin cobertura de tests unitarios ni e2e (Playwright instalado, sin specs)
