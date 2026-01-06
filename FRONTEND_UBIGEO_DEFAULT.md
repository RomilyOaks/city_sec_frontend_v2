# 📍 Guía: Uso de UBIGEO por Defecto

## 🎯 Solución Implementada

Se ha implementado un **sistema híbrido** para manejar el `ubigeo_code` por defecto:
1. **Frontend**: Muestra el valor default en formularios (Recomendado)
2. **Backend**: Tiene fallback si el frontend no lo envía (Seguridad)

---

## 🔌 Endpoint para Obtener Configuración

### **GET `/api/v1/config/ubigeo-default`**

Obtiene el ubigeo por defecto configurado en el backend.

**Acceso:** Público (sin autenticación)

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "150101",
    "departamento": "Arequipa",
    "provincia": "Arequipa",
    "distrito": "Arequipa",
    "departamento_code": "15",
    "provincia_code": "01",
    "distrito_code": "01"
  }
}
```

---

## 💻 Implementación en Frontend

### **Opción 1: Fetch al Cargar la Aplicación** ⭐ (Recomendado)

Obtén el ubigeo default una vez al iniciar la app y guárdalo en el estado global.

```typescript
// src/config/defaults.ts
import axios from 'axios';

export interface UbigeoDefault {
  code: string;
  departamento: string;
  provincia: string;
  distrito: string;
  departamento_code: string;
  provincia_code: string;
  distrito_code: string;
}

let cachedUbigeo: UbigeoDefault | null = null;

export async function getDefaultUbigeo(): Promise<UbigeoDefault> {
  if (cachedUbigeo) {
    return cachedUbigeo;
  }

  try {
    const response = await axios.get('/api/v1/config/ubigeo-default');
    cachedUbigeo = response.data.data;
    return cachedUbigeo;
  } catch (error) {
    console.error('Error al obtener ubigeo default:', error);
    // Fallback hardcoded
    return {
      code: '150101',
      departamento: 'Arequipa',
      provincia: 'Arequipa',
      distrito: 'Arequipa',
      departamento_code: '15',
      provincia_code: '01',
      distrito_code: '01'
    };
  }
}
```

### **Opción 2: Usar en Formularios con React Hook Form**

```typescript
// src/components/NovedadForm.tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getDefaultUbigeo } from '@/config/defaults';

interface NovedadFormData {
  descripcion: string;
  ubigeo_code: string;
  // ... otros campos
}

export function NovedadForm() {
  const { register, setValue, formState: { errors } } = useForm<NovedadFormData>();

  useEffect(() => {
    // Cargar ubigeo default al montar el componente
    getDefaultUbigeo().then(ubigeo => {
      setValue('ubigeo_code', ubigeo.code);
    });
  }, [setValue]);

  return (
    <form>
      <input
        {...register('ubigeo_code', { required: true })}
        placeholder="Código UBIGEO"
      />
      {/* Otros campos */}
    </form>
  );
}
```

### **Opción 3: Context Provider (Para Apps Grandes)**

```typescript
// src/contexts/ConfigContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDefaultUbigeo, UbigeoDefault } from '@/config/defaults';

interface ConfigContextType {
  ubigeoDefault: UbigeoDefault | null;
  loading: boolean;
}

const ConfigContext = createContext<ConfigContextType>({
  ubigeoDefault: null,
  loading: true
});

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [ubigeoDefault, setUbigeoDefault] = useState<UbigeoDefault | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDefaultUbigeo()
      .then(setUbigeoDefault)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ConfigContext.Provider value={{ ubigeoDefault, loading }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
```

**Uso en componentes:**
```typescript
function NovedadForm() {
  const { ubigeoDefault, loading } = useConfig();
  const { register, setValue } = useForm();

  useEffect(() => {
    if (ubigeoDefault) {
      setValue('ubigeo_code', ubigeoDefault.code);
    }
  }, [ubigeoDefault, setValue]);

  if (loading) return <Spinner />;

  return <form>{/* ... */}</form>;
}
```

---

## 🛡️ Comportamiento del Backend

El backend tiene **fallback automático** para todos los campos `ubigeo_code`:

### **Al Crear Novedad**
```javascript
// Si el frontend NO envía ubigeo_code, el backend usa DEFAULT_UBIGEO_CODE
const novedad = {
  ...data,
  ubigeo_code: data.ubigeo_code || '150101' // ✅ Fallback automático
};
```

### **Endpoints Afectados**
- ✅ `POST /api/v1/novedades` - Crear novedad
- ✅ (Otros endpoints que usen ubigeo_code en el futuro)

---

## 🎨 Ejemplo UI/UX Recomendado

### **Select con Valor Default Pre-seleccionado**

```typescript
<Select
  label="Ubicación (UBIGEO)"
  value={ubigeoCode}
  onChange={(e) => setUbigeoCode(e.target.value)}
  defaultValue={ubigeoDefault?.code} // ✅ Pre-selecciona el default
>
  <option value="150101">Arequipa - Arequipa - Arequipa</option>
  <option value="150102">Arequipa - Arequipa - Alto Selva Alegre</option>
  <option value="150103">Arequipa - Arequipa - Cayma</option>
  {/* ... más opciones */}
</Select>
```

### **Input con Placeholder y Valor Default**

```typescript
<Input
  label="Código UBIGEO"
  placeholder={ubigeoDefault?.code} // Muestra el default como hint
  value={ubigeoCode}
  onChange={(e) => setUbigeoCode(e.target.value)}
  helperText={`Por defecto: ${ubigeoDefault?.distrito}, ${ubigeoDefault?.provincia}`}
/>
```

---

## 🔄 Cambiar el UBIGEO Default

### **Desde Backend** (Variable de Entorno)

```bash
# .env
DEFAULT_UBIGEO_CODE=150102  # Cambiar a Alto Selva Alegre
```

Luego reiniciar el servidor.

### **Consultar Códigos UBIGEO**

Puedes obtener los códigos desde:
- **INEI:** https://www.inei.gob.pe/
- **Endpoint del Backend:** `GET /api/v1/ubigeo` (si está implementado)

---

## ✅ Resumen

| Aspecto | Implementación |
|---------|----------------|
| **Endpoint Backend** | `GET /api/v1/config/ubigeo-default` |
| **Acceso** | Público (sin auth) |
| **Frontend Principal** | Cargar al iniciar app y pre-llenar formularios |
| **Backend Fallback** | Si frontend no envía, usa default automáticamente |
| **Configuración** | Variable de entorno `DEFAULT_UBIGEO_CODE` |
| **Default Actual** | `150101` (Arequipa - Arequipa - Arequipa) |

---

## 🎯 Recomendación Final

**Usa el enfoque híbrido:**
1. Frontend obtiene el default del endpoint `/config/ubigeo-default`
2. Frontend pre-llena el campo en formularios
3. Usuario puede cambiarlo si necesita
4. Backend tiene fallback por si el frontend falla

Esto da la **mejor UX** (usuario ve el valor) con **seguridad** (backend garantiza un valor válido).
