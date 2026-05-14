# PRD — CitySecure: Sistema de Seguridad Ciudadana (Frontend v2)

**Documento:** Product Requirements Document  
**Versión:** 1.0  
**Fecha:** 2026-05-12  
**Estado:** Activo  
**Autor:** Romily Robles  
**Repositorio Backend:** [RomilyOaks/city_sec_backend_claude](https://github.com/RomilyOaks/city_sec_backend_claude)

---

## 1. Visión General del Producto

**CitySecure** es un sistema web de gestión de seguridad ciudadana diseñado para municipalidades peruanas. Permite registrar, monitorear y analizar incidentes (novedades), gestionar turnos operativos del serenazgo, asignar personal y vehículos a patrullajes, y visualizar toda la actividad en un mapa interactivo en tiempo real.

### 1.1 Objetivo Principal

Digitalizar y centralizar la operación diaria del serenazgo municipal: desde la asignación de turnos y patrullajes, hasta el registro de incidentes y la generación de reportes para la toma de decisiones.

### 1.2 Usuarios Objetivo

| Rol | Descripción |
|-----|-------------|
| **Administrador** | Gestiona usuarios, roles y permisos del sistema |
| **Supervisor** | Supervisa turnos operativos y personal |
| **Operador** | Crea y gestiona turnos operativos |
| **Sereno / Personal** | Registra incidentes en cuadrantes durante patrullaje |
| **Analista** | Consulta reportes y estadísticas del dashboard |

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
├── main.jsx                    # Punto de entrada React
├── setupTests.js               # Configuración Vitest
├── routes/
│   ├── AppRouter.jsx           # Enrutamiento principal
│   └── ProtectedRoute.jsx      # Guard para rutas autenticadas (RBAC)
├── layouts/
│   └── AppShell.jsx            # Layout principal con sidebar y header
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   └── SignupPage.jsx
│   ├── dashboard/
│   │   └── DashboardPage.jsx
│   ├── personal/
│   │   └── PersonalPage.jsx
│   ├── admin/
│   │   ├── AdminUsuariosPage.jsx
│   │   └── RolesPermisosPage.jsx
│   └── NotFoundPage.jsx
├── components/
│   ├── common/
│   │   ├── ThemeToggle.jsx     # Toggle dark/light mode
│   │   └── ThemeApplier.jsx    # Aplicador de tema global
│   ├── MapaIncidentes.jsx      # Mapa interactivo Leaflet
│   ├── NovedadDetalleModal.jsx # Modal detalle de novedad
│   └── ChangePasswordModal.jsx # Modal cambio de contraseña
└── services/
    ├── api.js                  # Instancia Axios configurada
    ├── authService.js          # Autenticación JWT
    └── [módulos].js            # Servicios por módulo
```

### 3.2 Autenticación

- **Método:** JWT Bearer Token
- **Header:** `Authorization: Bearer <token>`
- **Guard:** `ProtectedRoute.jsx` valida token y permisos RBAC antes de renderizar cada ruta

### 3.3 Control de Acceso (RBAC)

El sistema implementa control de acceso basado en roles con permisos granulares por módulo:

```
{modulo}:{accion}
Ejemplo: operativos_turnos:create, novedades:read, admin:manage
```

---

## 4. Módulos Funcionales

### 4.1 Autenticación

**Páginas:** `LoginPage`, `SignupPage`  
**Funcionalidades:**
- Login con usuario y contraseña → JWT
- Protección de rutas autenticadas
- Cambio de contraseña (modal)
- Logout y limpieza de estado

---

### 4.2 Dashboard

**Página:** `DashboardPage`  
**Funcionalidades:**
- KPIs de novedades por período (día, semana, mes)
- Gráficos con Recharts: novedades por tipo, por sector, por prioridad
- Mapa de calor de incidentes
- Últimas novedades registradas

---

### 4.3 Novedades (Incidentes)

**Endpoint base:** `GET/POST/PUT/DELETE /api/v1/novedades`  
**Funcionalidades:**
- Listado con filtros: fecha, estado, prioridad, sector, tipo
- Ordenamiento dinámico (`sort` + `order`): por código, fecha, prioridad
- Paginación (`page` + `limit`)
- Modal de detalle completo (`NovedadDetalleModal`)
- Registro de nuevo incidente con geolocalización
- Exportar a Excel (xlsx) y PDF (jsPDF)

**Prioridades:** `ALTA` | `MEDIA` | `BAJA`  
**Estados:** `ABIERTO` | `EN_PROCESO` | `CERRADO`

**Parámetros de filtro soportados:**
```
fecha_inicio, fecha_fin, estado_novedad_id, prioridad_actual,
sector_id, tipo_novedad_id, search, page, limit, sort, order
```

---

### 4.4 Mapa de Incidentes

**Componente:** `MapaIncidentes`  
**Funcionalidades:**
- Mapa interactivo con React-Leaflet
- Marcadores agrupados (clusters) con `react-leaflet-cluster`
- Visualización de novedades georeferenciadas
- Filtro temporal en el mapa
- Búsqueda de ubicación por ubigeo (departamento/provincia/distrito)

**Endpoint ubigeo:**
```
GET /api/v1/catalogos/ubigeo?ubigeo_code=150116
GET /api/v1/catalogos/ubigeo?search=LINCE&departamento=LIMA
```

---

### 4.5 Personal de Seguridad

**Página:** `PersonalPage`  
**Funcionalidades:**
- Listado de personal (serenos, policías, vigilantes)
- CRUD completo de personal
- Asignación a turnos operativos
- Visualización de historial de turnos

---

### 4.6 Operativos de Patrullaje

Sistema jerárquico de 4 niveles:

```
Turno Operativo
    └─ Vehículos / Personal Asignado
        └─ Cuadrantes Patrullados
            └─ Novedades/Incidentes Atendidos
```

#### 4.6.1 Turnos Operativos

**Endpoints:** `/api/v1/operativos`  
**Funcionalidades:**
- Crear turno (MAÑANA / TARDE / NOCHE) con fecha, sector, operador, supervisor
- Listar turnos con filtros por sector, fecha, turno
- Cerrar turno operativo
- Soft delete

**Permisos:** `operativos_turnos:create|read|update|delete|manage`

#### 4.6.2 Vehículos del Turno

**Endpoints:** `/api/v1/operativos/:turnoId/vehiculos`  
**Funcionalidades:**
- Asignar vehículo a turno (conductor, copiloto, radio tetra, combustible, km inicio)
- Cerrar asignación del vehículo (km fin, combustible fin)
- Relaciones: Vehículo, PersonalSeguridad (conductor/copiloto), TipoCopiloto, RadioTetra, EstadoOperativo

**Nivel de combustible:** `LLENO` | `3/4` | `1/2` | `1/4` | `RESERVA`

#### 4.6.3 Personal del Turno

**Endpoints:** `/api/v1/operativos/:turnoId/personal`  
**Funcionalidades:**
- Asignar personal al turno con tipo de patrullaje y equipamiento
- Registrar equipamiento: chaleco balístico, porra, esposas, linterna, kit primeros auxilios
- Cerrar asignación con hora_fin

**Tipo patrullaje:** `SERENAZGO` | `PPFF` | `GUARDIA` | `VIGILANTE` | `OTRO`

#### 4.6.4 Cuadrantes

**Endpoints:** `/api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes`  
**Funcionalidades:**
- Registrar ingreso a cuadrante (hora_ingreso)
- Registrar salida (hora_salida, incidentes_reportados)
- Campo calculado: `tiempo_minutos`

#### 4.6.5 Novedades en Cuadrante

**Endpoints:** `.../cuadrantes/:cuadranteId/novedades`  
**Funcionalidades:**
- Vincular novedad del sistema al cuadrante patrullado
- Estados de resultado: `PENDIENTE` | `RESUELTO` | `ESCALADO` | `CANCELADO`
- Prioridades: `BAJA` | `MEDIA` | `ALTA` | `URGENTE`

---

### 4.7 Administración

#### 4.7.1 Usuarios

**Página:** `AdminUsuariosPage`  
**Funcionalidades:**
- Listado de usuarios del sistema
- Crear / editar / desactivar usuarios
- Asignar roles

#### 4.7.2 Roles y Permisos

**Página:** `RolesPermisosPage`  
**Funcionalidades:**
- Gestión de roles RBAC
- Asignación de permisos granulares por módulo
- Guard de async behavior (mounted ref) para evitar setState en componentes desmontados

---

## 5. Catálogos del Sistema

Endpoints de solo lectura usados para poblar selectores/dropdowns:

| Catálogo | Endpoint |
|----------|---------|
| Ubigeo (distrito/provincia/dpto) | `GET /api/v1/catalogos/ubigeo` |
| Tipos de novedad | `GET /api/v1/catalogos/tipos-novedad` |
| Sectores | `GET /api/v1/catalogos/sectores` |
| Estados operativos | `GET /api/v1/catalogos/estados-operativos` |
| Vehículos disponibles | `GET /api/v1/vehiculos` |
| Personal disponible | `GET /api/v1/personal-seguridad` |
| Radios TETRA | `GET /api/v1/catalogos/radios-tetra` |
| Cuadrantes | `GET /api/v1/catalogos/cuadrantes` |

---

## 6. Formato de Respuesta API

### Éxito
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {},
  "pagination": { "total": 500, "page": 1, "limit": 20, "totalPages": 25 }
}
```

### Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [{ "field": "campo", "message": "error específico" }]
}
```

---

## 7. Requisitos No Funcionales

| Requisito | Detalle |
|-----------|---------|
| **Timezone** | America/Lima (UTC-5) — todas las fechas DATETIME se tratan con esta zona |
| **Moneda** | PEN (Sol peruano) |
| **Idioma** | Español (es-PE) |
| **Responsive** | Mobile-first con TailwindCSS |
| **Dark/Light mode** | Toggle de tema (ThemeToggle + ThemeApplier) |
| **Offline-ready** | Cache de catálogos con React Query |
| **Polling** | Considerar WebSockets o polling para actualizaciones en tiempo real |
| **Auth expiración** | Redirigir a login al expirar token JWT |
| **Seguridad** | Sin exposición de tokens en localStorage sin cifrado |

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

### Comandos clave

```bash
npm run dev       # Servidor de desarrollo (puerto 5173)
npm run build     # Build de producción
npm run lint      # ESLint
npm run test      # Tests con Vitest
```

---

## 9. Estado Actual del Proyecto

### ⚠️ ALERTA CRÍTICA: Código Fuente Faltante

El directorio `src/` **no existe** en el workspace actual. El código fuente fue eliminado al reinstalar Windows. Los archivos identificados por el CHANGELOG incluían:

- `src/main.jsx`
- `src/routes/AppRouter.jsx`, `ProtectedRoute.jsx`
- `src/layouts/AppShell.jsx`
- `src/pages/auth/LoginPage.jsx`, `SignupPage.jsx`
- `src/pages/dashboard/DashboardPage.jsx`
- `src/pages/personal/PersonalPage.jsx`
- `src/pages/admin/AdminUsuariosPage.jsx`, `RolesPermisosPage.jsx`
- `src/pages/NotFoundPage.jsx`
- `src/components/MapaIncidentes.jsx`
- `src/components/NovedadDetalleModal.jsx`
- `src/components/ChangePasswordModal.jsx`
- `src/components/common/ThemeToggle.jsx`, `ThemeApplier.jsx`
- `src/services/api.js`, `authService.js` + servicios por módulo

**Acciones a tomar:**
1. Recuperar `src/` desde el repositorio GitHub o backup
2. Si no hay backup: reconstruir desde cero usando este PRD como guía
3. Ejecutar `npm install` ✅ (ya realizado — 544 paquetes instalados)

### Dependencias Instaladas ✅

```
npm install   →  544 paquetes instalados (Node.js v24.15.0 / npm v11.12.1)
```

### Vulnerabilidades detectadas

```
24 vulnerabilidades (2 low, 9 moderate, 12 high, 1 critical)
Ejecutar: npm audit fix   (para las no breaking)
```

---

## 10. Decisiones de Diseño Documentadas

| Decisión | Razón |
|----------|-------|
| Vite + SWC en lugar de CRA | Build más rápido, menor overhead |
| Caddy en lugar de `serve` o Express | Servidor de producción confiable, soporte nativo SPA, integración Railway |
| Polling en vite.config.js (Windows) | HMR con `usePolling: true` para evitar problemas en Windows |
| Zustand sobre Redux | Menor boilerplate, API más simple para estado global |
| TanStack Query sobre SWR | Más features: invalidación, prefetch, deduplicación de requests |
| react-leaflet-cluster | Mejora de rendimiento con miles de marcadores en el mapa |
| Soft delete en todas las entidades | `deleted_at` + `deleted_by` para auditoría completa |

---

## 11. Issues Conocidos y Resoluciones

| Issue | Estado | Solución |
|-------|--------|----------|
| Ubigeo: `ubigeo_code` no filtrable | ✅ Resuelto (backend v2.3.0) | Parámetro `ubigeo_code` implementado en backend |
| Novedades: sin ordenamiento dinámico | ✅ Resuelto (backend v2.3.0) | Parámetros `sort` y `order` implementados |
| Vehículos: relaciones no incluidas en respuesta | ✅ Resuelto | Backend incluye objetos relacionados completos |
| RolesPermisosPage: setState en componente desmontado | ✅ Resuelto | Mounted ref guard implementado |
| HMR intermitente en Windows | ✅ Resuelto | `usePolling: true` en vite.config.js |
| Error 502 en Railway | ✅ Resuelto | Puerto 8080 configurado en Caddy |

---

*Generado a partir del análisis de documentación del proyecto — 2026-05-12*
