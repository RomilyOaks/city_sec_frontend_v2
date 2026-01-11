# 📋 DOCUMENTACIÓN FRONTEND: OPERATIVOS VEHÍCULOS

## ✅ ESTADO: COMPLETADO Y LISTO PARA USAR

**Versión:** 1.0.0
**Fecha:** 2026-01-11
**Última actualización:** Backend completamente implementado con filtros, búsqueda y paginación

---

## 🏗️ ESTRUCTURA DE DATOS

### Relación Jerárquica
```
OperativosTurno (cabecera/padre)
  ├── id
  ├── fecha
  ├── turno (MAÑANA, TARDE, NOCHE)
  ├── operador_id
  ├── supervisor_id
  └── sector_id
      │
      └── OperativosVehiculos (detalle/hijo) ← ESTE MÓDULO
          ├── id
          ├── operativo_turno_id (FK)
          ├── vehiculo_id (FK)
          ├── conductor_id (FK)
          ├── copiloto_id (FK)
          ├── kilometraje_inicio
          ├── kilometraje_fin
          ├── nivel_combustible_inicio
          └── observaciones
              │
              └── OperativosVehiculosCuadrantes
                  └── OperativosVehiculosNovedades
```

---

## 🌐 ENDPOINTS DISPONIBLES

### 1️⃣ **ENDPOINT GENERAL CON FILTROS** ⭐ NUEVO

```http
GET /api/v1/operativos-vehiculos
Authorization: Bearer {token}
```

**Query Parameters:**
| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `page` | integer | ❌ | Número de página | `page=1` |
| `limit` | integer | ❌ | Registros por página (default: 20) | `limit=50` |
| `search` | string | ❌ | Búsqueda en placa, marca, conductor, copiloto | `search=ABC` |
| `turno_id` | integer | ❌ | Filtrar por turno operativo | `turno_id=5` |
| `vehiculo_id` | integer | ❌ | Filtrar por vehículo | `vehiculo_id=10` |
| `conductor_id` | integer | ❌ | Filtrar por conductor | `conductor_id=15` |
| `copiloto_id` | integer | ❌ | Filtrar por copiloto | `copiloto_id=20` |
| `estado_operativo_id` | integer | ❌ | Filtrar por estado operativo | `estado_operativo_id=1` |
| `fecha_inicio` | date | ❌ | Filtro desde fecha (formato: YYYY-MM-DD) | `fecha_inicio=2026-01-01` |
| `fecha_fin` | date | ❌ | Filtro hasta fecha (formato: YYYY-MM-DD) | `fecha_fin=2026-01-31` |
| `sort` | string | ❌ | Campo para ordenar (default: hora_inicio) | `sort=kilometraje_inicio` |
| `order` | string | ❌ | ASC o DESC (default: DESC) | `order=ASC` |

**Ejemplo de request:**
```javascript
const response = await fetch('/api/v1/operativos-vehiculos?page=1&limit=20&search=ABC&turno_id=5', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Response exitoso (200):**
```json
{
  "success": true,
  "message": "Vehículos operativos obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "operativo_turno_id": 5,
      "vehiculo_id": 10,
      "conductor_id": 15,
      "copiloto_id": 20,
      "tipo_copiloto_id": 2,
      "radio_tetra_id": 5,
      "estado_operativo_id": 1,
      "kilometraje_inicio": 45000,
      "hora_inicio": "2026-01-10T06:00:00.000Z",
      "nivel_combustible_inicio": "LLENO",
      "kilometraje_fin": 45150,
      "hora_fin": "2026-01-10T14:00:00.000Z",
      "nivel_combustible_fin": "3/4",
      "kilometros_recorridos": 150,
      "observaciones": "Turno sin novedades",
      "vehiculo": {
        "id": 10,
        "placa": "ABC-123",
        "marca": "Toyota",
        "modelo": "Hilux",
        "año": 2020
      },
      "conductor": {
        "id": 15,
        "nombres": "Juan",
        "apellido_paterno": "Pérez",
        "apellido_materno": "García"
      },
      "copiloto": {
        "id": 20,
        "nombres": "María",
        "apellido_paterno": "López",
        "apellido_materno": "Ramírez"
      },
      "turno": {
        "id": 5,
        "fecha": "2026-01-10",
        "turno": "MAÑANA",
        "estado": "CERRADO"
      }
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### 2️⃣ **LISTAR VEHÍCULOS DE UN TURNO ESPECÍFICO**

```http
GET /api/v1/operativos/:turnoId/vehiculos
Authorization: Bearer {token}
```

**Path Parameters:**
- `turnoId` (integer, requerido): ID del turno operativo

**Response exitoso (200):**
```json
{
  "success": true,
  "message": "Vehículos del turno obtenidos exitosamente",
  "data": [
    {
      "id": 1,
      "operativo_turno_id": 5,
      "vehiculo_id": 10,
      "conductor_id": 15,
      "copiloto_id": 20,
      "kilometraje_inicio": 45000,
      "hora_inicio": "2026-01-10T06:00:00.000Z",
      "nivel_combustible_inicio": "LLENO",
      "vehiculo": {
        "id": 10,
        "placa": "ABC-123",
        "marca": "Toyota",
        "modelo": "Hilux",
        "año": 2020
      },
      "conductor": {
        "id": 15,
        "nombres": "Juan",
        "apellido_paterno": "Pérez",
        "apellido_materno": "García"
      },
      "copiloto": {
        "id": 20,
        "nombres": "María",
        "apellido_paterno": "López",
        "apellido_materno": "Ramírez"
      }
    }
  ]
}
```

---

### 3️⃣ **CREAR VEHÍCULO EN UN TURNO**

```http
POST /api/v1/operativos/:turnoId/vehiculos
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "vehiculo_id": 10,
  "conductor_id": 15,
  "copiloto_id": 20,
  "tipo_copiloto_id": 2,
  "radio_tetra_id": 5,
  "estado_operativo_id": 1,
  "kilometraje_inicio": 45000,
  "hora_inicio": "2026-01-10T06:00:00.000Z",
  "nivel_combustible_inicio": "LLENO",
  "observaciones": "Vehículo en buenas condiciones"
}
```

**Campos requeridos:**
- ✅ `vehiculo_id`
- ✅ `estado_operativo_id`
- ✅ `kilometraje_inicio`
- ✅ `hora_inicio`

**Response exitoso (201):**
```json
{
  "success": true,
  "message": "Vehículo asignado al turno correctamente",
  "data": {
    "id": 1,
    "operativo_turno_id": 5,
    "vehiculo_id": 10,
    "conductor_id": 15,
    "kilometraje_inicio": 45000,
    "created_at": "2026-01-10T05:30:00.000Z"
  }
}
```

**Error: Conductor duplicado (400):**
```json
{
  "success": false,
  "message": "Error de validación",
  "error": ["Un conductor solo puede estar en un vehículo por turno"]
}
```

---

### 4️⃣ **ACTUALIZAR VEHÍCULO**

```http
PUT /api/v1/operativos/:turnoId/vehiculos/:id
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (JSON) - Todos los campos son opcionales:**
```json
{
  "kilometraje_fin": 45150,
  "hora_fin": "2026-01-10T14:00:00.000Z",
  "nivel_combustible_fin": "3/4",
  "kilometraje_recarga": 45080,
  "hora_recarga": "2026-01-10T10:30:00.000Z",
  "combustible_litros": 45.5,
  "importe_recarga": 200.50,
  "nivel_combustible_recarga": "LLENO",
  "observaciones": "Turno finalizado sin novedades"
}
```

**Response exitoso (200):**
```json
{
  "success": true,
  "message": "Asignación de vehículo actualizada correctamente",
  "data": {
    "id": 1,
    "kilometraje_inicio": 45000,
    "kilometraje_fin": 45150,
    "kilometros_recorridos": 150,
    "updated_at": "2026-01-10T14:05:00.000Z"
  }
}
```

**Error: Kilometraje inválido (400):**
```json
{
  "success": false,
  "message": "Error de validación: El kilometraje final no puede ser menor que el kilometraje inicial."
}
```

---

### 5️⃣ **ELIMINAR VEHÍCULO (SOFT DELETE)**

```http
DELETE /api/v1/operativos/:turnoId/vehiculos/:id
Authorization: Bearer {token}
```

**Response exitoso (200):**
```json
{
  "success": true,
  "message": "Asignación de vehículo eliminada correctamente"
}
```

---

## 📊 CAMPOS DE LA TABLA

### Campos Principales

| Campo | Tipo | Null | Descripción |
|-------|------|------|-------------|
| `id` | bigint | NO | ID único |
| `operativo_turno_id` | bigint | NO | FK a operativos_turno |
| `vehiculo_id` | int | NO | FK a vehiculos |
| `conductor_id` | int | YES | FK a personal_seguridad (puede ser NULL) |
| `copiloto_id` | int | YES | FK a personal_seguridad |
| `tipo_copiloto_id` | int | YES | FK a tipos_copiloto |
| `radio_tetra_id` | int | YES | FK a radios_tetra |
| `estado_operativo_id` | int | NO | FK a estados_operativo_recurso |

### Kilometraje y Combustible

| Campo | Tipo | Null | Descripción |
|-------|------|------|-------------|
| `kilometraje_inicio` | int | NO | Km al iniciar el turno |
| `hora_inicio` | datetime | NO | Hora de inicio |
| `nivel_combustible_inicio` | ENUM | YES | LLENO, 3/4, 1/2, 1/4, RESERVA |
| `kilometraje_recarga` | int | YES | Km cuando se recargó |
| `hora_recarga` | datetime | YES | Hora de recarga |
| `combustible_litros` | decimal(8,2) | YES | Litros recargados |
| `importe_recarga` | decimal(10,2) | YES | Costo de recarga (S/.) |
| `nivel_combustible_recarga` | ENUM | YES | Nivel después de recargar |
| `kilometraje_fin` | int | YES | Km al finalizar turno |
| `hora_fin` | datetime | YES | Hora de fin |
| `nivel_combustible_fin` | ENUM | YES | Nivel al finalizar |
| `kilometros_recorridos` | VIRTUAL | - | Calculado: fin - inicio |

### Auditoría

| Campo | Tipo | Null | Descripción |
|-------|------|------|-------------|
| `estado_registro` | tinyint | YES | 1 = Activo, 0 = Eliminado |
| `observaciones` | varchar(500) | YES | Observaciones del turno |
| `created_by` | int | NO | Usuario que creó |
| `created_at` | datetime | YES | Fecha de creación |
| `updated_by` | int | YES | Usuario que actualizó |
| `updated_at` | datetime | YES | Fecha de actualización |
| `deleted_by` | int | YES | Usuario que eliminó |
| `deleted_at` | datetime | YES | Fecha de eliminación |

---

## 🔒 VALIDACIONES IMPORTANTES

### 1. Constraint Única: Conductor por Turno
```sql
UNIQUE (operativo_turno_id, conductor_id)
```
**Regla:** Un conductor solo puede estar asignado a UN vehículo por turno.

**Error esperado:**
```json
{
  "success": false,
  "message": "Error de validación",
  "error": ["Un conductor solo puede estar en un vehículo por turno"]
}
```

### 2. Check Constraint: Kilometraje
```sql
CHECK (kilometraje_fin >= kilometraje_inicio)
```
**Regla:** El kilometraje final no puede ser menor al inicial.

**Error esperado:**
```json
{
  "success": false,
  "message": "Error de validación: El kilometraje final no puede ser menor que el kilometraje inicial."
}
```

### 3. Valores ENUM para Combustible
Valores válidos:
- `LLENO`
- `3/4`
- `1/2`
- `1/4`
- `RESERVA`

---

## 🎯 FLUJO DE USO RECOMENDADO

### Escenario: Crear Turno con Vehículos

```javascript
// 1. Crear el turno operativo (cabecera)
const turnoResponse = await fetch('/api/v1/operativos', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    operador_id: 10,
    supervisor_id: 5,
    sector_id: 3,
    fecha: '2026-01-10',
    turno: 'MAÑANA',
    fecha_hora_inicio: '2026-01-10T06:00:00Z',
    estado: 'ACTIVO'
  })
});

const { data: turno } = await turnoResponse.json();
// turno.id = 25

// 2. Asignar vehículos al turno (detalle)
const vehiculo1 = await fetch(`/api/v1/operativos/${turno.id}/vehiculos`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    vehiculo_id: 10,
    conductor_id: 15,
    copiloto_id: 20,
    estado_operativo_id: 1, // EN_PATRULLA
    kilometraje_inicio: 45000,
    hora_inicio: '2026-01-10T06:00:00Z',
    nivel_combustible_inicio: 'LLENO'
  })
});

// 3. Durante el turno: registrar recarga de combustible
const recargaResponse = await fetch(`/api/v1/operativos/${turno.id}/vehiculos/1`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    kilometraje_recarga: 45080,
    hora_recarga: '2026-01-10T10:30:00Z',
    combustible_litros: 45.5,
    importe_recarga: 200.50,
    nivel_combustible_recarga: 'LLENO'
  })
});

// 4. Al finalizar el turno: registrar datos de cierre
const cierreResponse = await fetch(`/api/v1/operativos/${turno.id}/vehiculos/1`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    kilometraje_fin: 45150,
    hora_fin: '2026-01-10T14:00:00Z',
    nivel_combustible_fin: '3/4',
    observaciones: 'Turno completado sin novedades'
  })
});
```

---

## 🔍 EJEMPLOS DE BÚSQUEDA Y FILTROS

### Búsqueda por placa de vehículo
```javascript
GET /api/v1/operativos-vehiculos?search=ABC
```
Busca en: placa, marca del vehículo, nombres de conductor y copiloto

### Vehículos de un turno específico
```javascript
GET /api/v1/operativos-vehiculos?turno_id=5
```

### Vehículos por conductor
```javascript
GET /api/v1/operativos-vehiculos?conductor_id=15
```

### Vehículos por rango de fechas
```javascript
GET /api/v1/operativos-vehiculos?fecha_inicio=2026-01-01&fecha_fin=2026-01-31
```

### Combinación de filtros
```javascript
GET /api/v1/operativos-vehiculos?turno_id=5&estado_operativo_id=1&search=Toyota&page=1&limit=50
```

---

## 📝 NOTAS IMPORTANTES

### 1. Campo Calculado: `kilometros_recorridos`
Este campo es **VIRTUAL** (no se guarda en BD). Se calcula automáticamente:
```javascript
kilometros_recorridos = kilometraje_fin - kilometraje_inicio
```

### 2. Soft Delete
Cuando se elimina un vehículo operativo:
- `deleted_at` se marca con la fecha actual
- `estado_registro` cambia a `0`
- `deleted_by` se guarda con el ID del usuario

El registro NO se elimina físicamente de la base de datos.

### 3. Copiloto Incluido
**IMPORTANTE:** Desde la versión 1.0.0, TODOS los endpoints incluyen el copiloto en el response. Anteriormente solo incluía al conductor.

### 4. Búsqueda de Texto
La búsqueda es case-insensitive y busca en:
- Placa del vehículo
- Marca del vehículo
- Nombres del conductor
- Apellidos del conductor
- Nombres del copiloto
- Apellidos del copiloto

---

## ⚠️ ERRORES COMUNES

### Error 404: Turno no encontrado
```json
{
  "success": false,
  "message": "Turno no encontrado"
}
```
**Solución:** Verificar que el `turnoId` exista y esté activo.

### Error 400: Conductor duplicado
```json
{
  "success": false,
  "message": "Error de validación",
  "error": ["Un conductor solo puede estar en un vehículo por turno"]
}
```
**Solución:** Un conductor solo puede asignarse a un vehículo por turno. Elegir otro conductor o eliminar la asignación anterior.

### Error 400: Kilometraje inválido
```json
{
  "success": false,
  "message": "Error de validación: El kilometraje final no puede ser menor que el kilometraje inicial."
}
```
**Solución:** Asegurarse que `kilometraje_fin >= kilometraje_inicio`.

---

## 🎨 COMPONENTES FRONTEND SUGERIDOS

### 1. Lista de Vehículos Operativos (Tabla)
```jsx
<OperativosVehiculosTable
  data={vehiculos}
  pagination={pagination}
  onPageChange={handlePageChange}
  onSearch={handleSearch}
  filters={{
    turnoId,
    vehiculoId,
    conductorId,
    estadoOperativoId
  }}
/>
```

### 2. Formulario de Asignación de Vehículo
```jsx
<AsignarVehiculoForm
  turnoId={turnoId}
  onSubmit={handleAsignarVehiculo}
  vehiculosDisponibles={vehiculos}
  conductoresDisponibles={conductores}
  copilotos Disponibles={copilotos}
/>
```

### 3. Modal de Cierre de Turno
```jsx
<CerrarTurnoVehiculoModal
  vehiculoOperativo={vehiculo}
  onSubmit={handleCerrarTurno}
  onClose={handleCloseModal}
/>
```

### 4. Panel de Recarga de Combustible
```jsx
<RecargaCombustiblePanel
  vehiculoId={vehiculoId}
  kilometrajeActual={45080}
  onSubmit={handleRegistrarRecarga}
/>
```

---

## 📊 CAMPOS PARA DROPDOWNS/SELECT

### Nivel de Combustible
```javascript
const nivelesC ombustible = [
  { value: 'LLENO', label: 'Lleno' },
  { value: '3/4', label: '3/4' },
  { value: '1/2', label: '1/2' },
  { value: '1/4', label: '1/4' },
  { value: 'RESERVA', label: 'Reserva' }
];
```

### Estados Operativos (Ejemplo)
```javascript
const estadosOperativos = [
  { value: 1, label: 'Disponible' },
  { value: 2, label: 'En Patrulla' },
  { value: 3, label: 'En Mantenimiento' },
  { value: 4, label: 'Fuera de Servicio' }
];
```

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Implementar vista de lista con filtros
2. ✅ Crear formulario de asignación de vehículo
3. ✅ Implementar modal de cierre de turno
4. ✅ Agregar panel de recarga de combustible
5. ✅ Integrar con módulo de cuadrantes
6. ✅ Agregar estadísticas (km totales, combustible consumido)

---

## 📞 SOPORTE

Para dudas o problemas con la API de operativos-vehiculos, contactar al equipo de backend o revisar:
- Repositorio: https://github.com/RomilyOaks/city_sec_backend_claude
- Documentación API: /api/v1/docs

---

**Última actualización:** 2026-01-11
**Autor:** Backend Team - Claude Sonnet 4.5
