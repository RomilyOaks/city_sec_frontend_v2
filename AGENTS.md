# City Security Frontend V2 - Documentación para Agentes AI

## 📋 Tabla de Contenidos

- [Definición del Alcance del Frontend](#definición-del-alcance-del-frontend)
- [Arquitectura Frontend](#arquitectura-frontend)
- [Patrones de Software Aplicados](#patrones-de-software-aplicados)
- [Lenguajes y Librerías](#lenguajes-y-librerías)
- [Estándares y Nomenclatura](#estándares-y-nomenclatura)
- [Identidad Visual - Colores](#identidad-visual---colores)
- [Menú del Sistema - Funcionalidades](#menú-del-sistema---funcionalidades)

---

## 🎯 Definición del Alcance del Frontend

### **Propósito Principal**

Aplicación web moderna para la gestión integral de seguridad ciudadana, permitiendo el control de operativos policiales, registro de novedades, gestión de personal y vehículos en tiempo real.

### **Módulos Principales Frontend**

1. **Dashboard** - Panel principal con estadísticas y KPIs
2. **Administración** - Gestión de usuarios, roles y permisos
3. **Personal** - Gestión de personal policial y asignaciones
4. **Vehículos** - Control de flota vehicular y operativos
5. **Novedades** - Sistema central de incidentes y emergencias
6. **Calles** - Gestión del catastro vial y división territorial
7. **Catálogos** - Mantenimiento de maestras del sistema
8. **Operativos** - Gestión de turnos y asignaciones operativas
9. **Reportes** - Generación de informes y auditoría

---

## 🐞 Debug logging (developer guide)

To avoid noisy logs in production and to make debugging easy during development, the frontend exposes a global debug helper.

- Env var: set `VITE_DEBUG=true` in `.env.local` (or `false` in production).
- Utility: `src/utils/debug.js` exports `isDebug()` and `debug(...args)`.
- Usage: import `{ debug }` and call `debug('msg', payload)` or use dynamic import to avoid bundling overhead for low-frequency logs:

```js
import("../../utils/debug").then(({ debug }) => debug("payload", payload));
```

This ensures debug messages are only printed when `VITE_DEBUG` is `true`. For date-specific debugging, create a separate env var `VITE_DEBUG_DATES` and check that inside the helper.

Make sure to gate heavy or frequent logs behind the debug flag to avoid performance impact in production.

### **Características Técnicas**

- **SPA (Single Page Application)** con React 19
- **Responsive Design** para dispositivos móviles y desktop
- **Estado Global** con Zustand 5 (local) + React Query 5 (server state)
- **Navegación** con React Router 7
- **Autenticación** JWT con RBAC granular por permiso
- **API RESTful** con Axios
- **UI Components** con TailwindCSS 3 + dark mode
- **Generación Excel** con ExcelJS 4 (multi-hoja + gráficos incrustados)
- **Mapas** con React Leaflet 5

---

## 🏗️ Arquitectura Frontend

### **Estructura del Proyecto**

```
src/
├── components/
│   ├── common/          # ConfirmModal, ThemeToggle, ThemeApplier (barrel: index.js)
│   ├── admin/           # Modales de usuarios, roles, permisos
│   ├── calles/          # CalleFormModal, CuadranteMapaModal, CuadranteVehiculosModal...
│   ├── catalogos/       # RadioTetraList, RadioTetraFormModal, AsignarPersonalModal...
│   ├── direcciones/     # DireccionFormModal, DireccionViewModal
│   ├── novedades/       # Componentes del módulo novedades
│   └── vehiculos/       # AbastecimientoModal
├── pages/
│   ├── admin/           # AdminUsuariosPage, RolesPermisosPage, PermisosPage
│   ├── auth/            # LoginPage, SignupPage
│   ├── calles/          # CallesPage, SectoresCuadrantesPage, DireccionesPage, TiposViaPage...
│   ├── catalogos/       # RadiosTetraPage, UnidadesOficinaPage
│   ├── dashboard/       # DashboardPage
│   ├── novedades/       # NovedadesPage (~5000 líneas)
│   ├── operativos/      # OperativosTurnosPage + vehiculos/ + personal/
│   ├── personal/        # PersonalPage
│   ├── reportes-operativos/ # ReportesOperativosPage
│   └── vehiculos/       # VehiculosPage
├── services/            # Un archivo por entidad (api.js + *Service.js)
├── store/               # useAuthStore.js (Zustand)
├── rbac/                # rbac.js — canPerformAction(), ROLE_SLUGS
├── forms/               # Schemas Zod (AbastecimientoSchema, etc.)
├── hooks/               # useBodyScrollLock, etc.
├── utils/               # errorUtils, dateHelper, direccionCodeHelper, debug
├── layouts/             # AppShell.jsx
├── routes/              # AppRouter.jsx, ProtectedRoute.jsx
├── config/              # Configuraciones
└── styles/              # Estilos adicionales
```

### **Flujo de Datos Frontend**

```
Componentes → Services → API → Backend
     ↓           ↓         ↓
Store ← Utils ← Hooks ← Estado
```

### **Arquitectura de Componentes**

- **Presentational Components**: Componentes visuales puros
- **Container Components**: Lógica de negocio y estado
- **Custom Hooks**: Lógica reutilizable
- **Services**: Comunicación con API
- **Store**: Estado global compartido

---

## 🔧 Patrones de Software Aplicados

### **Patrones de Diseño Frontend**

1. **Component-Based Architecture** - Componentes React modulares
2. **Custom Hooks Pattern** - Lógica reutilizable con hooks
3. **Service Layer Pattern** - Separación de llamadas API
4. **Observer Pattern** - Estado reactivo con Zustand
5. **Factory Pattern** - Creación de componentes dinámicos
6. **Strategy Pattern** - Algoritmos intercambiables
7. **Higher-Order Components (HOCs)** - Componentes envolventes
8. **Compound Components** - Componentes compuestos

### **Patrones de Estado**

1. **State Management** - Zustand para estado global
2. **Local State** - useState para estado local
3. **Derived State** - Estados calculados
4. **Server State** - Datos del servidor con cache
5. **Form State** - React Hook Form para formularios

### **Patrones de Programación**

1. **Functional Programming** - React hooks y funciones puras
2. **Async/Await Pattern** - Manejo de operaciones asíncronas
3. **Error Boundary Pattern** - Manejo de errores
4. **Lazy Loading** - Código bajo demanda
5. **Memoization** - React.memo y useMemo
6. **Conditional Rendering** - Renderizado condicional

---

## 💻 Lenguajes y Librerías

### **Core Frontend Stack**

```javascript
// Framework UI
React: ^19.2.0           // Framework principal
JavaScript: ES2022       // Lenguaje principal (sin TypeScript)

// Routing
React Router DOM: ^7.11.0 // Navegación SPA

// State Management
Zustand: ^5.0.9          // Estado global (auth, theme)
@tanstack/react-query: ^5.90.12 // Server state y cache
React Hook Form: ^7.68.0 // Formularios
Zod: ^4.2.1              // Validación de schemas

// UI Framework
TailwindCSS: ^3.4.17    // CSS utility-first con dark mode
Lucide React: ^0.562.0   // Iconos
React Hot Toast: ^2.6.0  // Notificaciones toast

// HTTP Client
Axios: ^1.13.2           // Llamadas API

// Mapas
React Leaflet: ^5.0.0    // Mapas interactivos
Leaflet: ^1.9.4

// Excel y PDF
ExcelJS: ^4.4.0          // Generación Excel multi-hoja con imágenes
jsPDF: ^3.0.4
html2canvas: ^1.4.1

// Gráficos
Recharts: ^3.8.1
```

### **DevTools y Build**

```javascript
// Build Tool
Vite: ^4.0.0             // Build tool y dev server

// Development
ESLint: ^8.0.0           // Linting
Prettier: ^2.8.0          // Formato de código

// Testing (opcional)
Vitest: ^0.28.0          // Unit testing
React Testing Library: ^13.4.0 // Component testing
```

### **Dependencias de Desarrollo**

```json
{
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^4.2.2",
    "vite": "^7.2.4",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "tailwindcss": "^3.4.17",
    "autoprefixer": "^10.4.23",
    "vitest": "^1.6.1",
    "@playwright/test": "^1.59.1"
  }
}
```

---

## 📝 Estándares y Nomenclatura

### **Nomenclatura de Archivos**

```
# Componentes React
PascalCase.jsx → NovedadDetalleModal.jsx
PascalCase.jsx → DashboardPage.jsx

# Hooks personalizados
camelCase.js → useAuthStore.js
camelCase.js → useNovedades.js

# Servicios API
camelCase.js → novedadesService.js
camelCase.js → operativosService.js

# Utilidades
camelCase.js → dateHelper.js
camelCase.js → validationHelper.js

# Constantes
UPPER_SNAKE_CASE → ROLE_SLUGS
UPPER_SNAKE_CASE → API_ENDPOINTS
```

### **Nomenclatura de Variables**

```javascript
// Variables y funciones: camelCase
const novedadActiva = null;
const handleCreateNovedad = () => {};
const isLoadingData = false;

// Constantes: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_FILE_SIZE = 5242880;
const DEFAULT_PAGE_SIZE = 20;

// Componentes: PascalCase
const NovedadCard = () => {};
const ModalContainer = () => {};

// CSS Classes: kebab-case (Tailwind)
<div className="bg-primary-700 text-white p-4 rounded-lg">
```

### **Estructura de Carpetas Detallada**

```
src/
├── components/
│   ├── common/          # ConfirmModal, ThemeToggle, ThemeApplier (barrel: index.js)
│   ├── admin/           # Modales de usuarios, roles, permisos
│   ├── calles/          # CalleFormModal, CuadranteMapaModal, CuadranteVehiculosModal...
│   ├── catalogos/       # RadioTetraList, RadioTetraFormModal, AsignarPersonalModal...
│   ├── direcciones/     # DireccionFormModal, DireccionViewModal
│   ├── novedades/       # Componentes del módulo novedades
│   └── vehiculos/       # AbastecimientoModal
├── pages/
│   ├── admin/           # AdminUsuariosPage, RolesPermisosPage, PermisosPage
│   ├── auth/            # LoginPage, SignupPage
│   ├── calles/          # CallesPage, SectoresCuadrantesPage, DireccionesPage, TiposViaPage...
│   ├── catalogos/       # RadiosTetraPage, UnidadesOficinaPage
│   ├── dashboard/       # DashboardPage
│   ├── novedades/       # NovedadesPage (~5000 líneas)
│   ├── operativos/      # OperativosTurnosPage + vehiculos/ + personal/
│   ├── personal/        # PersonalPage
│   ├── reportes-operativos/ # ReportesOperativosPage
│   └── vehiculos/       # VehiculosPage
├── services/            # Un archivo por entidad (api.js + *Service.js)
├── store/               # useAuthStore.js (Zustand)
├── rbac/                # rbac.js — canPerformAction(), ROLE_SLUGS
├── forms/               # Schemas Zod (AbastecimientoSchema, etc.)
├── hooks/               # useBodyScrollLock, etc.
├── utils/               # errorUtils, dateHelper, direccionCodeHelper, debug
├── layouts/             # AppShell.jsx
├── routes/              # AppRouter.jsx, ProtectedRoute.jsx
├── config/              # Configuraciones
└── styles/              # Estilos adicionales
```

### **Estándares de Código**

- **Indentación**: 2 espacios (configuración VSCode/Prettier)
- **Quotes**: Single quotes para strings
- **Semicolons**: Required al final de statements
- **ESLint**: Configuración estricta con reglas React
- **Prettier**: Formato automático al guardar
- **Comments**: JSDoc para funciones importantes
- **Imports**: Organizados alfabéticamente por tipo

---

## 🎨 Identidad Visual - Colores

### **Paleta de Colores Principal - Verde Oliva**

```css
/* Primary Colors - Verde Oliva */
bg-primary-50:   #f0f9e8   /* Fondo muy claro */
bg-primary-100:  #dcf2c7   /* Fondo claro */
bg-primary-200:  #bbe594   /* Success hover */
bg-primary-300:  #9dd672   /* Success active */
bg-primary-400:  #83c654   /* Success focus */
bg-primary-500:  #6bb52e   /* Verde principal */
bg-primary-600:  #5ca425   /* Verde oscuro */
bg-primary-700:  #4e8c1f   /* 🎯 BOTONES PRINCIPALES */
bg-primary-800:  #417419   /* 🎯 BOTONES HOVER */
bg-primary-900:  #365c14   /* Verde muy oscuro */

/* Text Colors */
text-primary-700: #4e8c1f   /* Texto primario */
text-primary-800: #417419   /* Texto primario oscuro */
text-slate-900:   #0f172a   /* Texto principal */
text-slate-600:   #475569   /* Texto secundario */
text-slate-400:   #94a3b8   /* Texto muted */

/* Background Colors */
bg-slate-50:      #f8fafc   /* Fondo claro */
bg-slate-100:     #f1f5f9   /* Fondo secundario */
bg-slate-800:     #1e293b   /* Fondo oscuro */
bg-white:         #ffffff   /* Fondo blanco */
```

### **Colores Semánticos**

```css
/* Success States */
bg-green-50:      #f0fdf4   /* Success fondo */
bg-green-600:     #16a34a   /* Success principal */
text-green-600:   #16a34a   /* Success texto */

/* Error States */
bg-red-50:        #fef2f2   /* Error fondo */
bg-red-600:       #dc2626   /* Error principal */
text-red-600:     #dc2626   /* Error texto */

/* Warning States */
bg-amber-50:      #fffbeb   /* Warning fondo */
bg-amber-600:     #d97706   /* Warning principal */
text-amber-600:   #d97706   /* Warning texto */

/* Info States */
bg-blue-50:       #eff6ff   /* Info fondo */
bg-blue-600:      #2563eb   /* Info principal */
text-blue-600:    #2563eb   /* Info texto */
```

### **Uso de Botones - Ejemplos Prácticos**

```jsx
// Botón Primario (Verde Oliva)
<button className="bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg font-medium transition-colors">
  Guardar
</button>

// Botón Secundario
<button className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
  Cancelar
</button>

// Botón de Peligro
<button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
  Eliminar
</button>

// Botón Outline
<button className="border-2 border-primary-700 text-primary-700 hover:bg-primary-700 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors">
  Editar
</button>
```

### **Sistema de Design Tokens**

```css
/* Spacing */
spacing-1: 0.25rem (4px)
spacing-2: 0.5rem (8px)
spacing-3: 0.75rem (12px)
spacing-4: 1rem (16px)
spacing-6: 1.5rem (24px)
spacing-8: 2rem (32px)

/* Typography */
text-xs: 0.75rem (12px)
text-sm: 0.875rem (14px)
text-base: 1rem (16px)
text-lg: 1.125rem (18px)
text-xl: 1.25rem (20px)
text-2xl: 1.5rem (24px)

/* Border Radius */
rounded-sm: 0.125rem (2px)
rounded: 0.25rem (4px)
rounded-lg: 0.5rem (8px)
rounded-xl: 0.75rem (12px)
rounded-2xl: 1rem (16px)
```

---

## 📋 Menú del Sistema - Funcionalidades Frontend

### **🏠 Dashboard**

- **Descripción**: Panel principal con resumen del sistema
- **Componentes**: `DashboardPage.jsx`, `StatsCard.jsx`, `Chart.jsx`
- **Funcionalidades**:
  - Estadísticas en tiempo real con WebSocket
  - Gráficos interactivos con Chart.js o Recharts
  - Novedades recientes con actualización automática
  - Estado de personal y vehículos con indicadores visuales
  - KPIs con tarjetas animadas
  - Filtros por rango de fechas

### **👥 Administración**

#### **Usuarios**

- **Descripción**: Gestión de cuentas de usuario
- **Componentes**: `UsersPage.jsx`, `UserForm.jsx`, `UserCard.jsx`
- **Funcionalidades**:
  - CRUD completo de usuarios
  - Asignación de roles y permisos con checkboxes
  - Resetear contraseñas con confirmación modal
  - Activar/desactivar cuentas con toggle switch
  - Historial de actividad con timeline
  - Búsqueda y filtrado avanzado
  - Paginación con infinite scroll

#### **Roles**

- **Descripción**: Definición de roles y permisos
- **Componentes**: `RolesPage.jsx`, `RoleForm.jsx`, `PermissionsTree.jsx`
- **Funcionalidades**:
  - Crear roles personalizados con nombre y descripción
  - Asignar permisos específicos con árbol jerárquico
  - Gestión de jerarquías con drag & drop
  - Permisos por módulo con agrupación visual
  - Vista previa de permisos antes de guardar

#### **Permisos**

- **Descripción**: Configuración granular de permisos
- **Componentes**: `PermissionsPage.jsx`, `PermissionCard.jsx`
- **Funcionalidades**:
  - Definir permisos del sistema con slugs
  - Asignar a roles múltiples con bulk actions
  - Validación de acceso con feedback visual
  - Auditoría de permisos con logs de cambios

### **👤 Personal**

- **Descripción**: Gestión del personal policial
- **Componentes**: `PersonalPage.jsx`, `PersonalCard.jsx`, `PersonalForm.jsx`
- **Funcionalidades**:
  - Registro de personal con foto upload
  - Información personal y profesional en tabs
  - Asignación de equipamiento con dropdown
  - Historial de operativos con timeline visual
  - Estado de disponibilidad con badges
  - Búsqueda por nombre, DNI, placa

### **🚗 Vehículos**

- **Descripción**: Gestión de flota vehicular
- **Componentes**: `VehiculosPage.jsx`, `VehiculoCard.jsx`, `MaintenanceForm.jsx`
- **Funcionalidades**:
  - Registro de vehículos con imagen gallery
  - Mantenimiento y reparaciones con calendar
  - Asignación de tripulación con drag & drop
  - Seguimiento GPS con mapa integrado
  - Historial de operativos con export CSV
  - Control de combustible con gráficos

### **🚨 Novedades**

- **Descripción**: Sistema central de incidentes
- **Componentes**: `NovedadesPage.jsx`, `NovedadCard.jsx`, `NovedadModal.jsx`
- **Funcionalidades**:
  - Registro de novedades con formulario multistep
  - Clasificación por tipo y subtipo con autocomplete
  - Seguimiento de estado con status badges
  - Asignación a operativos con suggestions
  - Historial completo con expandable rows
  - Reportes y estadísticas con filters
  - Mapa de incidentes con clustering

### **📍 Calles**

#### **Calles**

- **Descripción**: Gestión del catastro vial
- **Componentes**: `CallesPage.jsx`, `CalleForm.jsx`, `CalleMap.jsx`
- **Funcionalidades**:
  - Registro de calles con validación de nombres
  - Tipos de vía con dropdown multiselect
  - Nomenclatura oficial con formato automático
  - Estado de conservación con rating stars
  - Conexiones entre calles con graph visual

#### **Sectores**

- **Descripción**: División territorial en sectores
- **Componentes**: `SectoresPage.jsx`, `SectorForm.jsx`, `SectorMap.jsx`
- **Funcionalidades**:
  - Definición de sectores con dibujo en mapa
  - Asignación de calles con drag & drop
  - Delimitación geográfica con coordinates
  - Responsables por sector con user picker

#### **Cuadrantes**

- **Descripción**: División operativa en cuadrantes
- **Componentes**: `CuadrantesPage.jsx`, `CuadranteForm.jsx`, `CuadranteGrid.jsx`
- **Funcionalidades**:
  - Creación de cuadrantes con grid overlay
  - Asignación a sectores con dropdown
  - Definición de límites con polygon drawing
  - Priorización de atención con color coding

### **📋 Catálogos**

#### **Unidades/Oficinas**

- **Descripción**: Unidades organizacionales
- **Componentes**: `UnidadesPage.jsx`, `UnidadForm.jsx`, `OrgChart.jsx`
- **Funcionalidades**:
  - Registro de unidades con logo upload
  - Jerarquía organizacional con tree view
  - Asignación de personal con member cards
  - Contactos y ubicación con map integration

#### **Radios TETRA**

- **Descripción**: Equipamiento de comunicación
- **Componentes**: `RadiosPage.jsx`, `RadioForm.jsx`, `RadioStatus.jsx`
- **Funcionalidades**:
  - Inventario de radios con QR codes
  - Asignación a personal con barcode scanner
  - Estado de equipos con real-time status
  - Mantenimiento con schedule calendar

#### **Tipos de Novedad**

- **Descripción**: Clasificación de incidentes
- **Componentes**: `TiposNovedadPage.jsx`, `TipoNovedadForm.jsx`, `CategoryTree.jsx`
- **Funcionalidades**:
  - Definición de categorías con drag & drop
  - Subtipos específicos con nested forms
  - Códigos de referencia con auto-generation
  - Prioridades asociadas with color coding

### **🚓 Operativos**

#### **Turnos**

- **Descripción**: Gestión de turnos operativos
- **Componentes**: `TurnosPage.jsx`, `TurnoForm.jsx`, `TurnoCalendar.jsx`
- **Funcionalidades**:
  - Creación de turnos con time picker
  - Asignación de personal con availability check
  - Asignación de vehículos con capacity validation
  - Control de horas con overtime calculation
  - Reportes de turno con export PDF

#### **Vehículos**

- **Descripción**: Operativos por vehículo
- **Componentes**: `OperativosVehiculosPage.jsx`, `VehiculoOperativoCard.jsx`
- **Funcionalidades**:
  - Despacho de vehículos con checklist
  - Asignación de cuadrantes con route optimization
  - Seguimiento en tiempo real con live tracking
  - Registro de novedades con voice notes
  - Control de combustible with fuel log

#### **Personal**

- **Descripción**: Operativos por personal
- **Componentes**: `OperativosPersonalPage.jsx`, `PersonalOperativoCard.jsx`
- **Funcionalidades**:
  - Patrullaje a pie con route tracking
  - Asignación de cuadrantes with geofencing
  - Registro de incidentes with photo upload
  - Control de tiempos with punch clock
  - Reportes de actividad with heat maps

### **📊 Reportes**

#### **Vehículos**

- **Descripción**: Reportes de flota vehicular
- **Componentes**: `ReportesVehiculosPage.jsx`, `VehicleReportChart.jsx`
- **Funcionalidades**:
  - Historial de operativos con timeline
  - Kilometraje con trend analysis
  - Consumo de combustible with cost calculation
  - Mantenimiento with predictive alerts
  - Disponibilidad with utilization metrics

#### **Auditoría**

- **Descripción**: Registro de actividades del sistema
- **Componentes**: `AuditoriaPage.jsx`, `AuditLogTable.jsx`
- **Funcionalidades**:
  - Log de accesos with IP geolocation
  - Cambios en datos with diff viewer
  - Operaciones críticas with alert badges
  - Errores del sistema with stack traces
  - Reportes de seguridad with threat analysis

---

## ⚠️ Patrones críticos — Seguir siempre

### Confirmaciones destructivas

**Nunca usar `window.confirm()` ni `alert()`**. Usar siempre `ConfirmModal` de `src/components/common`:

```jsx
const [confirmModal, setConfirmModal] = useState({ isOpen: false, item: null, loading: false });

// Abrir modal (síncrono):
const handleEliminar = (item) => setConfirmModal({ isOpen: true, item, loading: false });

// Ejecutar acción (async):
const handleConfirmEliminar = async () => {
  setConfirmModal(s => ({ ...s, loading: true }));
  try {
    await servicio.delete(confirmModal.item.id);
    toast.success("Eliminado exitosamente");
    cargarDatos();
  } catch (err) {
    toast.error(extractValidationErrors(err) || "Error al eliminar");
  } finally {
    setConfirmModal({ isOpen: false, item: null, loading: false });
  }
};

// JSX (al final del return):
<ConfirmModal
  isOpen={confirmModal.isOpen}
  title="Eliminar X"
  message={`¿Seguro de eliminar "${confirmModal.item?.nombre}"?`}
  confirmText="Eliminar"
  type="danger"          // o "warning" para reactivaciones
  loading={confirmModal.loading}
  onClose={() => setConfirmModal({ isOpen: false, item: null, loading: false })}
  onConfirm={handleConfirmEliminar}
/>
```

Para múltiples tipos de acción en un mismo componente, usar un campo `type` discriminador en el state.

### Feedback en operaciones largas

```js
const toastId = toast.loading("Generando reporte...");
try {
  await operacionLarga();
  toast.dismiss(toastId);
  toast.success("Listo");
} catch {
  toast.dismiss(toastId);
  toast.error("Error");
}
```

### Fechas en hora local (nunca UTC)

```js
const getTodayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
};
```

---

## 🔐 Seguridad y Control de Acceso Frontend

### **Sistema RBAC (Role-Based Access Control)**

```javascript
// Roles del sistema
const ROLE_SLUGS = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  OPERADOR: "operador",
  SUPERVISOR: "supervisor",
  CONSULTA: "consulta",
  USUARIO_BASICO: "usuario_basico",
};

// Permisos por módulo
const ACTION_PERMISSIONS = {
  "operativos.personal.novedades.delete": [
    "operativos.personal.novedades.delete",
  ],
  "operativos.vehiculos.novedades.delete": [
    "operativos.vehiculos.novedades.delete",
  ],
  "novedades.incidentes.create": ["novedades.incidentes.create"],
  "novedades.incidentes.update": ["novedades.incidentes.update"],
  // ... más permisos
};
```

### **Validación de Acceso Frontend**

- **Nivel de Ruta**: Protección de páginas con `ProtectedRoute`
- **Nivel de Componente**: Ocultar/mostrar elementos con `canPerformAction`
- **Nivel de API**: Validación en backend (doble verificación)
- **Nivel de Datos**: Filtros por permisos en servicios

### **Componentes de Seguridad**

```jsx
// Protected Route Component
<ProtectedRoute requiredPermission="novedades.incidentes.create">
  <NovedadesPage />
</ProtectedRoute>;

// Conditional Rendering
{
  canPerformAction(user, "operativos.personal.novedades.delete") && (
    <button onClick={handleDelete}>
      <Trash2 />
    </button>
  );
}
```

---

## 🚀 Desarrollo y Despliegue Frontend

### **Variables de Entorno**

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=City Security
VITE_VERSION=2.0.0
VITE_ENVIRONMENT=development
VITE_ENABLE_MOCK_API=false
```

### **Comandos de Desarrollo**

```bash
# Instalación de dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting del código
npm run lint

# Formato automático
npm run format

# Type checking (si usa TypeScript)
npm run type-check
```

### **Configuración Vite**

```javascript
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          ui: ["lucide-react", "react-hot-toast"],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

### **Build de Producción**

- **Output**: `dist/`
- **Optimización**: Code splitting por vendor
- **Minificación**: JavaScript y CSS con Terser
- **Hashing**: Cache busting con [hash]
- **Compression**: Gzip ready para servidor
- **Bundle Analysis**: `npm run analyze`

---

## 📞 Estructura de Componentes Reutilizables

### **Componentes Common**

```jsx
// Button.jsx - Botón reutilizable
export const Button = ({
  variant = "primary",
  size = "md",
  children,
  ...props
}) => {
  const baseClasses = "font-medium rounded-lg transition-colors";
  const variantClasses = {
    primary: "bg-primary-700 hover:bg-primary-800 text-white",
    secondary: "bg-slate-600 hover:bg-slate-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[size]} ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Modal.jsx - Modal reutilizable
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Modal content */}
      </div>
    </div>
  );
};
```

### **Custom Hooks**

```javascript
// useApi.js - Hook para llamadas API
export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(url, options);
        setData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};

// useLocalStorage.js - Hook para localStorage
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};
```

---

## 🔄 Versiones y Cambios Frontend

### **Versión Actual**: 2.x

- **Framework**: React 19.2.0 con Vite 7.2.4
- **Última Actualización**: 2026-05-24
- **Estado**: Producción activa

### **Historial de Cambios Recientes (Frontend)**

- ✅ **UX**: Migración completa `window.confirm` → `ConfirmModal` profesional en 17 archivos (mayo 2026)
- ✅ **Reportes**: Generación Excel multi-hoja con ExcelJS + gráficos Recharts incrustados
- ✅ **Dark Mode**: Homologación completa — iconos calendario, paginación, inputs de fecha
- ✅ **Novedades**: Modal de Atención rediseñado con layout de 3 filas en Tab Seguimiento
- ✅ **Operativos**: Módulo completo — turnos, vehículos, personal, cuadrantes por vehículo
- ✅ **Permisos**: Módulo PermisosPage con CRUD completo y protección `es_sistema`
- ✅ **Direcciones**: Geocodificación, código `D-XXXXXX`, modal de ajuste en mapa, reactivación
- ✅ **Fechas**: Corrección de desfase UTC → hora local en todos los inputs de fecha
- ✅ **Feedback**: Toast inmediato en Exportar Excel con loading state

### **Technical Debt Pendiente**

- 🔄 `NovedadesPage.jsx` monolito ~5000 líneas — refactor modular pendiente
- 🔄 Bundle size > 2.6 MB (ExcelJS domina el chunk)
- 🔄 Sin tests unitarios ni e2e (Playwright y Vitest instalados, sin specs)
- 🔄 TypeScript opcional — no migrar sin decisión explícita

---

## 🎯 Mejores Prácticas Frontend

### **Performance**

- **Lazy Loading**: Componentes y rutas bajo demanda
- **Memoization**: React.memo y useMemo para renderizados costosos
- **Code Splitting**: División del bundle por rutas
- **Image Optimization**: WebP y lazy loading para imágenes
- **Bundle Analysis**: Monitoreo regular del tamaño del bundle

### **Accesibilidad**

- **Semantic HTML**: Uso correcto de elementos semánticos
- **ARIA Labels**: Etiquetas para screen readers
- **Keyboard Navigation**: Navegación completa con teclado
- **Color Contrast**: Contraste WCAG AA compliance
- **Focus Management**: Manejo adecuado del foco en modales

### **SEO (si aplica)**

- **Meta Tags**: Descripciones y títulos dinámicos
- **Structured Data**: Schema.org para contenido
- **Open Graph**: Compartir en redes sociales
- **Sitemap**: Generación automática de sitemap

---

_Este documento está diseñado específicamente para agentes AI que trabajen en el frontend del proyecto City Security Frontend V2, proporcionando toda la información necesaria para desarrollo, mantenimiento y extensión de la aplicación._
