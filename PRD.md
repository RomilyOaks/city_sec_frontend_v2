# PRD — CitySecure: Sistema de Seguridad Ciudadana (Frontend v2)

**Documento:** Product Requirements Document  
**Versión:** 1.5  
**Fecha:** 2026-05-21  
**Estado:** Activo  
**Autor:** Romily Robles  
**Repositorio Frontend:** [RomilyOaks/city_sec_frontend_v2](https://github.com/RomilyOaks/city_sec_frontend_v2)  
**Repositorio Backend:** [RomilyOaks/city_sec_backend_claude](https://github.com/RomilyOaks/city_sec_backend_claude)  
**URL Producción:** `https://citysecfrontendv2-production.up.railway.app`

---

## 1. Visión General del Producto

**CitySecure** es un sistema web de gestión de seguridad ciudadana diseñado para municipalidades peruanas. Permite registrar, monitorear y analizar incidentes (novedades), gestionar turnos operativos del serenazgo, asignar personal y vehículos a patrullajes, y visualizar toda la actividad en un mapa interactivo en tiempo real.

### 1.1 Objetivo Principal

Digitalizar y centralizar la operación diaria del serenazgo municipal: desde la asignación de turnos y patrullajes, hasta el registro de incidentes y la generación de reportes para la toma de decisiones.

### 1.2 Usuarios Objetivo

| Rol | Descripción |
|-----|-------------|
| `super_admin` | Acceso total al sistema. Gestiona usuarios, roles y permisos |
| `admin` | Gestión de usuarios y configuración |
| `supervisor` | Supervisa turnos operativos y personal |
| `operador` | Crea y gestiona turnos operativos |
| `radio_operador` | Registra novedades/incidentes en tiempo real |
| `consulta` | Solo lectura de novedades y reportes |
| `usuario_basico` | Acceso mínimo, sin adjuntos |

---

## 2. Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework UI | React | 19.x |
| Build Tool | Vite + SWC | 7.x |
| Estilos | TailwindCSS | 3.x |
| Routing | React Router DOM | 7.x |
| Estado servidor | TanStack React Query | 5.x |
| Estado cliente | Zustand | 5.x |
| Formularios | React Hook Form + Zod | 7.x / 4.x |
| HTTP Client | Axios | 1.x |
| Mapas | React Leaflet + Leaflet | 5.x / 1.9.x |
| Clústeres mapa | react-leaflet-cluster | 4.x |
| Gráficos | Recharts | 3.x |
| Iconos | lucide-react | 0.56x |
| Notificaciones | react-hot-toast | 2.x |
| Exportar PDF | jsPDF + html2canvas | 3.x / 1.4.x |
| Exportar Excel | xlsx (SheetJS) | 0.18.x |
| Linting | ESLint 9 | 9.x |
| Tests E2E | Playwright | 1.x |
| Tests unitarios | Vitest | 1.x |

### 2.1 Variables de Entorno

```bash
VITE_API_URL=https://citysecbackendclaude-production.up.railway.app/api/v1  # Producción
VITE_API_URL=http://localhost:3000/api/v1                                     # Desarrollo local
VITE_APP_TIMEZONE=America/Lima
VITE_DEFAULT_CURRENCY=PEN
VITE_DEBUG=false
```

---

## 3. Arquitectura Frontend

### 3.1 Estructura de Directorios (src/)

```
src/
├── main.jsx
├── App.jsx
├── routes/
│   ├── AppRouter.jsx
│   └── ProtectedRoute.jsx
├── layouts/
│   └── AppShell.jsx
├── pages/
│   ├── auth/            LoginPage, SignupPage
│   ├── dashboard/       DashboardPage
│   ├── novedades/       NovedadesPage (formulario completo + rápido + listado)
│   ├── personal/        PersonalPage
│   ├── vehiculos/       VehiculosPage
│   ├── operativos/      OperativosTurnoPage, vehiculos/, personal/
│   │                    ReportesOperativosPage.jsx  ← reporte Excel por turnos
│   ├── reportes-operativos/  ReportesOperativosDashboardPage
│   │                         NovedadesNoAtendidasPage, OperativosPiePage, OperativosVehicularesPage
│   ├── calles/          TiposViaPage, CallesCuadrantesPage
│   ├── catalogos/       RadiosTetraPage, TiposSubtiposNovedadPage, UnidadesOficinaPage
│   ├── direcciones/     DireccionesEliminadasPage
│   ├── admin/           AdminUsuariosPage, RolesPermisosPage, PermisosPage
│   └── NotFoundPage
├── components/
│   ├── common/
│   │   ├── ThemeToggle.jsx
│   │   ├── ThemeApplier.jsx
│   │   └── FotoViewerModal.jsx      ← visor de fotos a pantalla completa (NUEVO)
│   ├── admin/permisos/
│   │   ├── CrearPermisoModal.jsx
│   │   ├── EditarPermisoModal.jsx
│   │   └── VerPermisoModal.jsx      ← modal de consulta solo lectura (NUEVO)
│   ├── novedades/
│   ├── vehiculos/
│   ├── calles/
│   ├── catalogos/
│   ├── direcciones/
│   ├── MapaIncidentes.jsx
│   ├── NovedadDetalleModal.jsx      ← modal principal con adjuntos + RBAC
│   └── ChangePasswordModal.jsx
├── hooks/
│   └── useNovedadesStream.js        ← SSE stream en tiempo real
├── services/
│   ├── api.js                       ← Axios con interceptor JWT
│   ├── authService.js
│   └── [módulos].js
├── store/
│   └── useAuthStore.js              ← Zustand (token, user, permisos, helpers RBAC)
├── rbac/
│   └── rbac.js                      ← ACTION_PERMISSIONS, ROUTE_PERMISSIONS
└── utils/
    ├── dateHelper.js                ← formatForDisplay (timezone Lima)
    └── usuarioUtils.js
```

### 3.2 Autenticación

- **Método:** JWT Bearer Token (2h expiración)
- **Header:** `Authorization: Bearer <token>`
- **Guard:** `ProtectedRoute.jsx` valida token y permisos RBAC
- **Refresh:** El token expira en 2h; el usuario debe re-autenticarse

### 3.3 Control de Acceso (RBAC)

Permisos granulares por módulo con el patrón `modulo.recurso.accion`:

```
novedades.incidentes.create
novedades.fotos.viewer          ← controla si backend envía fotos_adjuntas
novedades.fotos.downloader      ← controla botón de descarga en FotoViewerModal
novedades.audio.player          ← controla si backend envía parte_adjuntos
operativos_turnos.create
admin.manage
```

El `super_admin` tiene acceso total automático (bypass de todos los guards).

### 3.4 Tiempo Real (SSE)

El stream `GET /api/v1/novedades/stream?token=<jwt>` emite el evento `nueva_novedad` con la estructura completa del incidente. El hook `useNovedadesStream.js` gestiona la conexión con reconexión automática cada 5s.

**Deduplicación de toasts SSE:**
- **Form completo** → muestra solo toast verde ✅ (SSE suprimido con `isCreatingManually` ref)
- **Form rápido** → muestra solo toast SSE 🚨 (feedback intencional)
- **Voice Gateway / otro usuario** → toast SSE 🚨 en todos los operadores conectados

---

## 4. Módulos Funcionales

### 4.1 Autenticación

**Páginas:** `LoginPage`, `SignupPage`  
**Funcionalidades:**
- Login con usuario y contraseña → JWT almacenado en Zustand (persistido en localStorage)
- Protección de rutas autenticadas
- Cambio de contraseña (modal)
- Logout y limpieza de estado

---

### 4.2 Dashboard

**Página:** `DashboardPage`  
**Funcionalidades:**
- KPIs de novedades por período (día, semana, mes)
- Gráficos con Recharts: novedades por tipo, sector, prioridad
- Exportación de gráficos con captura DOM + layout side-by-side
- Nombres de archivo dinámicos en exportación
- Últimas novedades registradas

---

### 4.3 Novedades (Incidentes)

**Endpoint base:** `/api/v1/novedades`  
**Funcionalidades:**
- Listado con filtros: fecha, estado, prioridad, sector, tipo, búsqueda
- Ordenamiento dinámico (`sort` + `order`)
- Paginación (`page` + `limit`)
- **Modal de detalle** (`NovedadDetalleModal`) con 5 pestañas:
  - Datos Básicos, Ubicación, Reportante, Recursos, Seguimiento
- Registro de novedad (form completo y form rápido)
- Exportar a Excel y PDF

**Pestaña Reportante — Adjuntos de la App Vecino Alerta:**

La app móvil "Alerta Chorrillos" puede adjuntar hasta 2 fotos y 1 audio por novedad. Estos se muestran en la pestaña Reportante bajo control RBAC:

| Permiso | Efecto |
|---------|--------|
| `novedades.fotos.viewer` | Muestra las miniaturas de fotos (backend también redacta el campo) |
| `novedades.fotos.downloader` | Muestra botón ⬇ en el `FotoViewerModal` |
| `novedades.audio.player` | Muestra el player `<audio>` (backend también redacta el campo) |

**Campos de adjuntos en la novedad:**
```json
{
  "fotos_adjuntas": [{ "url": "...", "nombre": "foto_001.jpg", "tipo": "image/jpeg", "tamaño_bytes": 204800 }],
  "parte_adjuntos":  [{ "url": "...", "nombre": "audio_001.m4a", "tipo": "audio/mp4", "duracion_seg": 45 }]
}
```

**Política de acceso por rol:**

| Rol | Ver fotos | Descargar | Escuchar audio |
|-----|:---------:|:---------:|:--------------:|
| `super_admin` / `admin` / `supervisor` | ✅ | ✅ | ✅ |
| `operador` / `consulta` / `radio_operador` | ✅ | ❌ | ✅ |
| `usuario_basico` | ❌ | ❌ | ❌ |

---

### 4.4 Visor de Fotos (`FotoViewerModal`)

**Componente:** `src/components/common/FotoViewerModal.jsx`  
**Funcionalidades:**
- Visualización a pantalla completa con overlay
- **Header fijo** con datos de la novedad (no cambia al navegar):
  - `#novedad_code` + título tipo/subtipo
  - Dirección en color ámbar (`localizacion + referencia_ubicacion`)
  - Fecha/Hora de Ocurrencia
- Navegación entre fotos con botones ← → y teclado `ArrowLeft` / `ArrowRight`
- Contador de fotos (N / total)
- Miniaturas de navegación rápida cuando hay múltiples fotos
- Botón de descarga (solo si `puedeDescargar`)
- Cierre con botón X, clic en overlay o `Escape`
- **Escape coordinado:** usa `document.body.setAttribute("data-foto-viewer-open", "true")` para evitar que el modal padre se cierre al presionar Escape
- Responsive a Light/Dark mode

---

### 4.5 Mapa de Incidentes

**Componente:** `MapaIncidentes`  
**Funcionalidades:**
- Mapa interactivo con React-Leaflet
- Marcadores agrupados (clusters) con `react-leaflet-cluster`
- Visualización de novedades georeferenciadas
- Filtro temporal en el mapa
- Búsqueda de ubicación por ubigeo

---

### 4.6 Personal de Seguridad

**Página:** `PersonalPage`  
**Funcionalidades:**
- Listado de personal (serenos, policías, vigilantes)
- CRUD completo de personal

---

### 4.7 Operativos de Patrullaje

Sistema jerárquico de 4 niveles:

```
Turno Operativo
    └─ Vehículos / Personal Asignado
        └─ Cuadrantes Patrullados
            └─ Novedades/Incidentes Atendidos
```

| Sub-módulo | Endpoint base |
|-----------|--------------|
| Turnos | `/api/v1/operativos` |
| Vehículos | `/api/v1/operativos/:turnoId/vehiculos` |
| Personal | `/api/v1/operativos/:turnoId/personal` |
| Cuadrantes | `.../vehiculos/:vehiculoId/cuadrantes` |
| Novedades en cuadrante | `.../cuadrantes/:cuadranteId/novedades` |

---

### 4.8 Reporte de Operativos de Patrullaje (Excel)

**Acceso:** Operativos de Patrullaje → botón naranja **"Reportes"**  
**Página:** `src/pages/operativos/ReportesOperativosPage.jsx`  
**Servicio:** `src/services/reportesOperativosService.js` → `buildReporteData()`

#### Flujo de dos pasos

**Paso 1 — "Generar Reporte"** (botón naranja):
- Realiza múltiples llamadas al backend en cascada:
```
GET /api/v1/operativos?fecha_inicio=...&fecha_fin=...&turno=...&sector_id=...&limit=1000
  └─ Por cada turno:
      GET /api/v1/operativos/{id}/vehiculos
      GET /api/v1/operativos/{id}/personal
        └─ Por cada vehículo/personal:
            GET .../cuadrantes
              └─ Por cada cuadrante:
                  GET .../novedades   ← datos completos guardados en memoria
```
- Resultado en `reporteData` (estado local, nunca sale al backend de nuevo)
- Muestra grid resumen: Total Turnos, Recursos, Cuadrantes, Novedades

**Paso 2 — "Exportar a Excel"** (botón verde, aparece tras generar):
- **NO llama al backend** — usa `reporteData` en memoria
- Genera Excel localmente con `xlsx` (SheetJS)
- Nombre del archivo: `Reporte_Operativos_Patrullaje_YYYY-MM-DD.xlsx`

#### Estructura del Excel (6 hojas)

| Hoja | Columnas | Contenido |
|------|----------|-----------|
| **Resumen** | 2 | KPIs totales + filtros aplicados |
| **Sectores** | 9 | Un registro por turno (fecha, operador, supervisor, estado) |
| **Detalle Vehículos** | 29 | Placa, km, combustible, conductor, copiloto, radio TETRA |
| **Patrullaje a Pie** | 11 | Personal a pie por turno |
| **Cuadrantes Patrullados** | 11 | Hora entrada/salida, tiempo en minutos, novedades por cuadrante |
| **Novedades** | 26 | Código, fechas, tipo/subtipo, descripción, dirección, estado, prioridad, resultado, observaciones atención, reportante, contexto operativo, cuadrante |

#### Filtros disponibles

| Filtro | Tipo | Aplicación |
|--------|------|-----------|
| Fecha Inicio / Fin | date | Backend (query param) |
| Turno | MAÑANA/TARDE/NOCHE/todos | Backend (query param) |
| Sector | select desde catálogo | Backend (query param) |
| Tipo de Recurso | VEHICULO/PERSONAL/todos | Frontend (filtra el array local) |

---

### 4.9 Reportes de Análisis (Dashboard de Reportes)

**Acceso:** menú lateral → "Reportes de Operativos"  
**Páginas:** `src/pages/reportes-operativos/`

A diferencia del §4.8, este módulo genera el Excel **en el backend** (devuelve un blob) y ofrece análisis estadístico con gráficos.

#### Sub-módulos

| Página | Descripción | Export |
|--------|-------------|--------|
| `ReportesOperativosDashboardPage` | Dashboard KPIs + gráficos, exporta todos los operativos combinados | Backend blob → `.xlsx` |
| `OperativosVehicularesPage` | Listado detallado de operativos vehiculares con filtros | Backend blob → `.xlsx` |
| `OperativosPiePage` | Listado de operativos a pie con filtros | Backend blob → `.xlsx` |
| `NovedadesNoAtendidasPage` | Novedades pendientes de atención | Backend blob → `.xlsx` |

**Endpoints de exportación (backend genera el archivo):**
```
GET /api/v1/reportes-operativos/combinados/exportar?fecha_inicio=...&formato=excel
GET /api/v1/reportes-operativos/vehiculares/exportar
GET /api/v1/reportes-operativos/pie/exportar
GET /api/v1/reportes-operativos/novedades-no-atendidas/exportar
```

---

### 4.10 Administración

#### 4.10.1 Usuarios (`AdminUsuariosPage`)
- Listado, crear, editar, desactivar usuarios
- Asignar roles

#### 4.10.2 Roles (`RolesPermisosPage`)
- Gestión de roles RBAC
- Asignación de permisos por módulo

#### 4.10.3 Permisos del Sistema (`PermisosPage`)
- Grid de permisos con columnas: Slug, Módulo, Recurso, Acción, Estado, Acciones
- **Fila cliqueable** → abre `VerPermisoModal` (solo lectura con descripción completa)
- Filtros: búsqueda por slug/descripción, módulo, recurso, estado
- Botones de filtro con soporte completo Light/Dark mode
- Edición de descripción vía `EditarPermisoModal` (campos solo-lectura con contraste correcto en dark mode)

**`VerPermisoModal`** — consulta de permiso (solo lectura):
- Slug + badge Sistema
- Módulo / Recurso / Acción en grid de 3 columnas
- Descripción completa
- Estado (badge colorido)

---

## 5. Catálogos del Sistema

| Catálogo | Endpoint |
|----------|---------|
| Ubigeo | `GET /api/v1/catalogos/ubigeo` |
| Tipos de novedad | `GET /api/v1/catalogos/tipos-novedad` |
| Sectores | `GET /api/v1/catalogos/sectores` |
| Estados operativos | `GET /api/v1/catalogos/estados-operativos` |
| Vehículos | `GET /api/v1/vehiculos` |
| Personal | `GET /api/v1/personal-seguridad` |
| Radios TETRA | `GET /api/v1/catalogos/radios-tetra` |
| Cuadrantes | `GET /api/v1/catalogos/cuadrantes` |
| Tipos copiloto | `GET /api/v1/catalogos/tipos-copiloto` |

---

## 6. Formato de Respuesta API

```json
// Éxito
{ "success": true, "data": {}, "pagination": { "total": 500, "page": 1, "limit": 20, "totalPages": 25 } }

// Error
{ "success": false, "message": "...", "errors": [{ "field": "campo", "message": "..." }] }
```

---

## 7. Requisitos No Funcionales

| Requisito | Detalle |
|-----------|---------|
| **Timezone** | America/Lima (UTC-5) — `formatForDisplay()` en `dateHelper.js` |
| **Moneda** | PEN (Sol peruano) |
| **Idioma** | Español (es-PE) |
| **Responsive** | Mobile-first con TailwindCSS |
| **Dark/Light mode** | Toggle de tema global; todos los componentes respetan `dark:` variants |
| **Tiempo real** | SSE con reconexión automática (useNovedadesStream) |
| **Auth expiración** | 2h JWT; redirige a login al expirar |
| **Seguridad** | Tokens en Zustand persist (localStorage) |

---

## 8. Despliegue (Producción)

| Aspecto | Detalle |
|---------|---------|
| **Plataforma** | Railway.app |
| **Servidor web** | Caddy (SPA routing con `try_files`) |
| **Build** | `npm run build` → directorio `dist/` |
| **Configuración** | `nixpacks.toml` + `Caddyfile` |
| **Puerto** | Variable `$PORT` de Railway (default: 8080) |
| **HTTPS** | Gestionado por Railway automáticamente |
| **Backend URL prod** | `https://citysecbackendclaude-production.up.railway.app/api/v1` |

```bash
npm run dev       # Desarrollo (puerto 5173, polling Windows)
npm run build     # Build de producción
npm run lint      # ESLint 9 (0 errores activos)
```

---

## 9. Estado del Proyecto

**Código fuente:** ✅ Completo en GitHub y workspace local  
**Dependencias:** ✅ 544 paquetes instalados (Node v24.15.0 / npm v11.12.1)  
**ESLint:** ✅ 0 errores (44 warnings pre-existentes de exhaustive-deps)  
**Build:** ✅ Compilación exitosa en producción  
**Deploy:** ✅ Railway (Caddy) — activo

---

## 10. Decisiones de Diseño

| Decisión | Razón |
|----------|-------|
| Vite + SWC | Build más rápido, menor overhead que CRA |
| Caddy en producción | Servidor confiable, soporte nativo SPA, integrado con Railway |
| `usePolling: true` en vite.config | HMR estable en Windows |
| Zustand sobre Redux | Menor boilerplate, API simple |
| TanStack Query | Invalidación, prefetch, deduplicación de requests |
| SSE sobre WebSockets | Unidireccional (servidor → cliente), más simple, soportado sin libs extra |
| `data-foto-viewer-open` en body | Coordinación de Escape entre múltiples handlers de `window.keydown` sin acoplamiento entre componentes |
| RBAC adjuntos en frontend + backend | Doble guardia: backend redacta campos null sin permiso; frontend evita renders innecesarios |

---

## 11. Issues Resueltos

| Issue | Solución | Commit |
|-------|----------|--------|
| Código fuente perdido (reinstalación Windows) | Recuperado desde GitHub | — |
| Triggers MySQL con `DEFINER='root'@'%'` | Script `fix_definer_triggers.sql` | backend |
| Toast SSE duplicado al crear novedad internamente | Guard `isCreatingManually` ref en callback SSE | `cbc0dec` |
| Escape en FotoViewerModal cerraba modal principal | `data-foto-viewer-open` en `document.body` | `3ba581d` |
| Permisos del Sistema: dark mode invisible en botones | Añadir `text-slate-700 dark:text-slate-200` | `83bffdd` |
| EditarPermisoModal: texto invisible en dark mode | Añadir `text-slate-900 dark:text-slate-100` a campos read-only | `dfe46d4` |
| ESLint 9: `--ignore-path` obsoleto | Script lint actualizado a `eslint .` | `cbc0dec` |
| `process` no definido en playwright.config | Globals Node añadidos en eslint.config.js | `cbc0dec` |
| HMR intermitente en Windows | `usePolling: true` en vite.config.js | preexistente |
| Error 502 en Railway | Puerto 8080 en Caddyfile | preexistente |
| Hoja Novedades ausente del Excel de Reportes Operativos | `buildReporteData` guardaba solo el conteo, no el array; fix almacena `novedades[]` en cada cuadrante | `a7059eb` |
| Modal Atención dark mode: inputs invisibles | `dark:bg-slate-950/40` → `dark:bg-slate-800`; ícono calendario con `filter: invert(1)` en `index.css` | `444741a` |
| Dropdown Estado novedad mostraba todos los estados | Filtro usaba `selectedNovedad?.estado_novedad_id` (podía ser undefined); cambiado a `estadoOriginalId` | `444741a` |

---

## 12. Componentes y Servicios Nuevos (2026-05-14 → 2026-05-21)

| Componente / Servicio | Ruta | Descripción |
|----------------------|------|-------------|
| `FotoViewerModal` | `src/components/common/FotoViewerModal.jsx` | Visor de fotos a pantalla completa, header de novedad, carrusel, RBAC descarga |
| `VerPermisoModal` | `src/components/admin/permisos/VerPermisoModal.jsx` | Consulta de permiso en solo lectura |
| Adjuntos en `NovedadDetalleModal` | pestaña Reportante | Fotos (miniaturas) + audio (`<audio>`) con control RBAC |
| Reporte Excel operativos (fix) | `src/services/reportesOperativosService.js` | Fix: novedades completas guardadas en cuadrante; hoja Novedades ahora generada |

---

## 13. Comparativa de Sistemas de Reportes

| Característica | §4.8 Reporte Patrullaje (Excel) | §4.9 Reportes de Análisis |
|---------------|--------------------------------|--------------------------|
| **Acceso** | Operativos de Patrullaje → "Reportes" | Menú "Reportes de Operativos" |
| **Página** | `ReportesOperativosPage.jsx` | `ReportesOperativosDashboardPage.jsx` + sub-páginas |
| **Genera Excel** | Frontend con `xlsx` (datos en memoria) | Backend → blob binario |
| **Datos** | Cascada de endpoints en tiempo real | Endpoints especializados de reportes |
| **Hojas Excel** | 6 (Resumen, Sectores, Vehículos, Pie, Cuadrantes, Novedades) | 1 por tipo de reporte |
| **Gráficos** | No | Sí (Recharts, exportables a imagen) |
| **Filtros** | Fecha, Turno, Sector, Tipo Recurso | Fecha, Turno, Sector, Prioridad, Estado |
| **Uso típico** | Informe diario de operativos de un turno | Análisis estadístico y tendencias |

---

*Actualizado: 2026-05-21*
