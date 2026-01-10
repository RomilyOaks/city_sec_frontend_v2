# 📘 Guía Técnica Frontend - Módulo de Operativos de Patrullaje

## 📋 Índice
- [Descripción General](#descripción-general)
- [Arquitectura de Datos](#arquitectura-de-datos)
- [Endpoints API](#endpoints-api)
- [Modelos de Datos](#modelos-de-datos)
- [Flujos de Trabajo](#flujos-de-trabajo)
- [Ejemplos de Integración](#ejemplos-de-integración)
- [Validaciones](#validaciones)
- [Permisos RBAC](#permisos-rbac)

---

## 📖 Descripción General

El módulo de **Operativos de Patrullaje** gestiona el ciclo completo de patrullaje vehicular con una arquitectura jerárquica de 4 niveles:

```
Turno Operativo (Operativos)
    └─ Vehículos Asignados
        └─ Cuadrantes Patrullados
            └─ Novedades/Incidentes Atendidos
```

### Flujo típico de uso:
1. **Crear Turno**: Se crea un turno operativo (día/noche) con operador y supervisor
2. **Asignar Vehículos**: Se asignan vehículos con conductor y copiloto al turno
3. **Registrar Cuadrantes**: Cada vehículo registra los cuadrantes que patrulla
4. **Registrar Novedades**: En cada cuadrante se registran incidentes/novedades atendidos

---

## 🏗️ Arquitectura de Datos

### Nivel 1: Operativos Turno
**Entidad principal** que representa un turno de patrullaje

**Endpoint base**: `/api/v1/operativos`

**Campos principales**:
- `operador_id`: Usuario que opera el turno
- `supervisor_id`: Usuario supervisor del turno
- `sector_id`: Sector/zona de patrullaje
- `fecha`: Fecha del turno
- `turno`: "MAÑANA" | "TARDE" | "NOCHE"
- `estado`: 1 (Activo) | 0 (Inactivo)

---

### Nivel 2: Operativos Vehículos
**Vehículos asignados** a un turno operativo

**Endpoint base**: `/api/v1/operativos/:turnoId/vehiculos`

**Campos principales**:
- `vehiculo_id`: ID del vehículo
- `conductor_id`: Personal de seguridad conductor
- `copiloto_id`: Personal de seguridad copiloto (opcional)
- `kilometraje_inicio`: Kilometraje al inicio del turno
- `hora_inicio`: Hora de inicio del patrullaje
- `nivel_combustible_inicio`: "LLENO" | "3/4" | "1/2" | "1/4" | "RESERVA"
- `kilometraje_fin`: Kilometraje al fin (se actualiza al cerrar turno)
- `hora_fin`: Hora de fin del patrullaje

**Campos virtuales calculados**:
- `kilometros_recorridos`: `kilometraje_fin - kilometraje_inicio`

---

### Nivel 3: Operativos Vehículos Cuadrantes
**Cuadrantes patrullados** por un vehículo durante su turno

**Endpoint base**: `/api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes`

**Campos principales**:
- `cuadrante_id`: ID del cuadrante
- `hora_ingreso`: Timestamp de ingreso al cuadrante
- `hora_salida`: Timestamp de salida (opcional)
- `observaciones`: Notas sobre el patrullaje
- `incidentes_reportados`: Resumen de incidentes (texto)

**Campos virtuales calculados**:
- `tiempo_minutos`: Minutos transcurridos entre ingreso y salida

---

### Nivel 4: Operativos Vehículos Novedades
**Novedades/incidentes** atendidos en un cuadrante

**Endpoint base**: `/api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes/:cuadranteId/novedades`

**Campos principales**:
- `novedad_id`: ID de la novedad/incidente (catálogo)
- `reportado`: Timestamp cuando se reportó
- `estado`: 1 (Activo) | 0 (Inactivo/Cerrado)
- `observaciones`: Detalles del incidente (opcional)

---

## 🔌 Endpoints API

### Base URL
```
http://localhost:3000/api/v1
```

### Autenticación
Todos los endpoints requieren token JWT en el header:
```
Authorization: Bearer <token>
```

---

## 📊 Endpoints por Entidad

### 1️⃣ OPERATIVOS TURNO

#### GET - Listar todos los turnos
```http
GET /api/v1/operativos
```

**Query params opcionales**:
- `sector_id`: Filtrar por sector
- `fecha`: Filtrar por fecha (YYYY-MM-DD)
- `turno`: Filtrar por turno (MAÑANA/TARDE/NOCHE)
- `estado`: Filtrar por estado (1/0)

**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "operador_id": 5,
      "supervisor_id": 3,
      "sector_id": 2,
      "fecha": "2026-01-10",
      "fecha_hora_inicio": "2026-01-10T06:00:00Z",
      "fecha_hora_fin": "2026-01-10T14:00:00Z",
      "turno": "MAÑANA",
      "estado": 1,
      "observaciones": "Turno normal",
      "created_at": "2026-01-10T05:00:00Z",
      "operador": { "id": 5, "nombres": "Juan", "apellidos": "Pérez" },
      "supervisor": { "id": 3, "nombres": "María", "apellidos": "López" }
    }
  ]
}
```

#### GET - Obtener un turno por ID
```http
GET /api/v1/operativos/:id
```

#### POST - Crear nuevo turno
```http
POST /api/v1/operativos
Content-Type: application/json

{
  "operador_id": 5,
  "supervisor_id": 3,
  "sector_id": 2,
  "fecha": "2026-01-10",
  "fecha_hora_inicio": "2026-01-10T06:00:00Z",
  "fecha_hora_fin": "2026-01-10T14:00:00Z",
  "turno": "MAÑANA",
  "estado": 1,
  "observaciones": "Turno normal"
}
```

**Validaciones**:
- `operador_id`: Requerido, debe ser INT
- `supervisor_id`: Opcional, debe ser INT
- `sector_id`: Requerido, debe ser INT
- `fecha`: Requerido, formato ISO8601 (YYYY-MM-DD)
- `turno`: Requerido, enum: "MAÑANA" | "TARDE" | "NOCHE"

#### PUT - Actualizar turno
```http
PUT /api/v1/operativos/:id
```

#### DELETE - Eliminar turno (soft delete)
```http
DELETE /api/v1/operativos/:id
```

---

### 2️⃣ OPERATIVOS VEHÍCULOS

#### GET - Listar vehículos de un turno
```http
GET /api/v1/operativos/:turnoId/vehiculos
```

**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "operativo_turno_id": 1,
      "vehiculo_id": 10,
      "conductor_id": 25,
      "copiloto_id": 30,
      "kilometraje_inicio": 50000,
      "hora_inicio": "2026-01-10T06:15:00Z",
      "nivel_combustible_inicio": "LLENO",
      "kilometraje_fin": 50120,
      "hora_fin": "2026-01-10T13:45:00Z",
      "nivel_combustible_fin": "1/2",
      "kilometros_recorridos": 120,
      "vehiculo": { "id": 10, "placa": "ABC-123", "marca": "Toyota" },
      "conductor": { "id": 25, "nombres": "Carlos", "apellidos": "Ruiz" },
      "copiloto": { "id": 30, "nombres": "Ana", "apellidos": "Torres" }
    }
  ]
}
```

#### POST - Asignar vehículo a turno
```http
POST /api/v1/operativos/:turnoId/vehiculos

{
  "vehiculo_id": 10,
  "conductor_id": 25,
  "copiloto_id": 30,
  "kilometraje_inicio": 50000,
  "hora_inicio": "2026-01-10T06:15:00Z",
  "nivel_combustible_inicio": "LLENO",
  "estado_operativo_id": 2,
  "observaciones": "Inicio de patrullaje"
}
```

**Validaciones**:
- `vehiculo_id`: Requerido, INT
- `conductor_id`: Requerido, INT
- `copiloto_id`: Opcional, INT
- `kilometraje_inicio`: Requerido, INT >= 0
- `nivel_combustible_inicio`: Enum: "LLENO" | "3/4" | "1/2" | "1/4" | "RESERVA"

#### PUT - Actualizar datos del vehículo (ej: cerrar turno)
```http
PUT /api/v1/operativos/:turnoId/vehiculos/:id

{
  "kilometraje_fin": 50120,
  "hora_fin": "2026-01-10T13:45:00Z",
  "nivel_combustible_fin": "1/2",
  "observaciones": "Turno completado sin novedades"
}
```

---

### 3️⃣ OPERATIVOS VEHÍCULOS CUADRANTES

#### GET - Listar cuadrantes patrullados por un vehículo
```http
GET /api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes
```

**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "operativo_vehiculo_id": 1,
      "cuadrante_id": 5,
      "hora_ingreso": "2026-01-10T06:30:00Z",
      "hora_salida": "2026-01-10T08:00:00Z",
      "observaciones": "Patrullaje rutinario",
      "incidentes_reportados": "2 incidentes menores",
      "tiempo_minutos": 90,
      "datosCuadrante": {
        "id": 5,
        "nombre": "Cuadrante A-05",
        "codigo": "A-05"
      }
    }
  ]
}
```

#### POST - Registrar ingreso a cuadrante
```http
POST /api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes

{
  "cuadrante_id": 5,
  "hora_ingreso": "2026-01-10T06:30:00Z",
  "observaciones": "Inicio de patrullaje en cuadrante A-05"
}
```

#### PUT - Registrar salida del cuadrante
```http
PUT /api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes/:id

{
  "hora_salida": "2026-01-10T08:00:00Z",
  "observaciones": "Patrullaje completado",
  "incidentes_reportados": "2 incidentes atendidos"
}
```

---

### 4️⃣ OPERATIVOS VEHÍCULOS NOVEDADES

#### GET - Listar novedades de un cuadrante
```http
GET /api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes/:cuadranteId/novedades
```

**Respuesta**:
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "operativo_vehiculo_cuadrante_id": 1,
      "novedad_id": 40,
      "reportado": "2026-01-10T07:15:00Z",
      "estado": 1,
      "observaciones": "Incidente resuelto en sitio",
      "novedad": {
        "id": 40,
        "titulo": "Riña callejera",
        "tipo_novedad_id": 3
      }
    }
  ]
}
```

#### POST - Registrar novedad en cuadrante
```http
POST /api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes/:cuadranteId/novedades

{
  "novedad_id": 40,
  "reportado": "2026-01-10T07:15:00Z",
  "observaciones": "Riña entre 2 personas, intervenida por la unidad"
}
```

**Validaciones**:
- `novedad_id`: Requerido, INT
- `reportado`: Opcional, fecha ISO8601 (default: NOW)
- `estado`: Opcional, 0 o 1 (default: 1)

#### PUT - Actualizar novedad (ej: cerrar caso)
```http
PUT /api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes/:cuadranteId/novedades/:id

{
  "estado": 0,
  "observaciones": "Caso cerrado, derivado a comisaría"
}
```

#### DELETE - Eliminar novedad (soft delete)
```http
DELETE /api/v1/operativos/:turnoId/vehiculos/:vehiculoId/cuadrantes/:cuadranteId/novedades/:id
```

**Comportamiento**:
- Marca `deleted_at` con timestamp actual
- Actualiza `estado = 0`
- Registra `deleted_by` con ID del usuario

---

## 🎯 Flujos de Trabajo Frontend

### Flujo 1: Crear Turno Operativo Completo

```javascript
// 1. Crear turno
const turno = await POST('/api/v1/operativos', {
  operador_id: 5,
  supervisor_id: 3,
  sector_id: 2,
  fecha: '2026-01-10',
  turno: 'MAÑANA'
});

// 2. Asignar vehículos al turno
const vehiculo1 = await POST(`/api/v1/operativos/${turno.data.id}/vehiculos`, {
  vehiculo_id: 10,
  conductor_id: 25,
  copiloto_id: 30,
  kilometraje_inicio: 50000,
  hora_inicio: new Date().toISOString(),
  nivel_combustible_inicio: 'LLENO'
});

// 3. Registrar ingreso a cuadrante
const cuadrante = await POST(
  `/api/v1/operativos/${turno.data.id}/vehiculos/${vehiculo1.data.id}/cuadrantes`,
  {
    cuadrante_id: 5,
    hora_ingreso: new Date().toISOString()
  }
);

// 4. Registrar novedad en cuadrante
const novedad = await POST(
  `/api/v1/operativos/${turno.data.id}/vehiculos/${vehiculo1.data.id}/cuadrantes/${cuadrante.data.id}/novedades`,
  {
    novedad_id: 40,
    reportado: new Date().toISOString(),
    observaciones: 'Incidente menor resuelto'
  }
);
```

---

### Flujo 2: Cerrar Turno Operativo

```javascript
// 1. Cerrar cada cuadrante patrullado
await PUT(
  `/api/v1/operativos/${turnoId}/vehiculos/${vehiculoId}/cuadrantes/${cuadranteId}`,
  {
    hora_salida: new Date().toISOString(),
    incidentes_reportados: '2 incidentes atendidos'
  }
);

// 2. Cerrar cada vehículo del turno
await PUT(`/api/v1/operativos/${turnoId}/vehiculos/${vehiculoId}`, {
  kilometraje_fin: 50120,
  hora_fin: new Date().toISOString(),
  nivel_combustible_fin: '1/2'
});

// 3. Cerrar el turno
await PUT(`/api/v1/operativos/${turnoId}`, {
  estado: 0,
  observaciones: 'Turno completado exitosamente'
});
```

---

## ✅ Validaciones Frontend

### Turnos Operativos
```javascript
const validarTurno = (data) => {
  const errores = {};

  if (!data.operador_id) {
    errores.operador_id = 'Operador es requerido';
  }

  if (!data.sector_id) {
    errores.sector_id = 'Sector es requerido';
  }

  if (!data.fecha) {
    errores.fecha = 'Fecha es requerida';
  }

  if (!['MAÑANA', 'TARDE', 'NOCHE'].includes(data.turno)) {
    errores.turno = 'Turno inválido. Debe ser MAÑANA, TARDE o NOCHE';
  }

  return errores;
};
```

### Vehículos
```javascript
const validarVehiculo = (data) => {
  const errores = {};

  if (!data.vehiculo_id) {
    errores.vehiculo_id = 'Vehículo es requerido';
  }

  if (!data.conductor_id) {
    errores.conductor_id = 'Conductor es requerido';
  }

  if (data.kilometraje_inicio < 0) {
    errores.kilometraje_inicio = 'Kilometraje no puede ser negativo';
  }

  const nivelesValidos = ['LLENO', '3/4', '1/2', '1/4', 'RESERVA'];
  if (!nivelesValidos.includes(data.nivel_combustible_inicio)) {
    errores.nivel_combustible_inicio = 'Nivel de combustible inválido';
  }

  return errores;
};
```

---

## 🔐 Permisos RBAC

Cada operación requiere permisos específicos:

### Turnos Operativos
- `operativos_turnos:create` - Crear turnos
- `operativos_turnos:read` - Ver turnos
- `operativos_turnos:update` - Actualizar turnos
- `operativos_turnos:delete` - Eliminar turnos
- `operativos_turnos:manage` - Gestión completa

### Vehículos Operativos
- `operativos_vehiculos:create`
- `operativos_vehiculos:read`
- `operativos_vehiculos:update`
- `operativos_vehiculos:delete`
- `operativos_vehiculos:manage`

### Cuadrantes
- `operativos_cuadrantes:create`
- `operativos_cuadrantes:read`
- `operativos_cuadrantes:update`
- `operativos_cuadrantes:delete`
- `operativos_cuadrantes:manage`

### Novedades
- `operativos_novedades:create`
- `operativos_novedades:read`
- `operativos_novedades:update`
- `operativos_novedades:delete`
- `operativos_novedades:manage`

---

## 📦 Estructura de Respuestas

### Éxito (2xx)
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { /* objeto o array */ }
}
```

### Error de validación (400)
```json
{
  "success": false,
  "message": "Errores de validación",
  "errors": [
    {
      "field": "operador_id",
      "message": "El operador_id es requerido"
    }
  ]
}
```

### Error de autorización (401/403)
```json
{
  "success": false,
  "message": "No autorizado" // o "Permisos insuficientes"
}
```

### Error no encontrado (404)
```json
{
  "status": "error",
  "message": "Recurso no encontrado"
}
```

### Error del servidor (500)
```json
{
  "status": "error",
  "message": "Error interno del servidor",
  "error": "Mensaje de error detallado"
}
```

---

## 🎨 Ejemplos de UI

### Vista de Turnos (Tabla)
```
┌─────────────────────────────────────────────────────────────┐
│ Turnos Operativos                          [+ Nuevo Turno]  │
├─────────────────────────────────────────────────────────────┤
│ Fecha      │ Turno   │ Operador    │ Sector    │ Acciones  │
├────────────┼─────────┼─────────────┼───────────┼───────────┤
│ 2026-01-10 │ MAÑANA  │ Juan Pérez  │ Centro    │ Ver Editar│
│ 2026-01-10 │ TARDE   │ Ana López   │ Norte     │ Ver Editar│
│ 2026-01-09 │ NOCHE   │ Carlos Ruiz │ Sur       │ Ver Editar│
└─────────────────────────────────────────────────────────────┘
```

### Vista de Vehículos en Turno (Cards)
```
┌──────────────────────────────────────┐
│ Vehículo: ABC-123                    │
│ Conductor: Juan Pérez                │
│ Copiloto: María López                │
│                                      │
│ Inicio: 06:15 - Fin: 13:45          │
│ Km: 50000 → 50120 (120 km)          │
│ Combustible: LLENO → 1/2             │
│                                      │
│ [Ver Cuadrantes] [Cerrar Turno]     │
└──────────────────────────────────────┘
```

### Vista de Cuadrantes (Timeline)
```
06:30 ──── A-05 ──── 08:00 (90 min)
            │
            └─ 2 novedades atendidas

08:15 ──── B-12 ──── 10:30 (135 min)
            │
            └─ 1 novedad atendida

10:45 ──── C-03 ──── Activo...
```

---

## 💡 Tips de Implementación

### 1. Gestión de Estado
Usa un state manager (Redux, Zustand, Context) para:
- Turno activo actual
- Vehículos del turno
- Cuadrante activo
- Novedades pendientes

### 2. Tiempo Real
Considera implementar WebSockets o polling para:
- Actualizar estado de vehículos en tiempo real
- Notificar nuevas novedades
- Sincronizar múltiples usuarios

### 3. Modo Offline
- Cachear datos del turno activo
- Permitir registro de novedades offline
- Sincronizar cuando se recupere conexión

### 4. Optimizaciones
- Lazy loading de cuadrantes y novedades
- Paginación en listas grandes
- Cache de catálogos (sectores, cuadrantes, tipos de novedad)

---

## 📞 Soporte

Para dudas o reportar problemas:
- GitHub Issues: [RomilyOaks/city_sec_backend_claude](https://github.com/RomilyOaks/city_sec_backend_claude)
- Postman Collection: `postman/operativos.postman_collection.json`
- Documentación completa: `API_CRUD_OPERATIVOS_DOCUMENTATION.md`

---

**Versión**: 1.0.0
**Última actualización**: 2026-01-10
**Autor**: Sistema de Seguridad Ciudadana
