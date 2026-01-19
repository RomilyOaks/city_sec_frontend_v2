# API Operativos Personal - Documentación para Frontend

> **Versión:** 2.2.2
> **Última actualización:** 2026-01-17

---

## ⚠️ IMPORTANTE: Prefijo de Rutas

**TODOS los endpoints deben incluir el prefijo `/api/v1/`**

```
✅ CORRECTO:   http://localhost:3000/api/v1/operativos/1/personal
❌ INCORRECTO: http://localhost:3000/operativos/1/personal
```

Si obtienen error **404 "Ruta no encontrada"**, verificar que están incluyendo `/api/v1/` en la URL.

---

## Autenticación

Todos los endpoints requieren autenticación Bearer Token.

```http
Authorization: Bearer {token}
```

---

## Jerarquía de Datos

```
OperativosTurno (turno del operativo)
  └─ OperativosPersonal (personal asignado al turno)
      └─ OperativosPersonalCuadrantes (cuadrantes cubiertos)
          └─ OperativosPersonalNovedades (novedades atendidas)
```

---

## 1. Personal Operativo

### 1.1 Listar Todo el Personal (General)

Lista todo el personal operativo con filtros y paginación.

```http
GET /api/v1/operativos-personal
```

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| page | number | Página actual (default: 1) |
| limit | number | Registros por página (default: 20) |
| search | string | Búsqueda por nombre |
| turno_id | number | Filtrar por turno |
| tipo_patrullaje | string | SERENAZGO, PPFF, GUARDIA, VIGILANTE, OTRO |
| estado_operativo_id | number | Filtrar por estado |
| fecha_inicio | datetime | Fecha inicio (ISO 8601) |
| fecha_fin | datetime | Fecha fin (ISO 8601) |
| sort | string | Campo para ordenar (default: hora_inicio) |
| order | string | ASC o DESC (default: DESC) |

**Ejemplo de Request:**
```javascript
const response = await fetch('/api/v1/operativos-personal?page=1&limit=20&tipo_patrullaje=SERENAZGO', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

**Response (200):**
```json
{
  "success": true,
  "message": "Personal operativo obtenido exitosamente",
  "data": [...],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### 1.2 Listar Personal por Turno

```http
GET /api/v1/operativos/{turnoId}/personal
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "operativo_turno_id": 1,
      "personal_id": 17,
      "tipo_patrullaje": "SERENAZGO",
      "hora_inicio": "2026-01-17T08:00:00.000Z",
      "hora_fin": null,
      "personal": {
        "id": 17,
        "nombres": "CARLOS",
        "apellido_paterno": "RAMIREZ",
        "apellido_materno": "LOPEZ"
      },
      "sereno": null,
      "estado_operativo": { "id": 1, "descripcion": "OPERATIVO" },
      "radio_tetra": { "id": 1, "radio_tetra_code": "RT-001" }
    }
  ]
}
```

---

### 1.3 Obtener Personal por ID

```http
GET /api/v1/operativos/{turnoId}/personal/{id}
```

**Parámetros de Ruta:**
- `turnoId`: ID del turno operativo
- `id`: ID del registro en `operativos_personal` (NO es personal_id)

> ⚠️ **NOTA:** El parámetro `id` es el ID del registro de asignación, no el ID del personal de seguridad.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "operativo_turno_id": 1,
    "personal_id": 17,
    "tipo_patrullaje": "SERENAZGO",
    "chaleco_balistico": true,
    "porra_policial": true,
    "esposas": true,
    "linterna": true,
    "kit_primeros_auxilios": false,
    "turno": { ... },
    "personal": { ... },
    "sereno": null,
    "estado_operativo": { ... },
    "radio_tetra": { ... }
  }
}
```

---

### 1.4 Asignar Personal a Turno

```http
POST /api/v1/operativos/{turnoId}/personal
```

**Body:**
```json
{
  "personal_id": 17,
  "tipo_patrullaje": "SERENAZGO",
  "sereno_id": null,
  "radio_tetra_id": 1,
  "estado_operativo_id": 1,
  "hora_inicio": "2026-01-17T08:00:00.000Z",
  "chaleco_balistico": true,
  "porra_policial": true,
  "esposas": true,
  "linterna": true,
  "kit_primeros_auxilios": false,
  "observaciones": "Patrullaje de prueba"
}
```

**Campos Requeridos:**
- `personal_id` (number): ID del personal de seguridad
- `hora_inicio` (datetime): Fecha/hora de inicio en formato ISO 8601
- `estado_operativo_id` (number): ID del estado operativo

**Campos Opcionales:**
- `tipo_patrullaje`: SERENAZGO (default), PPFF, GUARDIA, VIGILANTE, OTRO
- `sereno_id`: ID del compañero de patrullaje (debe ser diferente a personal_id)
- `radio_tetra_id`: ID del radio asignado
- Equipamiento: `chaleco_balistico`, `porra_policial`, `esposas`, `linterna`, `kit_primeros_auxilios` (boolean)
- `observaciones`: Texto libre (máx 500 caracteres)

**Response (201):**
```json
{
  "success": true,
  "message": "Personal asignado al turno correctamente",
  "data": { "id": 5, ... }
}
```

---

### 1.5 Actualizar Asignación de Personal

```http
PUT /api/v1/operativos/{turnoId}/personal/{id}
```

**Body (campos opcionales):**
```json
{
  "hora_fin": "2026-01-17T20:00:00.000Z",
  "observaciones": "Turno completado sin novedad"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Asignación de personal actualizada correctamente",
  "data": { ... }
}
```

---

### 1.6 Eliminar Asignación de Personal

```http
DELETE /api/v1/operativos/{turnoId}/personal/{id}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Asignación de personal eliminada correctamente"
}
```

---

## 2. Cuadrantes del Personal

### 2.1 Listar Cuadrantes del Personal

```http
GET /api/v1/operativos/{turnoId}/personal/{id}/cuadrantes
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "operativo_personal_id": 1,
      "cuadrante_id": 5,
      "hora_ingreso": "2026-01-17T08:30:00.000Z",
      "hora_salida": null,
      "observaciones": null,
      "datosCuadrante": {
        "id": 5,
        "nombre": "Cuadrante A-1",
        "cuadrante_code": "CA-001"
      }
    }
  ]
}
```

---

### 2.2 Asignar Cuadrante a Personal

```http
POST /api/v1/operativos/{turnoId}/personal/{id}/cuadrantes
```

**Body:**
```json
{
  "cuadrante_id": 5,
  "hora_ingreso": "2026-01-17T08:30:00.000Z"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Cuadrante asignado al personal correctamente",
  "data": { "id": 1, ... }
}
```

---

### 2.3 Actualizar Cuadrante (Registrar Salida)

```http
PUT /api/v1/operativos/{turnoId}/personal/{id}/cuadrantes/{cuadranteId}
```

**Body:**
```json
{
  "hora_salida": "2026-01-17T12:30:00.000Z",
  "observaciones": "Patrullaje completado sin incidentes",
  "incidentes_reportados": ""
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Asignación de cuadrante actualizada correctamente",
  "data": { ... }
}
```

---

### 2.4 Eliminar Asignación de Cuadrante

```http
DELETE /api/v1/operativos/{turnoId}/personal/{id}/cuadrantes/{cuadranteId}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Asignación de cuadrante eliminada correctamente"
}
```

---

## 3. Novedades del Personal

### 3.1 Obtener Novedades Disponibles para Cuadrante

Obtiene las novedades registradas en el sistema que pertenecen al cuadrante geográfico.

```http
GET /api/v1/operativos/{turnoId}/personal/{personalId}/cuadrantes/{cuadranteId}/novedades/disponibles
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Novedades disponibles del cuadrante obtenidas exitosamente",
  "data": [...],
  "cuadranteInfo": {
    "id": 5,
    "nombre": "Cuadrante A-1",
    "codigo": "CA-001"
  },
  "summary": {
    "total": 10,
    "porPrioridad": {
      "urgente": 1,
      "alta": 2,
      "media": 5,
      "baja": 2
    },
    "porEstado": {
      "despachado": 3,
      "pendiente": 5,
      "atendido": 2
    }
  }
}
```

---

### 3.2 Listar Novedades Atendidas en Cuadrante

```http
GET /api/v1/operativos/{turnoId}/personal/{personalId}/cuadrantes/{cuadranteId}/novedades
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Novedades obtenidas exitosamente con información completa",
  "data": [
    {
      "id": 1,
      "novedad_id": 15,
      "reportado": "2026-01-17T10:30:00.000Z",
      "atendido": null,
      "prioridad": "MEDIA",
      "resultado": "PENDIENTE",
      "observaciones": "...",
      "acciones_tomadas": "...",
      "novedad": { ... },
      "cuadranteOperativo": { ... }
    }
  ],
  "cuadranteInfo": { ... },
  "summary": {
    "total": 5,
    "porPrioridad": { "baja": 1, "media": 3, "alta": 1, "urgente": 0 },
    "porResultado": { "pendientes": 2, "resueltas": 2, "escaladas": 1, "canceladas": 0 }
  }
}
```

---

### 3.3 Registrar Novedad Atendida

```http
POST /api/v1/operativos/{turnoId}/personal/{personalId}/cuadrantes/{cuadranteId}/novedades
```

**Body:**
```json
{
  "novedad_id": 15,
  "reportado": "2026-01-17T10:30:00.000Z",
  "prioridad": "MEDIA",
  "observaciones": "Atención realizada durante patrullaje",
  "acciones_tomadas": "Se verificó la situación y se brindó apoyo",
  "resultado": "PENDIENTE"
}
```

**Campos:**
- `novedad_id` (requerido): ID de la novedad del sistema
- `reportado`: Fecha/hora del reporte (default: ahora)
- `prioridad`: BAJA, MEDIA, ALTA, URGENTE (default: MEDIA)
- `resultado`: PENDIENTE, RESUELTO, ESCALADO, CANCELADO (default: PENDIENTE)
- `observaciones`: Observaciones del atención
- `acciones_tomadas`: Descripción de las acciones realizadas

**Response (201):**
```json
{
  "status": "success",
  "message": "Novedad registrada en el cuadrante correctamente",
  "data": { ... }
}
```

---

### 3.4 Actualizar Novedad (Resolver)

```http
PUT /api/v1/operativos/{turnoId}/personal/{personalId}/cuadrantes/{cuadranteId}/novedades/{novedadId}
```

**Body:**
```json
{
  "resultado": "RESUELTO",
  "acciones_tomadas": "Se coordinó con la PNP para intervención. Situación controlada.",
  "observaciones": "Caso resuelto satisfactoriamente"
}
```

> **Nota:** Al cambiar `resultado` a "RESUELTO", la fecha de `atendido` se registra automáticamente.

**Response (200):**
```json
{
  "status": "success",
  "message": "Novedad actualizada correctamente",
  "data": { ... }
}
```

---

### 3.5 Eliminar Novedad

```http
DELETE /api/v1/operativos/{turnoId}/personal/{personalId}/cuadrantes/{cuadranteId}/novedades/{novedadId}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Novedad eliminada correctamente"
}
```

---

## Códigos de Error Comunes

| Código | Descripción |
|--------|-------------|
| 400 | Datos de entrada inválidos o duplicados |
| 401 | Token no proporcionado o inválido |
| 403 | Sin permisos para esta acción |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

**Ejemplo de Error 400:**
```json
{
  "success": false,
  "message": "Personal ya ha sido asignado en el mismo sector, turno y fecha de los Operativos"
}
```

**Ejemplo de Error 404:**
```json
{
  "success": false,
  "message": "Turno no encontrado"
}
```

---

## Permisos RBAC Requeridos

### Personal Operativo (asignación de personal a turnos):
- `operativos.personal.read` - Leer
- `operativos.personal.create` - Crear
- `operativos.personal.update` - Actualizar
- `operativos.personal.delete` - Eliminar

### Cuadrantes del Personal:
- `operativos.personal.cuadrantes.read` - Leer
- `operativos.personal.cuadrantes.create` - Crear
- `operativos.personal.cuadrantes.update` - Actualizar
- `operativos.personal.cuadrantes.delete` - Eliminar

### Novedades del Personal:
- `operativos.personal.novedades.read` - Leer
- `operativos.personal.novedades.create` - Crear
- `operativos.personal.novedades.update` - Actualizar
- `operativos.personal.novedades.delete` - Eliminar

---

## Valores ENUM

### tipo_patrullaje
- `SERENAZGO`
- `PPFF` (Policía)
- `GUARDIA`
- `VIGILANTE`
- `OTRO`

### prioridad
- `BAJA`
- `MEDIA`
- `ALTA`
- `URGENTE`

### resultado
- `PENDIENTE`
- `RESUELTO`
- `ESCALADO`
- `CANCELADO`

---

## Colección Postman

Se incluye una colección de Postman para testing:

📁 `postman/OperativosPersonal_v2.2.2.postman_collection.json`

Importar en Postman y configurar las variables:
- `baseUrl`: `http://localhost:3000/api/v1`
- `token`: Token de autenticación

---

## Contacto

Para dudas o problemas técnicos, contactar al equipo de backend.
