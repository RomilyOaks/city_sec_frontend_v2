# Respuestas del Backend a Consultas del Frontend

**Fecha:** 2026-01-03
**Backend Version:** 2.2.0
**Respondido por:** Backend Team - Claude

---

## Issue #1: Ubigeo 150116 Retornando Datos Incorrectos

### 🔍 Análisis del Problema

**Estado:** ✅ IDENTIFICADO - El endpoint NO soporta filtrado por `ubigeo_code`

### Endpoint Actual

```
GET /api/catalogos/ubigeo
```

**Ubicación del código:**
- Ruta: `src/routes/catalogos.routes.js:169`
- Controlador: `src/controllers/catalogosController.js:589-633`

### Parámetros Soportados (líneas 591-609)

El endpoint `buscarUbigeo` actualmente **SOLO** soporta estos parámetros:

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `search` | string | Búsqueda por nombre (distrito, provincia, departamento) | `?search=LINCE` |
| `departamento` | string | Filtro exacto por departamento | `?departamento=LIMA` |
| `provincia` | string | Filtro exacto por provincia | `?provincia=LIMA` |

### ❌ Problema Identificado

**El parámetro `ubigeo_code` NO está implementado en el backend.**

Cuando frontend envía:
```
GET /api/catalogos/ubigeo?ubigeo_code=150116
```

El backend **IGNORA** el parámetro `ubigeo_code` y retorna los primeros 50 registros ordenados alfabéticamente, por eso devuelve ARAMANGO (que está alfabéticamente antes que LINCE).

### Código Actual (líneas 589-633)

```javascript
const buscarUbigeo = async (req, res) => {
  try {
    const { search, departamento, provincia } = req.query;
    // ❌ ubigeo_code NO está siendo extraído aquí

    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { distrito: { [Op.like]: `%${search}%` } },
        { provincia: { [Op.like]: `%${search}%` } },
        { departamento: { [Op.like]: `%${search}%` } },
      ];
    }

    if (departamento) {
      whereClause.departamento = departamento;
    }

    if (provincia) {
      whereClause.provincia = provincia;
    }

    // ❌ No hay validación para ubigeo_code

    const ubigeos = await Ubigeo.findAll({
      where: whereClause,
      limit: 50,  // ⚠️ Retorna primeros 50 sin filtro específico
      order: [
        ["departamento", "ASC"],
        ["provincia", "ASC"],
        ["distrito", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      data: ubigeos,
    });
  } catch (error) {
    // ...
  }
};
```

### ✅ Solución Propuesta

**Opción 1: Usar endpoint de ubigeo existente (RECOMENDADO para casos específicos)**

Para obtener un ubigeo específico por código, usar el controlador de ubigeo:

```
GET /api/ubigeo/:ubigeoCode
```

**Ubicación:** `src/controllers/ubigeoController.js` (si existe) o crear endpoint específico.

**Opción 2: Modificar endpoint de catálogos (SI SE REQUIERE)**

Agregar soporte para `ubigeo_code` en el controlador actual:

```javascript
const { search, departamento, provincia, ubigeo_code } = req.query;

// Agregar después de línea 609:
if (ubigeo_code) {
  whereClause.ubigeo_code = ubigeo_code;
}
```

### 📋 Respuestas a Preguntas Específicas

1. **¿El endpoint filtra correctamente por `ubigeo_code`?**
   - ❌ NO. El parámetro `ubigeo_code` no está implementado.

2. **¿Existe algún problema de índice o JOIN?**
   - ✅ NO. No hay JOINs en este endpoint. El problema es que el parámetro no existe.

3. **¿Hay duplicados o problemas de integridad en la tabla ubigeo?**
   - ✅ Probable que NO. La query directa funciona correctamente.

4. **¿El parámetro correcto es `ubigeo_code` o debería ser otro nombre?**
   - ℹ️ El campo en la base de datos es `ubigeo_code`, pero el endpoint NO lo soporta actualmente.

### 🎯 Solución Inmediata para Frontend

**SOLUCIÓN TEMPORAL:**

Usar el parámetro `search` con el nombre del distrito:

```javascript
// En lugar de:
GET /api/catalogos/ubigeo?ubigeo_code=150116

// Usar:
GET /api/catalogos/ubigeo?search=LINCE&departamento=LIMA&provincia=LIMA
```

**SOLUCIÓN DEFINITIVA (requiere cambio en backend):**

Backend debe agregar soporte para `ubigeo_code` modificando líneas 591 y 609-610 de `catalogosController.js`.

---

## Issue #2: Ordenamiento en Novedades No Funciona

### 🔍 Análisis del Problema

**Estado:** ✅ IDENTIFICADO - El endpoint NO soporta parámetros `sort` y `order`

### Endpoint Actual

```
GET /api/novedades
```

**Ubicación del código:**
- Ruta: `src/routes/novedades.routes.js`
- Controlador: `src/controllers/novedadesController.js:53-173`

### ❌ Problema Identificado

**Los parámetros `sort` y `order` NO están implementados en el backend.**

El endpoint tiene un **ordenamiento fijo (hardcoded)** en las líneas 146-149:

```javascript
order: [
  ["prioridad_actual", "DESC"],      // ← FIJO: Prioridad descendente
  ["fecha_hora_ocurrencia", "DESC"], // ← FIJO: Fecha descendente
],
```

### Parámetros Soportados Actualmente (líneas 55-65)

| Parámetro | Tipo | Descripción | ¿Funciona? |
|-----------|------|-------------|------------|
| `fecha_inicio` | date | Filtro fecha inicio | ✅ SÍ |
| `fecha_fin` | date | Filtro fecha fin | ✅ SÍ |
| `estado_novedad_id` | integer | Filtro por estado | ✅ SÍ |
| `prioridad_actual` | string | Filtro por prioridad | ✅ SÍ |
| `sector_id` | integer | Filtro por sector | ✅ SÍ |
| `tipo_novedad_id` | integer | Filtro por tipo | ✅ SÍ |
| `search` | string | Búsqueda en múltiples campos | ✅ SÍ |
| `page` | integer | Página (paginación) | ✅ SÍ |
| `limit` | integer | Límite de resultados | ✅ SÍ |
| **`sort`** | string | **❌ NO SOPORTADO** | ❌ NO |
| **`order`** | string | **❌ NO SOPORTADO** | ❌ NO |

### Código Actual (líneas 53-173)

```javascript
export const getAllNovedades = async (req, res) => {
  try {
    const {
      fecha_inicio,
      fecha_fin,
      estado_novedad_id,
      prioridad_actual,
      sector_id,
      tipo_novedad_id,
      search,
      page = 1,
      limit = 50,
      // ❌ sort y order NO están siendo extraídos aquí
    } = req.query;

    // ... filtros ...

    const { count, rows } = await Novedad.findAndCountAll({
      where: whereClause,
      include: [ /* ... */ ],
      order: [
        ["prioridad_actual", "DESC"],      // ← HARDCODED
        ["fecha_hora_ocurrencia", "DESC"], // ← HARDCODED
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // ...
  }
};
```

### ✅ Solución Propuesta

**Opción 1: Implementar soporte para `sort` y `order` (RECOMENDADO)**

Modificar el controlador `novedadesController.js` líneas 53-173:

```javascript
const {
  // ... parámetros existentes
  sort = 'fecha_hora_ocurrencia',  // campo por defecto
  order = 'DESC',                  // orden por defecto
} = req.query;

// Validar campo de ordenamiento (whitelist)
const validSortFields = [
  'novedad_code',
  'fecha_hora_ocurrencia',
  'fecha_hora_reporte',
  'prioridad_actual',
  'created_at',
  'updated_at'
];

const sortField = validSortFields.includes(sort) ? sort : 'fecha_hora_ocurrencia';
const sortOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

// Usar en la query:
const { count, rows } = await Novedad.findAndCountAll({
  where: whereClause,
  include: [ /* ... */ ],
  order: [[sortField, sortOrder]],  // ← DINÁMICO
  limit: parseInt(limit),
  offset: parseInt(offset),
});
```

**Opción 2: Frontend se adapta al ordenamiento fijo (NO RECOMENDADO)**

Frontend ordena los resultados en el cliente después de recibirlos (ineficiente para datasets grandes).

### 📋 Respuestas a Preguntas Específicas

1. **¿El endpoint /novedades soporta los parámetros `sort` y `order`?**
   - ❌ NO. No están implementados.

2. **Si no los soporta, ¿cuáles son los parámetros correctos?**
   - ℹ️ No hay parámetros alternativos. El ordenamiento es fijo.

3. **¿Cuáles son los nombres de campos válidos para `sort`?**
   - ℹ️ Si se implementa, los campos válidos deberían ser:
     - `novedad_code` (código de novedad)
     - `fecha_hora_ocurrencia` (fecha del incidente)
     - `fecha_hora_reporte` (fecha de reporte)
     - `prioridad_actual` (prioridad: ALTA, MEDIA, BAJA)
     - `created_at` (fecha de creación en BD)
     - `updated_at` (última actualización)

4. **¿Los valores válidos para `order` son `asc` y `desc`?**
   - ✅ SÍ, si se implementa deberían ser: `ASC` o `DESC` (case-insensitive).

5. **¿Hay algún ordenamiento por defecto que sobrescriba estos parámetros?**
   - ✅ SÍ. Ordenamiento fijo: `prioridad_actual DESC, fecha_hora_ocurrencia DESC`

### 🎯 Solución Inmediata para Frontend

**SOLUCIÓN TEMPORAL:**

El backend siempre ordena por:
1. `prioridad_actual` DESC (prioridad alta primero)
2. `fecha_hora_ocurrencia` DESC (más recientes primero)

Si frontend necesita otro ordenamiento, debe hacerlo en el cliente.

**SOLUCIÓN DEFINITIVA (requiere cambio en backend):**

Backend debe implementar soporte para `sort` y `order` como se describe arriba.

### 📊 Estructura de Datos Retornada

```json
{
  "success": true,
  "message": "Novedades obtenidas exitosamente",
  "data": [
    {
      "id": 123,
      "novedad_code": "000123",
      "fecha_hora_ocurrencia": "2026-01-03T10:30:00.000Z",
      "prioridad_actual": "ALTA",
      "descripcion": "...",
      // ... más campos
    }
  ],
  "pagination": {
    "total": 500,
    "page": 1,
    "limit": 20,
    "totalPages": 25
  }
}
```

---

## 🔧 Recomendaciones Generales

### Para el Frontend:

1. **Ubigeo:**
   - Usar `search` + `departamento` + `provincia` hasta que backend implemente `ubigeo_code`
   - Validar que el resultado coincida con el distrito esperado

2. **Novedades:**
   - El ordenamiento actual es: Prioridad DESC → Fecha DESC
   - Si necesitan otro orden, implementar ordenamiento en cliente (temporal)
   - Solicitar formalmente implementación de `sort` y `order` al backend

### Para el Backend:

1. **Issue #1 - Ubigeo:**
   - **Prioridad:** MEDIA
   - **Esfuerzo:** 15 minutos
   - **Archivo:** `src/controllers/catalogosController.js`
   - **Líneas a modificar:** 591, 609-610
   - **Cambio:** Agregar soporte para `ubigeo_code`

2. **Issue #2 - Ordenamiento Novedades:**
   - **Prioridad:** ALTA (funcionalidad común)
   - **Esfuerzo:** 30 minutos
   - **Archivo:** `src/controllers/novedadesController.js`
   - **Líneas a modificar:** 53-173
   - **Cambio:** Implementar ordenamiento dinámico con whitelist de campos

---

## 📞 Contacto y Seguimiento

- Si necesitan aclaración adicional, por favor indicar.
- Si aprueban los cambios propuestos, puedo implementarlos inmediatamente.
- Estimar tiempo total de implementación: **45 minutos**

**Archivos a modificar:**
1. `src/controllers/catalogosController.js` (ubigeo_code)
2. `src/controllers/novedadesController.js` (sort & order)

---

**Generado:** 2026-01-03
**Versión del Documento:** 1.0
