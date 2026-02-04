# Guia de Integracion Frontend - Subsectores y Estadisticas

**Fecha:** 2026-02-03
**Version Backend:** 2.3.0
**Autor:** Sistema de Seguridad Ciudadana

---

## Tabla de Contenidos

1. [Resumen de Cambios](#resumen-de-cambios)
2. [Nueva Entidad: Subsector](#nueva-entidad-subsector)
3. [Cambios en Cuadrante](#cambios-en-cuadrante)
4. [Nuevo Endpoint: Novedades en Atencion](#nuevo-endpoint-novedades-en-atencion)
5. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Resumen de Cambios

### Nueva Jerarquia Territorial

```
ANTES:                          AHORA:
Sector (1)                      Sector (1)
   └── Cuadrante (N)               └── Subsector (N)
                                          └── Cuadrante (N)
```

### Cambios Principales

| Cambio | Tipo | Impacto Frontend |
|--------|------|------------------|
| Nuevo modelo `Subsector` | CREATE | Nuevos endpoints CRUD, formularios, listados |
| Campo `subsector_id` en Cuadrante | UPDATE | Actualizar formularios de cuadrante |
| Campo `personal_supervisor_id` en Cuadrante | UPDATE | Selector de supervisor en formulario |
| Campo `referencia` en Cuadrante | UPDATE | Campo de texto en formulario |
| Endpoint `/novedades/dashboard/en-atencion` | CREATE | Nueva tarjeta en dashboard |

---

## Nueva Entidad: Subsector

### Estructura de Datos

```typescript
interface Subsector {
  id: number;
  subsector_code: string;      // Ej: "1A", "1B", "2C"
  nombre: string;              // Max 50 caracteres
  sector_id: number;           // FK a sectores
  personal_supervisor_id?: number; // FK a personal_seguridad (opcional)
  referencia?: string;         // Descripcion de limites
  poligono_json?: GeoJSON;     // Coordenadas del poligono
  radio_metros?: number;       // Para subsectores circulares
  color_mapa: string;          // Hex color, default "#10B981"
  estado: 0 | 1;               // 1=Activo, 0=Inactivo
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  deleted_at?: string;
  deleted_by?: number;

  // Relaciones (cuando se incluyen)
  sector?: Sector;
  supervisor?: PersonalSeguridad;
  cuadrantes?: Cuadrante[];
}
```

### Endpoints CRUD (Pendientes de implementar)

> **NOTA:** Los endpoints CRUD de subsectores aun no estan implementados.
> Cuando se implementen, seguiran este patron:

```
GET    /api/v1/subsectores                 # Listar todos
GET    /api/v1/subsectores/:id             # Obtener uno
GET    /api/v1/subsectores/sector/:sectorId # Por sector
POST   /api/v1/subsectores                 # Crear
PUT    /api/v1/subsectores/:id             # Actualizar
DELETE /api/v1/subsectores/:id             # Eliminar (soft)
```

### Ejemplo de Respuesta Esperada

```json
{
  "success": true,
  "data": {
    "id": 1,
    "subsector_code": "1A",
    "nombre": "Subsector Norte A",
    "sector_id": 1,
    "personal_supervisor_id": 5,
    "referencia": "Desde Av. Principal hasta Calle Los Alamos",
    "color_mapa": "#10B981",
    "estado": 1,
    "sector": {
      "id": 1,
      "sector_code": "S001",
      "nombre": "Sector Norte"
    },
    "supervisor": {
      "id": 5,
      "nombres": "Juan",
      "apellido_paterno": "Perez",
      "apellido_materno": "Garcia"
    }
  }
}
```

---

## Cambios en Cuadrante

### Nuevos Campos

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `subsector_id` | number | **SI** | FK al subsector padre |
| `personal_supervisor_id` | number | NO | FK al supervisor del cuadrante |
| `referencia` | string | NO | Descripcion de cruces de vias |

### Estructura Actualizada

```typescript
interface Cuadrante {
  id: number;
  cuadrante_code: string;
  nombre: string;
  sector_id: number;           // Mantiene relacion directa con sector
  subsector_id: number;        // *** NUEVO - REQUERIDO ***
  zona_code?: string;
  personal_supervisor_id?: number; // *** NUEVO ***
  referencia?: string;         // *** NUEVO ***
  latitud?: number;
  longitud?: number;
  poligono_json?: GeoJSON;
  radio_metros?: number;
  color_mapa: string;
  estado: boolean;
  // ... campos de auditoria

  // Relaciones
  sector?: Sector;
  subsector?: Subsector;       // *** NUEVA RELACION ***
  supervisor?: PersonalSeguridad; // *** NUEVA RELACION ***
}
```

### Impacto en Formularios

#### Formulario de Creacion/Edicion de Cuadrante

```jsx
// ANTES
<Select name="sector_id" label="Sector" required />

// AHORA - Selectores en cascada
<Select
  name="sector_id"
  label="Sector"
  required
  onChange={handleSectorChange}
/>

<Select
  name="subsector_id"
  label="Subsector"
  required
  disabled={!sectorId}
  options={subsectoresFiltrados}
/>

<Select
  name="personal_supervisor_id"
  label="Supervisor (opcional)"
  options={personalSeguridad}
/>

<TextArea
  name="referencia"
  label="Referencia de limites"
  placeholder="Ej: Desde Av. Principal hasta Calle 5..."
/>
```

#### Logica de Cascada

```javascript
const handleSectorChange = async (sectorId) => {
  // Limpiar subsector seleccionado
  setSubsectorId(null);

  // Cargar subsectores del sector
  const response = await api.get(`/subsectores/sector/${sectorId}`);
  setSubsectores(response.data);
};
```

---

## Nuevo Endpoint: Novedades en Atencion

### Endpoint

```
GET /api/v1/novedades/dashboard/en-atencion
```

### Descripcion

Retorna estadisticas de novedades que estan actualmente siendo atendidas, es decir, con estados:

| ID | Estado | Descripcion |
|----|--------|-------------|
| 2 | DESPACHADA | Unidad asignada y en camino |
| 3 | EN RUTA | Unidad desplazandose al lugar |
| 4 | EN LUGAR | Unidad llego al sitio |
| 5 | EN ATENCION | Atendiendo el incidente |

### Headers Requeridos

```
Authorization: Bearer <token>
```

### Respuesta

```json
{
  "success": true,
  "message": "Novedades en atencion obtenidas exitosamente",
  "data": {
    "totalEnAtencion": 15,
    "porEstado": [
      {
        "estado_novedad_id": 2,
        "cantidad": 3,
        "novedadEstado": {
          "id": 2,
          "nombre": "DESPACHADA",
          "color_hex": "#F59E0B",
          "icono": "truck",
          "orden": 2
        }
      },
      {
        "estado_novedad_id": 3,
        "cantidad": 5,
        "novedadEstado": {
          "id": 3,
          "nombre": "EN RUTA",
          "color_hex": "#3B82F6",
          "icono": "navigation",
          "orden": 3
        }
      },
      {
        "estado_novedad_id": 4,
        "cantidad": 4,
        "novedadEstado": {
          "id": 4,
          "nombre": "EN LUGAR",
          "color_hex": "#8B5CF6",
          "icono": "map-pin",
          "orden": 4
        }
      },
      {
        "estado_novedad_id": 5,
        "cantidad": 3,
        "novedadEstado": {
          "id": 5,
          "nombre": "EN ATENCION",
          "color_hex": "#10B981",
          "icono": "activity",
          "orden": 5
        }
      }
    ],
    "porPrioridad": [
      { "prioridad_actual": "ALTA", "cantidad": 5 },
      { "prioridad_actual": "MEDIA", "cantidad": 7 },
      { "prioridad_actual": "BAJA", "cantidad": 3 }
    ],
    "porTipo": [
      {
        "tipo_novedad_id": 1,
        "cantidad": 8,
        "novedadTipoNovedad": {
          "id": 1,
          "nombre": "Robo",
          "color_hex": "#EF4444",
          "icono": "alert-triangle"
        }
      }
    ],
    "novedadesDetalle": [
      {
        "id": 123,
        "novedad_code": "000123",
        "fecha_hora_ocurrencia": "2026-02-03T14:30:00.000Z",
        "localizacion": "Av. Principal 123",
        "prioridad_actual": "ALTA",
        "fecha_despacho": "2026-02-03T14:35:00.000Z",
        "tiempo_respuesta_min": 5,
        "novedadEstado": {
          "id": 3,
          "nombre": "EN RUTA",
          "color_hex": "#3B82F6",
          "icono": "navigation"
        },
        "novedadTipoNovedad": {
          "id": 1,
          "nombre": "Robo",
          "color_hex": "#EF4444"
        },
        "novedadUnidadOficina": {
          "id": 1,
          "nombre": "Central 107",
          "codigo": "C107"
        },
        "novedadVehiculo": {
          "id": 5,
          "placa": "ABC-123",
          "codigo_vehiculo": "PAT-05"
        }
      }
    ],
    "estadosIncluidos": [2, 3, 4, 5]
  }
}
```

### TypeScript Interface

```typescript
interface NovedadesEnAtencionResponse {
  success: boolean;
  message: string;
  data: {
    totalEnAtencion: number;
    porEstado: EstadoCount[];
    porPrioridad: PrioridadCount[];
    porTipo: TipoCount[];
    novedadesDetalle: NovedadDetalle[];
    estadosIncluidos: number[];
  };
}

interface EstadoCount {
  estado_novedad_id: number;
  cantidad: number;
  novedadEstado: {
    id: number;
    nombre: string;
    color_hex: string;
    icono: string;
    orden: number;
  };
}

interface PrioridadCount {
  prioridad_actual: 'ALTA' | 'MEDIA' | 'BAJA';
  cantidad: number;
}

interface TipoCount {
  tipo_novedad_id: number;
  cantidad: number;
  novedadTipoNovedad: {
    id: number;
    nombre: string;
    color_hex: string;
    icono: string;
  };
}

interface NovedadDetalle {
  id: number;
  novedad_code: string;
  fecha_hora_ocurrencia: string;
  localizacion: string;
  prioridad_actual: string;
  fecha_despacho: string | null;
  tiempo_respuesta_min: number | null;
  novedadEstado: { id: number; nombre: string; color_hex: string; icono: string };
  novedadTipoNovedad: { id: number; nombre: string; color_hex: string };
  novedadUnidadOficina: { id: number; nombre: string; codigo: string } | null;
  novedadVehiculo: { id: number; placa: string; codigo_vehiculo: string } | null;
}
```

---

## Ejemplos de Uso

### Service para Subsectores

```javascript
// services/subsectorService.js

import api from './api';

export const subsectorService = {
  // Obtener todos los subsectores activos
  getAll: () => api.get('/subsectores'),

  // Obtener subsector por ID
  getById: (id) => api.get(`/subsectores/${id}`),

  // Obtener subsectores de un sector
  getBySector: (sectorId) => api.get(`/subsectores/sector/${sectorId}`),

  // Crear subsector
  create: (data) => api.post('/subsectores', data),

  // Actualizar subsector
  update: (id, data) => api.put(`/subsectores/${id}`, data),

  // Eliminar subsector
  delete: (id) => api.delete(`/subsectores/${id}`),
};
```

### Service para Novedades en Atencion

```javascript
// services/novedadesService.js

// Agregar al servicio existente:

export const getNovedadesEnAtencion = async () => {
  const response = await api.get('/novedades/dashboard/en-atencion');
  return response.data;
};
```

### Componente de Dashboard

```jsx
// components/Dashboard/NovedadesEnAtencionCard.jsx

import { useState, useEffect } from 'react';
import { getNovedadesEnAtencion } from '@/services/novedadesService';

export const NovedadesEnAtencionCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getNovedadesEnAtencion();
        setData(response.data);
      } catch (error) {
        console.error('Error cargando novedades en atencion:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refrescar cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Skeleton />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novedades en Atencion</CardTitle>
        <Badge variant="info">{data.totalEnAtencion}</Badge>
      </CardHeader>

      <CardContent>
        {/* Barras por estado */}
        <div className="space-y-2">
          {data.porEstado.map((item) => (
            <div key={item.estado_novedad_id} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.novedadEstado.color_hex }}
              />
              <span className="flex-1">{item.novedadEstado.nombre}</span>
              <Badge>{item.cantidad}</Badge>
            </div>
          ))}
        </div>

        {/* Desglose por prioridad */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {data.porPrioridad.map((item) => (
            <div
              key={item.prioridad_actual}
              className={`text-center p-2 rounded ${
                item.prioridad_actual === 'ALTA' ? 'bg-red-100' :
                item.prioridad_actual === 'MEDIA' ? 'bg-yellow-100' : 'bg-green-100'
              }`}
            >
              <div className="text-2xl font-bold">{item.cantidad}</div>
              <div className="text-xs">{item.prioridad_actual}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

### Selector de Subsector en Cascada

```jsx
// components/Forms/SectorSubsectorSelect.jsx

import { useState, useEffect } from 'react';
import { sectorService } from '@/services/sectorService';
import { subsectorService } from '@/services/subsectorService';

export const SectorSubsectorSelect = ({
  value,
  onChange,
  sectorValue,
  onSectorChange
}) => {
  const [sectores, setSectores] = useState([]);
  const [subsectores, setSubsectores] = useState([]);
  const [loadingSubsectores, setLoadingSubsectores] = useState(false);

  // Cargar sectores al montar
  useEffect(() => {
    sectorService.getAll().then(res => setSectores(res.data));
  }, []);

  // Cargar subsectores cuando cambia el sector
  useEffect(() => {
    if (sectorValue) {
      setLoadingSubsectores(true);
      subsectorService.getBySector(sectorValue)
        .then(res => setSubsectores(res.data))
        .finally(() => setLoadingSubsectores(false));
    } else {
      setSubsectores([]);
    }
  }, [sectorValue]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <Select
        label="Sector"
        value={sectorValue}
        onChange={(e) => {
          onSectorChange(e.target.value);
          onChange(null); // Limpiar subsector
        }}
        required
      >
        <option value="">Seleccione sector</option>
        {sectores.map(s => (
          <option key={s.id} value={s.id}>
            {s.sector_code} - {s.nombre}
          </option>
        ))}
      </Select>

      <Select
        label="Subsector"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!sectorValue || loadingSubsectores}
        required
      >
        <option value="">
          {loadingSubsectores ? 'Cargando...' : 'Seleccione subsector'}
        </option>
        {subsectores.map(s => (
          <option key={s.id} value={s.id}>
            {s.subsector_code} - {s.nombre}
          </option>
        ))}
      </Select>
    </div>
  );
};
```

---

## Checklist de Implementacion Frontend

### Modulo Subsectores (Nuevo)

- [ ] Crear servicio `subsectorService.js`
- [ ] Crear pagina de listado de subsectores
- [ ] Crear formulario de creacion/edicion
- [ ] Agregar al menu de navegacion
- [ ] Implementar filtro por sector

### Modulo Cuadrantes (Actualizar)

- [ ] Actualizar formulario con campo `subsector_id` (requerido)
- [ ] Implementar selector en cascada Sector -> Subsector
- [ ] Agregar campo `personal_supervisor_id` (opcional)
- [ ] Agregar campo `referencia` (textarea)
- [ ] Actualizar listado para mostrar subsector
- [ ] Actualizar interfaces/types

### Dashboard (Nuevo Widget)

- [ ] Crear componente `NovedadesEnAtencionCard`
- [ ] Integrar en pagina de dashboard
- [ ] Implementar auto-refresh (cada 30s recomendado)
- [ ] Mostrar desglose por estado con colores
- [ ] Mostrar desglose por prioridad

---

## Contacto

Para dudas sobre esta integracion, contactar al equipo de backend.
