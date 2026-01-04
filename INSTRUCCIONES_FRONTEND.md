# 📋 Instrucciones para el Frontend - Endpoints Actualizados

**Fecha de actualización:** 2026-01-03
**Versión:** 2.3.0
**Estado:** ✅ IMPLEMENTADO

---

## ✅ Issue #1: Endpoint de Ubigeo - RESUELTO

### Cambios Implementados

El endpoint `/api/catalogos/ubigeo` ahora soporta el parámetro `ubigeo_code`.

### Endpoint Actualizado

```
GET /api/catalogos/ubigeo
```

### Parámetros Disponibles

| Parámetro | Tipo | Descripción | Ejemplo | ¿Nuevo? |
|-----------|------|-------------|---------|---------|
| `ubigeo_code` | string | Código ubigeo exacto (6 dígitos) | `150116` | ✅ NUEVO |
| `search` | string | Búsqueda por nombre (distrito, provincia, departamento) | `LINCE` | Existente |
| `departamento` | string | Filtro por departamento | `LIMA` | Existente |
| `provincia` | string | Filtro por provincia | `LIMA` | Existente |

### Ejemplos de Uso

#### 1. Buscar por código ubigeo específico (NUEVO)

```javascript
// ✅ AHORA FUNCIONA CORRECTAMENTE
GET /api/catalogos/ubigeo?ubigeo_code=150116

// Respuesta esperada:
{
  "success": true,
  "data": [
    {
      "ubigeo_code": "150116",
      "departamento": "LIMA",
      "provincia": "LIMA",
      "distrito": "LINCE"
    }
  ]
}
```

#### 2. Buscar por nombre de distrito

```javascript
GET /api/catalogos/ubigeo?search=LINCE

// Retorna todos los distritos que contengan "LINCE"
```

#### 3. Filtrar por departamento y provincia

```javascript
GET /api/catalogos/ubigeo?departamento=LIMA&provincia=LIMA

// Retorna todos los distritos de Lima Metropolitana
```

#### 4. Combinar filtros

```javascript
GET /api/catalogos/ubigeo?search=SAN&departamento=LIMA

// Retorna distritos de Lima que contengan "SAN" (San Isidro, San Miguel, etc.)
```

### Implementación en Frontend

```typescript
// TypeScript/JavaScript
interface UbigeoParams {
  ubigeo_code?: string;
  search?: string;
  departamento?: string;
  provincia?: string;
}

async function buscarUbigeo(params: UbigeoParams) {
  const queryParams = new URLSearchParams();

  if (params.ubigeo_code) {
    queryParams.append('ubigeo_code', params.ubigeo_code);
  }

  if (params.search) {
    queryParams.append('search', params.search);
  }

  if (params.departamento) {
    queryParams.append('departamento', params.departamento);
  }

  if (params.provincia) {
    queryParams.append('provincia', params.provincia);
  }

  const response = await fetch(`/api/catalogos/ubigeo?${queryParams}`);
  return response.json();
}

// Ejemplo de uso:
const lince = await buscarUbigeo({ ubigeo_code: '150116' });
console.log(lince.data[0].distrito); // "LINCE"
```

### Notas Importantes

- ✅ **Prioridad:** Si se envía `ubigeo_code`, se realiza una búsqueda exacta por ese código
- ✅ **Límite de resultados:** Máximo 50 registros por consulta
- ✅ **Compatibilidad:** No rompe funcionalidad existente, todos los parámetros anteriores siguen funcionando

---

## ✅ Issue #2: Ordenamiento en Novedades - RESUELTO

### Cambios Implementados

El endpoint `/api/novedades` ahora soporta ordenamiento dinámico mediante los parámetros `sort` y `order`.

### Endpoint Actualizado

```
GET /api/novedades
```

### Nuevos Parámetros de Ordenamiento

| Parámetro | Tipo | Valores Válidos | Descripción | Default |
|-----------|------|-----------------|-------------|---------|
| `sort` | string | Ver tabla abajo | Campo por el cual ordenar | `fecha_hora_ocurrencia` |
| `order` | string | `ASC`, `DESC` (case-insensitive) | Dirección del ordenamiento | `DESC` |

### Campos Válidos para `sort`

| Campo | Descripción | Tipo de Dato |
|-------|-------------|--------------|
| `novedad_code` | Código de novedad (000001, 000002, etc.) | string |
| `fecha_hora_ocurrencia` | Fecha y hora del incidente | datetime |
| `fecha_hora_reporte` | Fecha y hora del reporte | datetime |
| `prioridad_actual` | Prioridad (ALTA, MEDIA, BAJA) | enum |
| `created_at` | Fecha de creación del registro | datetime |
| `updated_at` | Última actualización | datetime |
| `id` | ID del registro | integer |

### Valores para `order`

- `ASC` o `asc`: Ascendente (A→Z, 1→9, antiguo→reciente)
- `DESC` o `desc`: Descendente (Z→A, 9→1, reciente→antiguo)

### Ejemplos de Uso

#### 1. Ordenar por código de novedad descendente (más recientes primero)

```javascript
// ✅ SOLUCIONA EL PROBLEMA REPORTADO
GET /api/novedades?sort=novedad_code&order=desc&page=1&limit=20

// Retorna: 000999, 000998, 000997, ...
```

#### 2. Ordenar por código de novedad ascendente (más antiguas primero)

```javascript
GET /api/novedades?sort=novedad_code&order=asc

// Retorna: 000001, 000002, 000003, ...
```

#### 3. Ordenar por fecha de ocurrencia (más recientes primero)

```javascript
GET /api/novedades?sort=fecha_hora_ocurrencia&order=desc

// Default si no se especifican parámetros
```

#### 4. Ordenar por prioridad

```javascript
GET /api/novedades?sort=prioridad_actual&order=desc

// Retorna: ALTA, ALTA, MEDIA, MEDIA, BAJA, ...
```

#### 5. Combinar con filtros existentes

```javascript
GET /api/novedades?estado_novedad_id=2&sort=novedad_code&order=desc&page=1&limit=20

// Filtra por estado Y ordena por código descendente
```

### Implementación en Frontend

```typescript
// TypeScript/JavaScript
interface NovedadesParams {
  // Filtros existentes
  fecha_inicio?: string;
  fecha_fin?: string;
  estado_novedad_id?: number;
  prioridad_actual?: string;
  sector_id?: number;
  tipo_novedad_id?: number;
  search?: string;

  // Paginación
  page?: number;
  limit?: number;

  // ✅ NUEVO: Ordenamiento
  sort?: 'novedad_code' | 'fecha_hora_ocurrencia' | 'fecha_hora_reporte' |
         'prioridad_actual' | 'created_at' | 'updated_at' | 'id';
  order?: 'ASC' | 'DESC' | 'asc' | 'desc';
}

async function obtenerNovedades(params: NovedadesParams) {
  const queryParams = new URLSearchParams();

  // Agregar todos los parámetros
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });

  const response = await fetch(`/api/novedades?${queryParams}`);
  return response.json();
}

// Ejemplo de uso:
const novedades = await obtenerNovedades({
  sort: 'novedad_code',
  order: 'DESC',
  page: 1,
  limit: 20
});
```

### Ejemplo de Componente React/Vue

```typescript
// React con TypeScript
import { useState, useEffect } from 'react';

function NovedadesGrid() {
  const [novedades, setNovedades] = useState([]);
  const [sortField, setSortField] = useState('novedad_code');
  const [sortOrder, setSortOrder] = useState('DESC');

  useEffect(() => {
    async function fetchData() {
      const data = await obtenerNovedades({
        sort: sortField,
        order: sortOrder,
        page: 1,
        limit: 20
      });
      setNovedades(data.data);
    }

    fetchData();
  }, [sortField, sortOrder]);

  const handleSortChange = (field: string) => {
    // Si se hace clic en la misma columna, invertir orden
    if (field === sortField) {
      setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSortField(field);
      setSortOrder('DESC');
    }
  };

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => handleSortChange('novedad_code')}>
            Código {sortField === 'novedad_code' && (sortOrder === 'DESC' ? '↓' : '↑')}
          </th>
          <th onClick={() => handleSortChange('fecha_hora_ocurrencia')}>
            Fecha {sortField === 'fecha_hora_ocurrencia' && (sortOrder === 'DESC' ? '↓' : '↑')}
          </th>
          {/* más columnas... */}
        </tr>
      </thead>
      <tbody>
        {novedades.map(novedad => (
          <tr key={novedad.id}>
            <td>{novedad.novedad_code}</td>
            <td>{novedad.fecha_hora_ocurrencia}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Validación de Seguridad

⚠️ **IMPORTANTE:** El backend valida los campos permitidos mediante una whitelist. Si se envía un campo no válido en `sort`, el backend usará el valor por defecto (`fecha_hora_ocurrencia`).

```javascript
// Campo inválido
GET /api/novedades?sort=campo_inexistente&order=desc

// Backend ignora "campo_inexistente" y usa "fecha_hora_ocurrencia" por defecto
```

### Comportamiento por Defecto

Si NO se especifican los parámetros `sort` y `order`:

```javascript
// Sin parámetros:
GET /api/novedades

// Equivalente a:
GET /api/novedades?sort=fecha_hora_ocurrencia&order=DESC

// Retorna novedades más recientes primero
```

### Notas Importantes

- ✅ **Seguridad:** Whitelist de campos previene SQL injection
- ✅ **Case-insensitive:** `ASC`, `asc`, `Asc` son todos válidos
- ✅ **Valores por defecto:** Si no se especifican, usa `fecha_hora_ocurrencia DESC`
- ✅ **Compatibilidad:** No rompe funcionalidad existente
- ✅ **Paginación:** Funciona correctamente con `page` y `limit`

---

## 🧪 Testing Recomendado

### Casos de Prueba para Ubigeo

```javascript
// Test 1: Buscar por código exacto
GET /api/catalogos/ubigeo?ubigeo_code=150116
// Esperado: 1 registro (LINCE)

// Test 2: Código inexistente
GET /api/catalogos/ubigeo?ubigeo_code=999999
// Esperado: array vacío

// Test 3: Combinar con otros filtros
GET /api/catalogos/ubigeo?ubigeo_code=150116&departamento=LIMA
// Esperado: 1 registro (ambos filtros se aplican)
```

### Casos de Prueba para Novedades

```javascript
// Test 1: Ordenar por código descendente
GET /api/novedades?sort=novedad_code&order=desc&limit=5
// Esperado: [000999, 000998, 000997, 000996, 000995]

// Test 2: Ordenar por código ascendente
GET /api/novedades?sort=novedad_code&order=asc&limit=5
// Esperado: [000001, 000002, 000003, 000004, 000005]

// Test 3: Campo inválido (fallback a default)
GET /api/novedades?sort=campo_invalido&order=desc
// Esperado: Ordenado por fecha_hora_ocurrencia DESC

// Test 4: Sin parámetros (default)
GET /api/novedades
// Esperado: Ordenado por fecha_hora_ocurrencia DESC
```

---

## 📊 Resumen de Cambios

| Endpoint | Cambio | Impacto | Retrocompatible |
|----------|--------|---------|-----------------|
| `/api/catalogos/ubigeo` | Agregado parámetro `ubigeo_code` | Permite búsqueda exacta por código | ✅ SÍ |
| `/api/novedades` | Agregados parámetros `sort` y `order` | Permite ordenamiento dinámico | ✅ SÍ |

---

## 🚀 Despliegue y Migración

### Backend

**Archivos modificados:**
1. `src/controllers/catalogosController.js` (líneas 591-614)
2. `src/controllers/novedadesController.js` (líneas 53-171)

**Cambios en base de datos:** ❌ Ninguno

**Reinicio requerido:** ✅ Sí (reiniciar servidor Node.js)

### Frontend

**Acciones requeridas:**

1. ✅ **Actualizar llamadas al endpoint de ubigeo:**
   - Cambiar de workaround temporal a uso directo de `ubigeo_code`

2. ✅ **Actualizar grid de novedades:**
   - Implementar parámetros `sort` y `order` en las peticiones
   - Actualizar UI para indicar columna y dirección de ordenamiento

3. ✅ **Testing:**
   - Validar ambos endpoints con los casos de prueba provistos

4. ✅ **Documentación interna:**
   - Actualizar documentación de API interna del frontend

**Tiempo estimado de implementación:** 2-3 horas

---

## 📞 Soporte

Si encuentran algún problema o necesitan aclaraciones adicionales:

1. Verificar que el backend esté actualizado (versión 2.3.0)
2. Revisar los ejemplos de este documento
3. Consultar los casos de prueba
4. Contactar al equipo de backend si persisten problemas

---

**Versión del documento:** 1.0
**Última actualización:** 2026-01-03
**Generado por:** Backend Team
