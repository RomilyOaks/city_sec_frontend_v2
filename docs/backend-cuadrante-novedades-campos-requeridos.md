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
    "tipoNovedad":    { "id": 3, "nombre": "Robo al paso" },
    "subtipoNovedad": { "id": 7, "nombre": "Robo de celular" },
    "estadoNovedad":  { "id": 1, "nombre": "REGISTRADA" }
  }
}
```
