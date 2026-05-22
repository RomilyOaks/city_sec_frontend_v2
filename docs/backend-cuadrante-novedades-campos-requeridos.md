# Backend — Campos requeridos en endpoint de Novedades de Cuadrante

**Fecha:** 2026-05-21  
**Módulo:** Operativos de Patrullaje → Exportar Excel → Hoja "Novedades"  
**Solicitante:** Frontend CitySecure v2

---

## Contexto

El frontend llama a estos endpoints para obtener las novedades asociadas a cada cuadrante de un operativo:

```
GET /api/v1/operativos/{operativo_id}/vehiculos/{vehiculo_asignado_id}/cuadrantes/{cuadrante_id}/novedades
GET /api/v1/operativos/{operativo_id}/personal/{personal_asignado_id}/cuadrantes/{cuadrante_id}/novedades
```

Con la respuesta construye la hoja **"Novedades"** del Excel de Reporte de Operativos de Patrullaje.

---

## Estructura de respuesta esperada

Cada elemento del array debe tener la siguiente estructura:

```json
{
  "id": 123,
  "novedad_id": 456,
  "prioridad": "ALTA",
  "resultado": "ATENDIDA",
  "reportado": "2026-05-20T14:30:00",
  "observaciones": "Texto de observaciones del operativo",
  "observaciones_atencion": "Texto de atención del operativo",
  "fecha_atencion": "2026-05-20T15:00:00",

  "novedad": {
    "id": 456,
    "codigo": "NOV-0042",
    "fecha_hora_ocurrencia": "2026-05-20T14:25:00",
    "fecha_hora_atencion": "2026-05-20T15:00:00",

    "tipoNovedad": {
      "id": 3,
      "nombre": "Robo al paso"
    },
    "subtipoNovedad": {
      "id": 7,
      "nombre": "Robo de celular"
    },

    "descripcion": "Ciudadano reporta robo de celular en la esquina de ...",

    "direccion": "Av. Guardia Civil 1234",
    "referencia_ubicacion": "Frente al Banco de la Nación",
    "latitud": -12.1628,
    "longitud": -77.0142,

    "estadoNovedad": {
      "id": 4,
      "nombre": "RESUELTA"
    },
    "prioridad_actual": "ALTA",

    "observaciones_atencion": "Se intervino a 2 sospechosos y se recuperó el celular.",

    "reportante_nombre": "Juan Pérez García",
    "reportante_telefono": "987654321"
  }
}
```

---

## Campos mapeados en el Excel (26 columnas)

| Columna Excel | Campo en respuesta | Ruta en JSON |
|---|---|---|
| Código Novedad | `novedad.codigo` | `nov.novedad.codigo` |
| Fecha Ocurrencia | `novedad.fecha_hora_ocurrencia` | `nov.novedad.fecha_hora_ocurrencia` o `nov.reportado` |
| Fecha/Hora Atención | `novedad.fecha_hora_atencion` | `nov.novedad.fecha_hora_atencion` o `nov.fecha_atencion` |
| Tipo Novedad | `novedad.tipoNovedad.nombre` | `nov.novedad.tipoNovedad.nombre` |
| Subtipo Novedad | `novedad.subtipoNovedad.nombre` | `nov.novedad.subtipoNovedad.nombre` |
| Descripción | `novedad.descripcion` | `nov.novedad.descripcion` |
| Dirección | `novedad.direccion` | `nov.novedad.direccion` |
| Referencia | `novedad.referencia_ubicacion` | `nov.novedad.referencia_ubicacion` |
| Latitud | `novedad.latitud` | `nov.novedad.latitud` |
| Longitud | `novedad.longitud` | `nov.novedad.longitud` |
| Estado Novedad | `novedad.estadoNovedad.nombre` | `nov.novedad.estadoNovedad.nombre` |
| Prioridad | `prioridad` (del operativo) | `nov.prioridad` |
| Resultado | `resultado` (del operativo) | `nov.resultado` |
| Observaciones Atención | `novedad.observaciones_atencion` | `nov.novedad.observaciones_atencion` |
| Reportante Nombre | `novedad.reportante_nombre` | `nov.novedad.reportante_nombre` |
| Reportante Teléfono | `novedad.reportante_telefono` | `nov.novedad.reportante_telefono` |
| Turno | (del turno operativo) | context |
| Sector | (del turno operativo) | context |
| Operador | (del turno operativo) | context |
| Supervisor | (del turno operativo) | context |
| Tipo Recurso | VEHICULO / PERSONAL | context |
| Recurso (Placa/Personal) | placa o nombre del personal | context |
| Cuadrante Código | cuadrante code | cuadrante context |
| Cuadrante Nombre | cuadrante nombre | cuadrante context |
| Hora Ingreso Cuadrante | cuadrante hora_ingreso | cuadrante context |
| Hora Salida Cuadrante | cuadrante hora_salida | cuadrante context |

---

## Campos actualmente ausentes en la respuesta del backend

Los siguientes campos **no están llegando** al frontend (o vienen vacíos/null) porque el endpoint de cuadrante novedades no los incluye en el objeto `novedad` anidado:

| Campo | Modelo Sequelize esperado | Prioridad |
|---|---|---|
| `novedad.codigo` | `Novedad.codigo` | **ALTA** — es el identificador visible (NOV-XXXX) |
| `novedad.subtipoNovedad` | include SubtipoNovedad | **ALTA** |
| `novedad.estadoNovedad` | include EstadoNovedad | **ALTA** |
| `novedad.direccion` | `Novedad.direccion` | **ALTA** |
| `novedad.referencia_ubicacion` | `Novedad.referencia_ubicacion` | **ALTA** |
| `novedad.fecha_hora_atencion` | `Novedad.fecha_hora_atencion` | **MEDIA** |
| `novedad.observaciones_atencion` | `Novedad.observaciones_atencion` | **MEDIA** |
| `novedad.reportante_nombre` | `Novedad.reportante_nombre` | **MEDIA** |
| `novedad.reportante_telefono` | `Novedad.reportante_telefono` | **MEDIA** |
| `novedad.latitud` | `Novedad.latitud` | **BAJA** |
| `novedad.longitud` | `Novedad.longitud` | **BAJA** |

---

## Acción requerida del backend

En el controlador que responde los endpoints de cuadrante-novedades, agregar los siguientes `include` de Sequelize al `findAll` de novedades:

```javascript
include: [
  {
    model: Novedad,
    as: 'novedad',
    attributes: [
      'id', 'codigo', 'descripcion',
      'fecha_hora_ocurrencia', 'fecha_hora_atencion',
      'direccion', 'referencia_ubicacion', 'latitud', 'longitud',
      'prioridad_actual', 'observaciones_atencion',
      'reportante_nombre', 'reportante_telefono',
    ],
    include: [
      { model: TipoNovedad,    as: 'tipoNovedad',    attributes: ['id', 'nombre'] },
      { model: SubtipoNovedad, as: 'subtipoNovedad',  attributes: ['id', 'nombre'] },
      { model: EstadoNovedad,  as: 'estadoNovedad',   attributes: ['id', 'nombre'] },
    ],
  },
]
```

> **Nota:** Los nombres exactos de los modelos y aliases deben coincidir con los definidos en `models/index.js` del backend. Ajustar si difieren.
