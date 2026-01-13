# Requerimientos para Backend - Operativos Vehículos

## ⚠️ ERROR ACTUAL: "Unknown column 'conductor.numero_placa'"

**SOLUCIÓN INMEDIATA**: Remover el campo `numero_placa` de los attributes de `conductor` y `copiloto` en el include.

La tabla `personal_seguridad` probablemente no tiene ese campo. Usar solo: `['id', 'nombres', 'apellido_paterno', 'apellido_materno']`

---

## Problema Actual

El endpoint `/api/v1/operativos/:turnoId/vehiculos` actualmente **NO está incluyendo las relaciones** (joins/includes) en la respuesta. Solo devuelve los IDs pero no los objetos relacionados.

### Ejemplo de Respuesta Actual (Incompleta):
```json
{
  "id": 20,
  "operativo_turno_id": 6,
  "vehiculo_id": 31,
  "conductor_id": 12,
  "copiloto_id": 8,
  "tipo_copiloto_id": 3,        // ❌ Solo ID, falta objeto
  "radio_tetra_id": 1,           // ❌ Solo ID, falta objeto
  "estado_operativo_id": 1,      // ❌ Solo ID, falta objeto
  "kilometraje_inicio": 12499,
  "hora_inicio": "2026-01-12 02:46:00",
  "nivel_combustible_inicio": "3/4",
  "observaciones": "prueba editada",
  "created_by": 13,
  "updated_by": 13
}
```

## Solución Requerida

El backend debe incluir las siguientes relaciones en el endpoint:

### Endpoint Afectado:
```
GET /api/v1/operativos/:turnoId/vehiculos
```

### Parámetro Query Opcional:
```
?include_relations=true
```
Por defecto debería ser `true`, o siempre incluir las relaciones.

---

## Relaciones a Incluir en Sequelize

### Modelo: `OperativoVehiculo` (o `railway.operativos_vehiculos`)

```javascript
// En el controlador: operativosVehiculosController.js
// Método: listVehiculosByTurno o similar

const vehiculos = await OperativoVehiculo.findAll({
  where: { operativo_turno_id: turnoId, deleted_at: null },
  include: [
    {
      model: Vehiculo,
      as: 'vehiculo',
      attributes: [
        'id',
        'placa',
        'codigo_vehiculo',
        'marca',
        'modelo_vehiculo',
        'anio_vehiculo',
        'color_vehiculo',
        'estado_operativo'
      ]
    },
    {
      model: PersonalSeguridad,
      as: 'conductor',
      attributes: [
        'id',
        'nombres',
        'apellido_paterno',
        'apellido_materno'
        // ⚠️ VERIFICAR: Si la tabla tiene 'numero_placa', 'placa', o no tiene este campo
        // Descomentar solo si existe: 'numero_placa'
      ]
    },
    {
      model: PersonalSeguridad,
      as: 'copiloto',
      attributes: [
        'id',
        'nombres',
        'apellido_paterno',
        'apellido_materno'
        // ⚠️ VERIFICAR: Si la tabla tiene 'numero_placa', 'placa', o no tiene este campo
        // Descomentar solo si existe: 'numero_placa'
      ]
    },
    {
      model: TipoCopiloto,
      as: 'tipo_copiloto',
      attributes: ['id', 'descripcion', 'estado']
      // ⚠️ IMPORTANTE: El campo es "descripcion" NO "nombre"
    },
    {
      model: RadioTetra,
      as: 'radio_tetra',
      attributes: [
        'id',
        'radio_tetra_code',  // ⚠️ CRÍTICO: Este campo es obligatorio
        'descripcion',
        'fecha_fabricacion',
        'estado'
      ]
    },
    {
      model: EstadoOperativo,
      as: 'estado_operativo',
      attributes: ['id', 'descripcion', 'estado']
      // ⚠️ IMPORTANTE: El campo es "descripcion" NO "nombre"
    },
    {
      model: User,
      as: 'creador',
      attributes: ['id', 'username', 'nombres', 'apellidos']
      // ⚠️ Ya está implementado correctamente con "username"
    },
    {
      model: User,
      as: 'actualizador',
      attributes: ['id', 'username', 'nombres', 'apellidos']
    },
    {
      model: User,
      as: 'eliminador',
      attributes: ['id', 'username', 'nombres', 'apellidos']
    }
  ],
  order: [['created_at', 'DESC']]
});
```

---

## Definición de Asociaciones en el Modelo

### Archivo: `models/operativo-vehiculo.js` o similar

Asegurarse de que estas asociaciones estén definidas:

```javascript
// En OperativoVehiculo.associate = function(models) {

// Relación con Vehículo
OperativoVehiculo.belongsTo(models.Vehiculo, {
  foreignKey: 'vehiculo_id',
  as: 'vehiculo'
});

// Relación con Personal - Conductor
OperativoVehiculo.belongsTo(models.PersonalSeguridad, {
  foreignKey: 'conductor_id',
  as: 'conductor'
});

// Relación con Personal - Copiloto
OperativoVehiculo.belongsTo(models.PersonalSeguridad, {
  foreignKey: 'copiloto_id',
  as: 'copiloto'
});

// ⚠️ NUEVAS RELACIONES REQUERIDAS:

// Relación con Tipo Copiloto
OperativoVehiculo.belongsTo(models.TipoCopiloto, {
  foreignKey: 'tipo_copiloto_id',
  as: 'tipo_copiloto'
});

// Relación con Radio TETRA
OperativoVehiculo.belongsTo(models.RadioTetra, {
  foreignKey: 'radio_tetra_id',
  as: 'radio_tetra'
});

// Relación con Estado Operativo
OperativoVehiculo.belongsTo(models.EstadoOperativo, {
  foreignKey: 'estado_operativo_id',
  as: 'estado_operativo'
});

// Relaciones de auditoría (ya implementadas)
OperativoVehiculo.belongsTo(models.User, {
  foreignKey: 'created_by',
  as: 'creador'
});

OperativoVehiculo.belongsTo(models.User, {
  foreignKey: 'updated_by',
  as: 'actualizador'
});

OperativoVehiculo.belongsTo(models.User, {
  foreignKey: 'deleted_by',
  as: 'eliminador'
});
```

---

## Respuesta Esperada (Con Relaciones)

```json
{
  "success": true,
  "message": "Vehículos del turno obtenidos exitosamente",
  "data": [
    {
      "id": 20,
      "operativo_turno_id": 6,
      "vehiculo_id": 31,
      "conductor_id": 12,
      "copiloto_id": 8,
      "tipo_copiloto_id": 3,
      "radio_tetra_id": 1,
      "estado_operativo_id": 1,
      "kilometraje_inicio": 12499,
      "hora_inicio": "2026-01-12 02:46:00",
      "nivel_combustible_inicio": "3/4",
      "observaciones": "prueba editada",
      "created_by": 13,
      "updated_by": 13,
      "created_at": "2026-01-12 07:47:58",
      "updated_at": "2026-01-12 08:12:03",
      "deleted_at": null,

      "vehiculo": {
        "id": 31,
        "placa": "POT-987",
        "codigo_vehiculo": "Pathfinder",
        "marca": "Nissan",
        "modelo_vehiculo": "Pathfinder",
        "anio_vehiculo": "2018",
        "color_vehiculo": "Gris",
        "estado_operativo": "Operativo"
      },

      "conductor": {
        "id": 12,
        "nombres": "Jaime",
        "apellido_paterno": "TORRES",
        "apellido_materno": "CARO",
        "numero_placa": "001234"
      },

      "copiloto": {
        "id": 8,
        "nombres": "Romily Herman",
        "apellido_paterno": "ROBLES",
        "apellido_materno": "GUERRERO",
        "numero_placa": "005678"
      },

      "tipo_copiloto": {
        "id": 3,
        "descripcion": "Copiloto Nivel 2",
        "estado": true
      },

      "radio_tetra": {
        "id": 1,
        "radio_tetra_code": "RT-001",
        "descripcion": "Motorola DP4800",
        "fecha_fabricacion": "2023-08-20",
        "estado": true
      },

      "estado_operativo": {
        "id": 1,
        "descripcion": "LLENO",
        "estado": true
      },

      "creador": {
        "id": 13,
        "username": "admin",
        "nombres": "Romily",
        "apellidos": "ROBLES GUERRERO"
      },

      "actualizador": {
        "id": 13,
        "username": "admin",
        "nombres": "Romily",
        "apellidos": "ROBLES GUERRERO"
      },

      "eliminador": null
    }
  ]
}
```

---

## Verificación de Nombres de Campos

### ⚠️ IMPORTANTE: Verificar estos nombres en la base de datos:

1. **TipoCopiloto**:
   - ✅ Campo: `descripcion` (NO `nombre`)

2. **RadioTetra**:
   - ✅ Campo principal: `radio_tetra_code` (NO `codigo` ni `numero`)
   - ✅ Campo secundario: `descripcion`

3. **EstadoOperativo**:
   - ✅ Campo: `descripcion` (NO `nombre`)

Si los nombres de campos son diferentes en tu base de datos, ajusta los `attributes` en el include.

---

## Prueba de Verificación

### Request:
```bash
GET http://localhost:3000/api/v1/operativos/6/vehiculos?include_relations=true
```

### Validar en Response:
- ✅ Objeto `tipo_copiloto` presente con campo `descripcion`
- ✅ Objeto `radio_tetra` presente con campo `radio_tetra_code`
- ✅ Objeto `estado_operativo` presente con campo `descripcion`
- ✅ Objeto `vehiculo` presente
- ✅ Objetos `conductor` y `copiloto` presentes
- ✅ Objetos de auditoría (`creador`, `actualizador`, `eliminador`) con campo `username`

---

## Notas Adicionales

1. **Performance**: Considera agregar índices en las foreign keys si no existen:
   ```sql
   CREATE INDEX idx_operativos_vehiculos_tipo_copiloto ON railway.operativos_vehiculos(tipo_copiloto_id);
   CREATE INDEX idx_operativos_vehiculos_radio_tetra ON railway.operativos_vehiculos(radio_tetra_id);
   CREATE INDEX idx_operativos_vehiculos_estado_operativo ON railway.operativos_vehiculos(estado_operativo_id);
   ```

2. **Caché**: Si hay muchos vehículos, considera implementar caché de catálogos (tipos copiloto, estados operativos, radios).

3. **Paginación**: Si un turno puede tener muchos vehículos, considera agregar paginación al endpoint.

---

## Contacto Frontend

Si tienes dudas sobre los campos que necesita el frontend o la estructura esperada, contacta al desarrollador frontend.

**Frontend está esperando**: Objetos relacionados completos, no solo IDs.
