# 🏢 Guía Frontend: Gestión de Unidades/Oficinas

## 📋 Índice
1. [Información General](#información-general)
2. [Endpoints Disponibles](#endpoints-disponibles)
3. [Estructura de Datos](#estructura-de-datos)
4. [Ejemplos de Implementación](#ejemplos-de-implementación)
5. [Validaciones](#validaciones)
6. [Permisos RBAC](#permisos-rbac)
7. [Casos de Uso](#casos-de-uso)

---

## 📊 Información General

### ¿Qué son las Unidades/Oficinas?

Las **Unidades/Oficinas** son entidades operativas que atienden novedades e incidentes en el sistema de seguridad ciudadana. Ejemplos:

- 🚨 **Comisarías PNP** (Policía Nacional del Perú)
- 👮 **Bases de Serenazgo**
- 🚒 **Estaciones de Bomberos**
- 🚑 **Centros de Salud / Ambulancias**
- 🚧 **Defensa Civil**
- 🚦 **Unidades de Tránsito**

### Características Principales

- ✅ **7 tipos de unidades** predefinidas
- ✅ **Ubicación GPS** con radio de cobertura
- ✅ **Horarios de operación** (24h o limitado)
- ✅ **Filtros avanzados** por tipo, estado, ubicación
- ✅ **Soft delete** con auditoría completa
- ✅ **Códigos únicos** de identificación

---

## 🔌 Endpoints Disponibles

### Base URL
```
https://tu-backend.railway.app/api/v1/unidades-oficina
```

---

### 1️⃣ **Listar Unidades**

#### `GET /api/v1/unidades-oficina`

**Descripción**: Obtiene todas las unidades con filtros opcionales.

**Autenticación**: ✅ Requerida (Bearer Token)

**Permisos**: Todos los usuarios autenticados

**Query Parameters**:

| Parámetro | Tipo | Opcional | Descripción | Ejemplo |
|-----------|------|----------|-------------|---------|
| `tipo_unidad` | string | ✅ | Filtrar por tipo | `SERENAZGO`, `PNP`, `BOMBEROS` |
| `estado` | boolean | ✅ | Filtrar activas/inactivas | `true`, `false`, `1`, `0` |
| `activo_24h` | boolean | ✅ | Filtrar por horario 24h | `true`, `false` |
| `ubigeo` | string | ✅ | Filtrar por código ubigeo | `150140` |
| `search` | string | ✅ | Buscar por nombre o código | `SAGITARIO`, `PNP-SURCO` |

**Ejemplo Request**:
```bash
GET /api/v1/unidades-oficina?tipo_unidad=SERENAZGO&estado=true
Authorization: Bearer {token}
```

**Ejemplo Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "codigo": "CIA-SAGITARIO",
      "nombre": "Compañía Sagitario - Serenazgo Surco",
      "tipo_unidad": "SERENAZGO",
      "telefono": "01-4115858",
      "email": "sagitario@munisurco.gob.pe",
      "direccion": "Av. Benavides 495, Santiago de Surco",
      "ubigeo": "150140",
      "latitud": "-12.1234560",
      "longitud": "-77.0123450",
      "radio_cobertura_km": "5.00",
      "activo_24h": true,
      "horario_inicio": null,
      "horario_fin": null,
      "estado": true,
      "created_at": "2025-01-05T10:00:00.000Z",
      "updated_at": "2025-01-05T10:00:00.000Z",
      "deleted_at": null,
      "created_by": 1,
      "updated_by": 1,
      "deleted_by": null,
      "unidadOficinaUbigeo": {
        "ubigeo_code": "150140",
        "departamento": "Lima",
        "provincia": "Lima",
        "distrito": "Santiago de Surco"
      }
    }
  ]
}
```

---

### 2️⃣ **Obtener Unidad por ID**

#### `GET /api/v1/unidades-oficina/:id`

**Descripción**: Obtiene los detalles de una unidad específica.

**Autenticación**: ✅ Requerida

**Permisos**: Todos los usuarios autenticados

**Path Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID de la unidad |

**Ejemplo Request**:
```bash
GET /api/v1/unidades-oficina/1
Authorization: Bearer {token}
```

**Ejemplo Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "codigo": "CIA-SAGITARIO",
    "nombre": "Compañía Sagitario - Serenazgo Surco",
    "tipo_unidad": "SERENAZGO",
    "telefono": "01-4115858",
    "email": "sagitario@munisurco.gob.pe",
    "direccion": "Av. Benavides 495, Santiago de Surco",
    "ubigeo": "150140",
    "latitud": "-12.1234560",
    "longitud": "-77.0123450",
    "radio_cobertura_km": "5.00",
    "activo_24h": true,
    "horario_inicio": null,
    "horario_fin": null,
    "estado": true,
    "unidadOficinaUbigeo": {
      "ubigeo_code": "150140",
      "departamento": "Lima",
      "provincia": "Lima",
      "distrito": "Santiago de Surco"
    }
  }
}
```

---

### 3️⃣ **Crear Unidad**

#### `POST /api/v1/unidades-oficina`

**Descripción**: Crea una nueva unidad operativa.

**Autenticación**: ✅ Requerida

**Permisos**: `super_admin`, `admin`, `supervisor`

**Request Body**:

| Campo | Tipo | Requerido | Descripción | Ejemplo |
|-------|------|-----------|-------------|---------|
| `nombre` | string | ✅ | Nombre de la unidad (3-100 chars) | `"Comisaría PNP Surco"` |
| `tipo_unidad` | enum | ✅ | Tipo de unidad | `"SERENAZGO"` |
| `codigo` | string | ❌ | Código único (2-20 chars) | `"PNP-SURCO"` |
| `ubigeo` | string | ❌ | Código ubigeo (6 dígitos) | `"150140"` |
| `direccion` | string | ❌ | Dirección física (max 255) | `"Av. Benavides 495"` |
| `telefono` | string | ❌ | Teléfono (max 20) | `"01-4115858"` |
| `email` | string | ❌ | Email válido (max 100) | `"contacto@unidad.gob.pe"` |
| `latitud` | decimal | ❌ | Coordenada GPS (-90 a 90) | `-12.123456` |
| `longitud` | decimal | ❌ | Coordenada GPS (-180 a 180) | `-77.012345` |
| `radio_cobertura_km` | decimal | ❌ | Radio en km (0-999.99) | `5.5` |
| `activo_24h` | boolean | ❌ | Opera 24 horas (default: true) | `true` |
| `horario_inicio` | time | ❌ | Hora inicio (HH:MM:SS) | `"08:00:00"` |
| `horario_fin` | time | ❌ | Hora fin (HH:MM:SS) | `"20:00:00"` |

**Tipos de Unidad Válidos**:
- `SERENAZGO`
- `PNP`
- `BOMBEROS`
- `AMBULANCIA`
- `DEFENSA_CIVIL`
- `TRANSITO`
- `OTROS`

**Ejemplo Request**:
```json
POST /api/v1/unidades-oficina
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Compañía Sagitario - Serenazgo Surco",
  "tipo_unidad": "SERENAZGO",
  "codigo": "CIA-SAGITARIO",
  "ubigeo": "150140",
  "direccion": "Av. Benavides 495, Santiago de Surco",
  "telefono": "01-4115858",
  "email": "sagitario@munisurco.gob.pe",
  "latitud": -12.123456,
  "longitud": -77.012345,
  "radio_cobertura_km": 5.0,
  "activo_24h": true
}
```

**Ejemplo Response**:
```json
{
  "success": true,
  "message": "Unidad/oficina creada exitosamente",
  "data": {
    "id": 1,
    "codigo": "CIA-SAGITARIO",
    "nombre": "Compañía Sagitario - Serenazgo Surco",
    "tipo_unidad": "SERENAZGO",
    "telefono": "01-4115858",
    "email": "sagitario@munisurco.gob.pe",
    "direccion": "Av. Benavides 495, Santiago de Surco",
    "ubigeo": "150140",
    "latitud": "-12.1234560",
    "longitud": "-77.0123450",
    "radio_cobertura_km": "5.00",
    "activo_24h": true,
    "horario_inicio": null,
    "horario_fin": null,
    "estado": true,
    "created_by": 5,
    "created_at": "2025-01-05T10:00:00.000Z",
    "unidadOficinaUbigeo": {
      "ubigeo_code": "150140",
      "departamento": "Lima",
      "provincia": "Lima",
      "distrito": "Santiago de Surco"
    }
  }
}
```

---

### 4️⃣ **Actualizar Unidad**

#### `PUT /api/v1/unidades-oficina/:id`

**Descripción**: Actualiza los datos de una unidad existente.

**Autenticación**: ✅ Requerida

**Permisos**: `super_admin`, `admin`, `supervisor`

**Path Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID de la unidad a actualizar |

**Request Body**: Todos los campos son **opcionales** (puedes enviar solo los que quieres actualizar)

**Ejemplo Request**:
```json
PUT /api/v1/unidades-oficina/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "telefono": "01-4115859",
  "email": "nuevo@munisurco.gob.pe",
  "radio_cobertura_km": 7.5
}
```

**Ejemplo Response**:
```json
{
  "success": true,
  "message": "Unidad/oficina actualizada exitosamente",
  "data": {
    "id": 1,
    "codigo": "CIA-SAGITARIO",
    "nombre": "Compañía Sagitario - Serenazgo Surco",
    "telefono": "01-4115859",
    "email": "nuevo@munisurco.gob.pe",
    "radio_cobertura_km": "7.50",
    "updated_by": 5,
    "updated_at": "2025-01-05T11:30:00.000Z"
  }
}
```

---

### 5️⃣ **Eliminar Unidad**

#### `DELETE /api/v1/unidades-oficina/:id`

**Descripción**: Elimina una unidad (soft delete - no se borra físicamente).

**Autenticación**: ✅ Requerida

**Permisos**: `super_admin`, `admin`

**Path Parameters**:

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | integer | ID de la unidad a eliminar |

**Validaciones**:
- ❌ No se puede eliminar si tiene novedades asociadas

**Ejemplo Request**:
```bash
DELETE /api/v1/unidades-oficina/1
Authorization: Bearer {token}
```

**Ejemplo Response (éxito)**:
```json
{
  "success": true,
  "message": "Unidad/oficina eliminada exitosamente"
}
```

**Ejemplo Response (error - tiene novedades)**:
```json
{
  "success": false,
  "message": "No se puede eliminar. Tiene novedades asociadas a esta unidad"
}
```

---

## 📦 Estructura de Datos

### Objeto Unidad Completo

```typescript
interface UnidadOficina {
  // Identificación
  id: number;
  codigo: string | null;              // Código único (ej: "CIA-SAGITARIO")
  nombre: string;                      // Nombre de la unidad
  tipo_unidad: TipoUnidad;            // Tipo de unidad (ENUM)

  // Contacto
  telefono: string | null;
  email: string | null;

  // Ubicación
  direccion: string | null;
  ubigeo: string | null;              // Código ubigeo (6 dígitos)
  latitud: string | null;             // Decimal(10,8)
  longitud: string | null;            // Decimal(11,8)
  radio_cobertura_km: string | null;  // Decimal(5,2)

  // Horario
  activo_24h: boolean;                // true = opera 24h
  horario_inicio: string | null;      // Formato: "HH:MM:SS"
  horario_fin: string | null;         // Formato: "HH:MM:SS"

  // Estado
  estado: boolean;                    // true = activa

  // Auditoría
  created_at: string;                 // ISO DateTime
  updated_at: string;                 // ISO DateTime
  deleted_at: string | null;          // ISO DateTime
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;

  // Relaciones
  unidadOficinaUbigeo?: {
    ubigeo_code: string;
    departamento: string;
    provincia: string;
    distrito: string;
  };
}

type TipoUnidad =
  | "SERENAZGO"
  | "PNP"
  | "BOMBEROS"
  | "AMBULANCIA"
  | "DEFENSA_CIVIL"
  | "TRANSITO"
  | "OTROS";
```

---

## 💻 Ejemplos de Implementación

### React + TypeScript + Axios

#### 1. **Servicio API**

```typescript
// src/services/unidadesOficinaService.ts
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export interface UnidadOficina {
  id: number;
  codigo: string | null;
  nombre: string;
  tipo_unidad: TipoUnidad;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  ubigeo: string | null;
  latitud: string | null;
  longitud: string | null;
  radio_cobertura_km: string | null;
  activo_24h: boolean;
  horario_inicio: string | null;
  horario_fin: string | null;
  estado: boolean;
  created_at: string;
  updated_at: string;
  unidadOficinaUbigeo?: {
    ubigeo_code: string;
    departamento: string;
    provincia: string;
    distrito: string;
  };
}

export type TipoUnidad =
  | "SERENAZGO"
  | "PNP"
  | "BOMBEROS"
  | "AMBULANCIA"
  | "DEFENSA_CIVIL"
  | "TRANSITO"
  | "OTROS";

export interface UnidadOficinaCreate {
  nombre: string;
  tipo_unidad: TipoUnidad;
  codigo?: string;
  ubigeo?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  latitud?: number;
  longitud?: number;
  radio_cobertura_km?: number;
  activo_24h?: boolean;
  horario_inicio?: string;
  horario_fin?: string;
}

export interface UnidadOficinaFilters {
  tipo_unidad?: TipoUnidad;
  estado?: boolean;
  activo_24h?: boolean;
  ubigeo?: string;
  search?: string;
}

class UnidadesOficinaService {
  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getAll(filters?: UnidadOficinaFilters): Promise<UnidadOficina[]> {
    const params = new URLSearchParams();
    if (filters?.tipo_unidad) params.append('tipo_unidad', filters.tipo_unidad);
    if (filters?.estado !== undefined) params.append('estado', String(filters.estado));
    if (filters?.activo_24h !== undefined) params.append('activo_24h', String(filters.activo_24h));
    if (filters?.ubigeo) params.append('ubigeo', filters.ubigeo);
    if (filters?.search) params.append('search', filters.search);

    const response = await axios.get(
      `${API_URL}/unidades-oficina?${params.toString()}`,
      { headers: this.getHeaders() }
    );
    return response.data.data;
  }

  async getById(id: number): Promise<UnidadOficina> {
    const response = await axios.get(
      `${API_URL}/unidades-oficina/${id}`,
      { headers: this.getHeaders() }
    );
    return response.data.data;
  }

  async create(data: UnidadOficinaCreate): Promise<UnidadOficina> {
    const response = await axios.post(
      `${API_URL}/unidades-oficina`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data.data;
  }

  async update(id: number, data: Partial<UnidadOficinaCreate>): Promise<UnidadOficina> {
    const response = await axios.put(
      `${API_URL}/unidades-oficina/${id}`,
      data,
      { headers: this.getHeaders() }
    );
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await axios.delete(
      `${API_URL}/unidades-oficina/${id}`,
      { headers: this.getHeaders() }
    );
  }
}

export default new UnidadesOficinaService();
```

---

#### 2. **Hook Custom de React**

```typescript
// src/hooks/useUnidadesOficina.ts
import { useState, useEffect } from 'react';
import unidadesService, { UnidadOficina, UnidadOficinaFilters } from '@/services/unidadesOficinaService';

export function useUnidadesOficina(filters?: UnidadOficinaFilters) {
  const [unidades, setUnidades] = useState<UnidadOficina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUnidades();
  }, [filters]);

  const loadUnidades = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await unidadesService.getAll(filters);
      setUnidades(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar unidades');
      console.error('Error loading unidades:', err);
    } finally {
      setLoading(false);
    }
  };

  const createUnidad = async (data: any) => {
    try {
      const nuevaUnidad = await unidadesService.create(data);
      setUnidades(prev => [...prev, nuevaUnidad]);
      return { success: true, data: nuevaUnidad };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || 'Error al crear unidad'
      };
    }
  };

  const updateUnidad = async (id: number, data: any) => {
    try {
      const unidadActualizada = await unidadesService.update(id, data);
      setUnidades(prev =>
        prev.map(u => u.id === id ? unidadActualizada : u)
      );
      return { success: true, data: unidadActualizada };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || 'Error al actualizar unidad'
      };
    }
  };

  const deleteUnidad = async (id: number) => {
    try {
      await unidadesService.delete(id);
      setUnidades(prev => prev.filter(u => u.id !== id));
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || 'Error al eliminar unidad'
      };
    }
  };

  return {
    unidades,
    loading,
    error,
    reload: loadUnidades,
    createUnidad,
    updateUnidad,
    deleteUnidad
  };
}
```

---

#### 3. **Componente de Listado**

```typescript
// src/components/UnidadesOficinaTable.tsx
import React, { useState } from 'react';
import { useUnidadesOficina } from '@/hooks/useUnidadesOficina';
import { TipoUnidad } from '@/services/unidadesOficinaService';

const TIPOS_UNIDAD: TipoUnidad[] = [
  'SERENAZGO',
  'PNP',
  'BOMBEROS',
  'AMBULANCIA',
  'DEFENSA_CIVIL',
  'TRANSITO',
  'OTROS'
];

export default function UnidadesOficinaTable() {
  const [filters, setFilters] = useState({});
  const { unidades, loading, error, deleteUnidad } = useUnidadesOficina(filters);

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar la unidad "${nombre}"?`)) return;

    const result = await deleteUnidad(id);
    if (result.success) {
      alert('Unidad eliminada correctamente');
    } else {
      alert(result.error);
    }
  };

  if (loading) return <div>Cargando unidades...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <h2>Unidades/Oficinas</h2>

      {/* Filtros */}
      <div className="filters">
        <select
          onChange={(e) => setFilters({ ...filters, tipo_unidad: e.target.value || undefined })}
        >
          <option value="">Todos los tipos</option>
          {TIPOS_UNIDAD.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>

        <select
          onChange={(e) => setFilters({ ...filters, estado: e.target.value === 'true' ? true : undefined })}
        >
          <option value="">Todos los estados</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>

        <input
          type="text"
          placeholder="Buscar por nombre o código..."
          onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
        />
      </div>

      {/* Tabla */}
      <table>
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Teléfono</th>
            <th>Ubicación</th>
            <th>24h</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {unidades.map(unidad => (
            <tr key={unidad.id}>
              <td>{unidad.codigo || '-'}</td>
              <td>{unidad.nombre}</td>
              <td>
                <span className={`badge badge-${unidad.tipo_unidad.toLowerCase()}`}>
                  {unidad.tipo_unidad}
                </span>
              </td>
              <td>{unidad.telefono || '-'}</td>
              <td>
                {unidad.unidadOficinaUbigeo
                  ? `${unidad.unidadOficinaUbigeo.distrito}, ${unidad.unidadOficinaUbigeo.provincia}`
                  : '-'
                }
              </td>
              <td>{unidad.activo_24h ? '✅' : '❌'}</td>
              <td>
                <span className={`status ${unidad.estado ? 'active' : 'inactive'}`}>
                  {unidad.estado ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              <td>
                <button onClick={() => handleEdit(unidad.id)}>Editar</button>
                <button onClick={() => handleDelete(unidad.id, unidad.nombre)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {unidades.length === 0 && (
        <p className="no-data">No se encontraron unidades</p>
      )}
    </div>
  );
}
```

---

#### 4. **Formulario de Creación/Edición**

```typescript
// src/components/UnidadOficinaForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { UnidadOficinaCreate, TipoUnidad } from '@/services/unidadesOficinaService';

interface Props {
  onSubmit: (data: UnidadOficinaCreate) => Promise<any>;
  initialData?: Partial<UnidadOficinaCreate>;
  isEdit?: boolean;
}

const TIPOS_UNIDAD: TipoUnidad[] = [
  'SERENAZGO', 'PNP', 'BOMBEROS', 'AMBULANCIA',
  'DEFENSA_CIVIL', 'TRANSITO', 'OTROS'
];

export default function UnidadOficinaForm({ onSubmit, initialData, isEdit }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      activo_24h: true,
      ...initialData
    }
  });

  const activo24h = watch('activo_24h');

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h3>{isEdit ? 'Editar Unidad' : 'Nueva Unidad'}</h3>

      {/* Nombre */}
      <div className="form-group">
        <label htmlFor="nombre">Nombre *</label>
        <input
          id="nombre"
          {...register('nombre', {
            required: 'El nombre es requerido',
            minLength: { value: 3, message: 'Mínimo 3 caracteres' },
            maxLength: { value: 100, message: 'Máximo 100 caracteres' }
          })}
          placeholder="Ej: Comisaría PNP Surco"
        />
        {errors.nombre && <span className="error">{errors.nombre.message}</span>}
      </div>

      {/* Tipo de Unidad */}
      <div className="form-group">
        <label htmlFor="tipo_unidad">Tipo de Unidad *</label>
        <select
          id="tipo_unidad"
          {...register('tipo_unidad', { required: 'El tipo es requerido' })}
        >
          <option value="">Seleccione...</option>
          {TIPOS_UNIDAD.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
        {errors.tipo_unidad && <span className="error">{errors.tipo_unidad.message}</span>}
      </div>

      {/* Código */}
      <div className="form-group">
        <label htmlFor="codigo">Código (opcional)</label>
        <input
          id="codigo"
          {...register('codigo', {
            minLength: { value: 2, message: 'Mínimo 2 caracteres' },
            maxLength: { value: 20, message: 'Máximo 20 caracteres' },
            pattern: { value: /^[A-Z0-9_-]+$/, message: 'Solo mayúsculas, números, - y _' }
          })}
          placeholder="Ej: PNP-SURCO"
          style={{ textTransform: 'uppercase' }}
        />
        {errors.codigo && <span className="error">{errors.codigo.message}</span>}
      </div>

      {/* Ubicación */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="ubigeo">Código UBIGEO</label>
          <input
            id="ubigeo"
            {...register('ubigeo', {
              pattern: { value: /^\d{6}$/, message: 'Debe ser 6 dígitos' }
            })}
            placeholder="150140"
            maxLength={6}
          />
          {errors.ubigeo && <span className="error">{errors.ubigeo.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="telefono">Teléfono</label>
          <input
            id="telefono"
            {...register('telefono', {
              maxLength: { value: 20, message: 'Máximo 20 caracteres' }
            })}
            placeholder="01-4115858"
          />
          {errors.telefono && <span className="error">{errors.telefono.message}</span>}
        </div>
      </div>

      {/* Email */}
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          {...register('email', {
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email inválido' },
            maxLength: { value: 100, message: 'Máximo 100 caracteres' }
          })}
          placeholder="contacto@unidad.gob.pe"
        />
        {errors.email && <span className="error">{errors.email.message}</span>}
      </div>

      {/* Dirección */}
      <div className="form-group">
        <label htmlFor="direccion">Dirección</label>
        <input
          id="direccion"
          {...register('direccion', {
            maxLength: { value: 255, message: 'Máximo 255 caracteres' }
          })}
          placeholder="Av. Benavides 495, Santiago de Surco"
        />
        {errors.direccion && <span className="error">{errors.direccion.message}</span>}
      </div>

      {/* Coordenadas GPS */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="latitud">Latitud</label>
          <input
            type="number"
            step="0.00000001"
            id="latitud"
            {...register('latitud', {
              min: { value: -90, message: 'Mínimo -90' },
              max: { value: 90, message: 'Máximo 90' }
            })}
            placeholder="-12.123456"
          />
          {errors.latitud && <span className="error">{errors.latitud.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="longitud">Longitud</label>
          <input
            type="number"
            step="0.00000001"
            id="longitud"
            {...register('longitud', {
              min: { value: -180, message: 'Mínimo -180' },
              max: { value: 180, message: 'Máximo 180' }
            })}
            placeholder="-77.012345"
          />
          {errors.longitud && <span className="error">{errors.longitud.message}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="radio_cobertura_km">Radio Cobertura (km)</label>
          <input
            type="number"
            step="0.01"
            id="radio_cobertura_km"
            {...register('radio_cobertura_km', {
              min: { value: 0, message: 'Mínimo 0' },
              max: { value: 999.99, message: 'Máximo 999.99' }
            })}
            placeholder="5.0"
          />
          {errors.radio_cobertura_km && <span className="error">{errors.radio_cobertura_km.message}</span>}
        </div>
      </div>

      {/* Horario */}
      <div className="form-group">
        <label>
          <input type="checkbox" {...register('activo_24h')} />
          Opera 24 horas
        </label>
      </div>

      {!activo24h && (
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="horario_inicio">Hora Inicio</label>
            <input
              type="time"
              step="1"
              id="horario_inicio"
              {...register('horario_inicio', {
                required: !activo24h ? 'Requerido si no opera 24h' : false
              })}
            />
            {errors.horario_inicio && <span className="error">{errors.horario_inicio.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="horario_fin">Hora Fin</label>
            <input
              type="time"
              step="1"
              id="horario_fin"
              {...register('horario_fin', {
                required: !activo24h ? 'Requerido si no opera 24h' : false
              })}
            />
            {errors.horario_fin && <span className="error">{errors.horario_fin.message}</span>}
          </div>
        </div>
      )}

      <button type="submit" className="btn-primary">
        {isEdit ? 'Actualizar' : 'Crear'} Unidad
      </button>
    </form>
  );
}
```

---

## ✅ Validaciones

### Validaciones del Backend

El backend valida automáticamente:

1. **Nombre** (3-100 caracteres, requerido)
2. **Tipo de unidad** (debe ser uno de los ENUM válidos, requerido)
3. **Código** (2-20 caracteres, solo mayúsculas/números/-/_, único)
4. **Email** (formato válido, max 100 caracteres)
5. **Teléfono** (solo números/espacios/-/+/(), max 20 caracteres)
6. **UBIGEO** (6 dígitos, debe existir en tabla ubigeo)
7. **Latitud** (-90 a 90)
8. **Longitud** (-180 a 180)
9. **Radio cobertura** (0 a 999.99 km)
10. **Horarios** (formato HH:MM:SS, requeridos si `activo_24h=false`)

### Validaciones de Negocio

- ❌ No se puede crear con nombre duplicado
- ❌ No se puede crear con código duplicado
- ❌ Si `activo_24h=false`, debe tener `horario_inicio` y `horario_fin`
- ❌ `horario_inicio` debe ser menor que `horario_fin`
- ❌ No se puede eliminar si tiene novedades asociadas
- ✅ Si es `activo_24h=true`, los horarios se limpian automáticamente
- ✅ El código se normaliza a mayúsculas automáticamente

---

## 🔐 Permisos RBAC

### Matriz de Permisos

| Endpoint | Método | Acción | Roles Permitidos |
|----------|--------|--------|------------------|
| `/unidades-oficina` | GET | Listar | Todos autenticados |
| `/unidades-oficina/:id` | GET | Ver detalle | Todos autenticados |
| `/unidades-oficina` | POST | Crear | `super_admin`, `admin`, `supervisor` |
| `/unidades-oficina/:id` | PUT | Actualizar | `super_admin`, `admin`, `supervisor` |
| `/unidades-oficina/:id` | DELETE | Eliminar | `super_admin`, `admin` |

### Verificar Permisos en Frontend

```typescript
// src/utils/permissions.ts
export function canCreateUnidad(user: any): boolean {
  return ['super_admin', 'admin', 'supervisor'].includes(user.role);
}

export function canEditUnidad(user: any): boolean {
  return ['super_admin', 'admin', 'supervisor'].includes(user.role);
}

export function canDeleteUnidad(user: any): boolean {
  return ['super_admin', 'admin'].includes(user.role);
}
```

---

## 🎯 Casos de Uso

### Caso 1: Mostrar Mapa de Unidades Cercanas

```typescript
// Filtrar unidades con coordenadas GPS
const unidadesConGPS = unidades.filter(u =>
  u.latitud && u.longitud
);

// Renderizar en Google Maps / Leaflet
<Map center={[-12.1234, -77.0123]} zoom={13}>
  {unidadesConGPS.map(unidad => (
    <Marker
      key={unidad.id}
      position={[parseFloat(unidad.latitud!), parseFloat(unidad.longitud!)]}
      icon={getIconByTipo(unidad.tipo_unidad)}
      popup={`${unidad.nombre} - ${unidad.telefono}`}
    />
  ))}
</Map>
```

### Caso 2: Select de Unidades por Tipo

```typescript
// Componente Select para formularios
function UnidadSelect({ tipo }: { tipo: TipoUnidad }) {
  const { unidades } = useUnidadesOficina({ tipo_unidad: tipo, estado: true });

  return (
    <select>
      <option value="">Seleccione unidad...</option>
      {unidades.map(u => (
        <option key={u.id} value={u.id}>
          {u.nombre} {u.codigo ? `(${u.codigo})` : ''}
        </option>
      ))}
    </select>
  );
}
```

### Caso 3: Badge de Estado Operativo

```typescript
function EstadoOperativoBadge({ unidad }: { unidad: UnidadOficina }) {
  if (unidad.activo_24h) {
    return <span className="badge badge-success">24h ✅</span>;
  }

  const ahora = new Date();
  const horaActual = ahora.toTimeString().slice(0, 8);
  const estaOperativa =
    unidad.horario_inicio &&
    unidad.horario_fin &&
    horaActual >= unidad.horario_inicio &&
    horaActual <= unidad.horario_fin;

  return (
    <span className={`badge ${estaOperativa ? 'badge-success' : 'badge-danger'}`}>
      {estaOperativa ? 'Operativa ✅' : 'Fuera de horario ❌'}
      <small>({unidad.horario_inicio} - {unidad.horario_fin})</small>
    </span>
  );
}
```

---

## 📌 Notas Importantes

### ⚠️ Consideraciones

1. **Códigos únicos**: Si no proporcionas un código, el backend acepta `null`, pero si lo proporcionas debe ser único.

2. **Horarios**:
   - Si `activo_24h = true`, no envíes `horario_inicio` ni `horario_fin` (se limpian automáticamente)
   - Si `activo_24h = false`, DEBES enviar ambos horarios en formato `HH:MM:SS`

3. **Coordenadas GPS**:
   - Si proporcionas latitud, DEBES proporcionar longitud (y viceversa)
   - Formato: Decimal con hasta 8 dígitos de precisión

4. **Eliminación**:
   - Es soft delete (no se borra físicamente)
   - No se puede eliminar si tiene novedades asociadas
   - El registro permanece con `deleted_at` != null

5. **UBIGEO**:
   - Debe ser un código válido de la tabla `ubigeo`
   - Si es inválido, recibirás un error 404

---

## 🆘 Manejo de Errores

### Errores Comunes

```typescript
// Error 400 - Validación
{
  "success": false,
  "message": "Errores de validación",
  "errors": [
    {
      "field": "nombre",
      "value": "AB",
      "message": "El nombre debe tener entre 3 y 100 caracteres",
      "location": "body"
    }
  ]
}

// Error 400 - Duplicado
{
  "success": false,
  "message": "Ya existe una unidad con el nombre \"Comisaría PNP Surco\""
}

// Error 404 - No encontrado
{
  "success": false,
  "message": "Unidad/oficina no encontrada"
}

// Error 400 - No se puede eliminar
{
  "success": false,
  "message": "No se puede eliminar. Tiene novedades asociadas a esta unidad"
}

// Error 401 - No autenticado
{
  "success": false,
  "message": "Token inválido o expirado"
}

// Error 403 - Sin permisos
{
  "success": false,
  "message": "No tiene permisos suficientes"
}
```

---

## 📚 Recursos Adicionales

- **Schema de BD**: Ver archivo `CREATE TABLE unidades_oficina` proporcionado
- **Modelo Backend**: [src/models/UnidadOficina.js](src/models/UnidadOficina.js)
- **Controlador**: [src/controllers/unidadOficinaController.js](src/controllers/unidadOficinaController.js)
- **Validadores**: [src/validators/unidad-oficina.validator.js](src/validators/unidad-oficina.validator.js)
- **Rutas**: [src/routes/unidad-oficina.routes.js](src/routes/unidad-oficina.routes.js)

---

## ✅ Checklist de Implementación Frontend

- [ ] Instalar dependencias (axios, react-hook-form si usas React)
- [ ] Crear servicio API `unidadesOficinaService.ts`
- [ ] Crear tipos TypeScript `UnidadOficina`, `TipoUnidad`
- [ ] Implementar hook `useUnidadesOficina`
- [ ] Crear componente de listado con filtros
- [ ] Crear formulario de creación/edición
- [ ] Implementar validaciones del lado del cliente
- [ ] Agregar manejo de errores con mensajes claros
- [ ] Implementar permisos RBAC (mostrar/ocultar botones según rol)
- [ ] Agregar confirmación antes de eliminar
- [ ] (Opcional) Integrar mapa para coordenadas GPS
- [ ] (Opcional) Badge de estado operativo en tiempo real

---

**Versión del documento**: 1.0.0
**Fecha**: 2026-01-05
**Generado por**: Claude Code
