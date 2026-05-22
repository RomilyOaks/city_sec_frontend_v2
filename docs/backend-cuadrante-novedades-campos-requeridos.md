# Backend — Campos requeridos en endpoint de Novedades de Cuadrante

**Fecha:** 2026-05-22 (actualizado con datos reales del CSV exportado)
**Módulo:** Operativos de Patrullaje → Exportar Excel → Hoja "Novedades"
**Solicitante:** Frontend CitySecure v2

---

## Endpoints involucrados

```
GET /api/v1/operativos/{operativo_id}/vehiculos/{vehiculo_asignado_id}/cuadrantes/{cuadrante_id}/novedades
GET /api/v1/operativos/{operativo_id}/personal/{personal_asignado_id}/cuadrantes/{cuadrante_id}/novedades
```

---

## Estructura ACTUAL que devuelve el backend (observada en pruebas 2026-05-22)

```json
{
  "id": 123,
  "novedad_id": 456,
  "prioridad": "MEDIA",
  "resultado": "PENDIENTE",
  "reportado": "2026-05-20T22:03:59",

  "novedad": {
    "descripcion": "se graba la novedad",
    "latitud": -12.19259250,
    "longitud": -77.02097850,
    "estado": 1,
    "reportante_telefono": "963258741"
  }
}
```

### Campos que YA funcionan correctamente

| Campo en Excel | Campo backend | Estado |
|---|---|---|
| Fecha Ocurrencia | `nov.reportado` | ✅ Funciona |
| Descripción | `nov.novedad.descripcion` | ✅ Funciona |
| Latitud | `nov.novedad.latitud` | ✅ Funciona |
| Longitud | `nov.novedad.longitud` | ✅ Funciona |
| Prioridad | `nov.prioridad` | ✅ Funciona |
| Resultado | `nov.resultado` | ✅ Funciona |
| Reportante Teléfono | `nov.novedad.reportante_telefono` | ✅ Funciona (en algunas novedades) |

---

## Campos faltantes — Acción requerida del backend

### PRIORIDAD ALTA — Agregar al select del objeto `novedad`

| Campo Excel | Campo en modelo | Por qué falla hoy |
|---|---|---|
| Código Novedad | `novedad.codigo` | No se incluye en el select del findAll |
| Tipo Novedad | `novedad.tipoNovedad.nombre` | Falta el `include: TipoNovedad` |
| Subtipo Novedad | `novedad.subtipoNovedad.nombre` | Falta el `include: SubtipoNovedad` |
| Estado Novedad | `novedad.estadoNovedad.nombre` | Se envía `novedad.estado = 1` (FK numérico), falta `include: EstadoNovedad` |
| Dirección | `novedad.direccion` | No se incluye en el select |
| Referencia | `novedad.referencia_ubicacion` | No se incluye en el select |

### PRIORIDAD MEDIA — Agregar al select del objeto `novedad`

| Campo Excel | Campo en modelo |
|---|---|
| Fecha/Hora Atención | `novedad.fecha_hora_atencion` |
| Observaciones Atención | `novedad.observaciones_atencion` |
| Reportante Nombre | `novedad.reportante_nombre` |

---

## Fix requerido en el controlador backend

En el método que responde los endpoints de cuadrante-novedades, actualizar el `include` del objeto `novedad`:

```javascript
include: [
  {
    model: Novedad,
    as: 'novedad',
    attributes: [
      'id',
      'codigo',                      // ← AGREGAR
      'descripcion',
      'fecha_hora_ocurrencia',
      'fecha_hora_atencion',         // ← AGREGAR
      'direccion',                   // ← AGREGAR
      'referencia_ubicacion',        // ← AGREGAR
      'latitud',
      'longitud',
      'prioridad_actual',
      'observaciones_atencion',      // ← AGREGAR
      'reportante_nombre',           // ← AGREGAR
      'reportante_telefono',
    ],
    include: [
      // ← AGREGAR estas 3 relaciones:
      { model: TipoNovedad,    as: 'tipoNovedad',    attributes: ['id', 'nombre'] },
      { model: SubtipoNovedad, as: 'subtipoNovedad',  attributes: ['id', 'nombre'] },
      { model: EstadoNovedad,  as: 'estadoNovedad',   attributes: ['id', 'nombre'] },
    ],
  },
]
```

> **Nota:** El campo `estado` actualmente devuelve el entero FK (ej. `1`). Al agregar `include: EstadoNovedad`, el frontend leerá `novedad.estadoNovedad.nombre` y mostrará el texto correcto (ej. "RESUELTA").

---

## Estructura completa esperada después del fix

```json
{
  "id": 123,
  "novedad_id": 456,
  "prioridad": "MEDIA",
  "resultado": "PENDIENTE",
  "reportado": "2026-05-20T22:03:59",

  "novedad": {
    "id": 456,
    "codigo": "NOV-0042",
    "descripcion": "se graba la novedad",
    "fecha_hora_ocurrencia": "2026-05-20T22:03:59",
    "fecha_hora_atencion": null,
    "direccion": "Av. Guardia Civil 1234",
    "referencia_ubicacion": "Frente al Banco",
    "latitud": -12.19259250,
    "longitud": -77.02097850,
    "prioridad_actual": "MEDIA",
    "observaciones_atencion": null,
    "reportante_nombre": "Juan Pérez",
    "reportante_telefono": "963258741",
    "novedadTipoNovedad":    { "id": 3, "nombre": "Robo al paso", "color_hex": "#FF0000", "icono": "alert" },
    "novedadSubtipoNovedad": { "id": 7, "nombre": "Robo de celular", "tiempo_respuesta_min": 10, "prioridad": "ALTA" },
    "novedadEstado":         { "id": 2, "nombre": "DESPACHADA", "color_hex": "#F59E0B", "icono": "truck", "orden": 2 }
  }
}
```

---

## Correcciones del backend — 2026-05-22

Fix aplicado en `operativosVehiculosNovedadesController.js` y `operativosPersonalNovedadesController.js`.
Se agregó `attributes` explícito en el `include` de `Novedad` dentro de `getNovedadesByCuadrante`.

### Corrección de nombres de campo y alias

El documento anterior usaba nombres incorrectos. La tabla a continuación muestra la corrección:

| Lo que pedía el doc (INCORRECTO) | Lo que devuelve el backend (CORRECTO) | Tipo |
|----------------------------------|---------------------------------------|------|
| `novedad.codigo` | `novedad.novedad_code` | campo directo |
| `novedad.tipoNovedad` | `novedad.novedadTipoNovedad` | alias Sequelize |
| `novedad.subtipoNovedad` | `novedad.novedadSubtipoNovedad` | alias Sequelize |
| `novedad.estadoNovedad` | `novedad.novedadEstado` | alias Sequelize |
| `novedad.direccion` | `novedad.localizacion` | el modelo no tiene campo `direccion` |
| `novedad.fecha_hora_atencion` | `novedad.fecha_llegada` | el modelo no tiene `fecha_hora_atencion` |
| `novedad.observaciones_atencion` | `novedad.observaciones` | el modelo no tiene `observaciones_atencion` |
| `novedad.referencia_ubicacion` | `novedad.referencia_ubicacion` | ✅ nombre correcto |
| `novedad.reportante_nombre` | `novedad.reportante_nombre` | ✅ nombre correcto |

### Campos efectivamente devueltos en `novedad` (desde 2026-05-22)

```
id, novedad_code, descripcion, fecha_hora_ocurrencia, fecha_llegada,
localizacion, referencia_ubicacion, latitud, longitud, prioridad_actual,
observaciones, reportante_nombre, reportante_telefono, estado_novedad_id,
origen_llamada, gravedad
```

Más los objetos relacionados:
```
novedadEstado      → { id, nombre, color_hex, icono, orden }
novedadTipoNovedad    → { id, nombre, color_hex, icono }
novedadSubtipoNovedad → { id, nombre, tiempo_respuesta_min, prioridad }
```

### Estructura real de la respuesta a usar en el frontend

```json
{
  "id": 123,
  "novedad_id": 456,
  "prioridad": "MEDIA",
  "resultado": "PENDIENTE",
  "reportado": "2026-05-20T22:03:59",
  "atendido": null,
  "observaciones": null,
  "acciones_tomadas": null,

  "novedad": {
    "id": 456,
    "novedad_code": "0000000018",
    "descripcion": "se graba la novedad",
    "fecha_hora_ocurrencia": "2026-05-20T22:03:59",
    "fecha_llegada": null,
    "localizacion": "Ca. Calle 6 N° 450",
    "referencia_ubicacion": "Frente al parque",
    "latitud": -12.19259250,
    "longitud": -77.02097850,
    "prioridad_actual": "MEDIA",
    "observaciones": null,
    "reportante_nombre": "Juan Pérez",
    "reportante_telefono": "963258741",
    "estado_novedad_id": 2,
    "origen_llamada": "REDES_SOCIALES",
    "gravedad": null,

    "novedadEstado":         { "id": 2, "nombre": "DESPACHADA", "color_hex": "#F59E0B", "icono": "truck", "orden": 2 },
    "novedadTipoNovedad":    { "id": 3, "nombre": "Actos inmorales", "color_hex": "#8B5CF6", "icono": "warning" },
    "novedadSubtipoNovedad": { "id": 7, "nombre": "En la vía pública", "tiempo_respuesta_min": 10, "prioridad": "MEDIA" }
  }
}
```
