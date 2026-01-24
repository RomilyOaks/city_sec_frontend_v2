# Manejo de Errores Reutilizable

Este documento explica cómo usar el sistema de manejo de errores implementado para mejorar la visualización de errores de validación del backend.

## 📁 Archivos

- `src/utils/errorUtils.js` - Utilidades core para manejo de errores
- `src/components/common/ValidationErrorDisplay.jsx` - Componente para mostrar errores
- `src/hooks/useErrorHandler.js` - Hooks personalizados para manejo de errores

## 🚀 Uso Básico

### 1. Importar las utilidades

```javascript
import { extractValidationErrors, showValidationError } from '../../utils/errorUtils';
import ValidationErrorDisplay from '../../components/common/ValidationErrorDisplay';
```

### 2. En componentes React

```javascript
import React, { useState } from 'react';
import { extractValidationErrors } from '../utils/errorUtils';
import ValidationErrorDisplay from '../components/common/ValidationErrorDisplay';

const MiComponente = () => {
  const [error, setError] = useState(null);

  const handleSubmit = async (data) => {
    try {
      await apiCall(data);
      // Éxito
    } catch (err) {
      setError(err);
      // Opcional: mostrar toast
      showValidationError(err, toast, 'Error al guardar');
    }
  };

  return (
    <div>
      {error && (
        <ValidationErrorDisplay
          error={error}
          onClose={() => setError(null)}
          variant="detailed"
        />
      )}
      
      {/* Resto del formulario */}
    </div>
  );
};
```

### 3. Usando el Hook personalizado

```javascript
import { useErrorHandler } from '../hooks/useErrorHandler';

const MiComponente = () => {
  const { error, loading, handleError, clearError, executeWithErrorHandling } = useErrorHandler();

  const handleSubmit = async (data) => {
    const result = await executeWithErrorHandling(
      () => apiCall(data),
      'Error al guardar los datos'
    );

    if (result.success) {
      console.log('Datos guardados:', result.data);
    }
  };

  return (
    <div>
      {error && (
        <ValidationErrorDisplay
          error={error}
          onClose={clearError}
        />
      )}
      
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  );
};
```

### 4. Para operaciones CRUD

```javascript
import { useCrudOperation } from '../hooks/useErrorHandler';

const UserForm = () => {
  const { execute, loading } = useCrudOperation(
    createUser,
    'Usuario creado exitosamente',
    'Error al crear usuario'
  );

  const handleSubmit = (userData) => {
    execute(userData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Usuario'}
      </button>
    </form>
  );
};
```

## 🎨 Variantes del Componente

El componente `ValidationErrorDisplay` tiene 3 variantes:

### Default (completa)
```javascript
<ValidationErrorDisplay
  error={error}
  onClose={() => setError(null)}
/>
```

### Compact (pequeña)
```javascript
<ValidationErrorDisplay
  error={error}
  variant="compact"
  showIcon={true}
/>
```

### Detailed (detallada con campos)
```javascript
<ValidationErrorDisplay
  error={error}
  variant="detailed"
  onClose={() => setError(null)}
/>
```

## 🔧 Funciones Disponibles

### `extractValidationErrors(error)`
Extrae mensajes de error específicos del backend.

```javascript
const errorMessage = extractValidationErrors(error);
// Retorna: "email: El email es inválido. nombre: El nombre es requerido"
```

### `showValidationError(error, toast, defaultMessage)`
Muestra errores en toast automáticamente.

```javascript
showValidationError(error, toast, 'Error al guardar');
// Muestra toast específicos para cada campo de validación
```

### `formatErrorForDisplay(error)`
Formatea error para mostrar en componentes.

```javascript
const errorInfo = formatErrorForDisplay(error);
// Retorna: { title, message, details: [{field, message}, ...] }
```

## 📝 Estructura de Errores Esperada

El backend debe retornar errores en este formato:

```javascript
{
  "errors": [
    {
      "path": "email",
      "msg": "El email es inválido"
    },
    {
      "path": "nombre", 
      "msg": "El nombre es requerido"
    }
  ]
}
```

O formatos alternativos:
```javascript
{
  "message": "Error de validación",
  "errors": ["Campo A inválido", "Campo B requerido"]
}
```

## 🔄 Migración de Código Existente

### Antes:
```javascript
} catch (error) {
  toast.error(error.response?.data?.message || "Error de validación");
}
```

### Después:
```javascript
} catch (error) {
  setValidationError(error);
  showValidationError(error, toast, "Error de validación");
}
```

## 🎯 Mejores Prácticas

1. **Siempre usar el hook** `useErrorHandler` para manejo consistente
2. **Mostrar errores específicos** del campo cuando sea posible
3. **Limpiar errores** cuando el usuario corrige el formulario
4. **Usar variantes apropiadas** según el contexto
5. **Mantener consistencia** en mensajes de error

## 📋 Ejemplo Completo

```javascript
import React, { useState } from 'react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import ValidationErrorDisplay from '../components/common/ValidationErrorDisplay';

const UserRegistrationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const { error, loading, executeWithErrorHandling, clearError } = useErrorHandler();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await executeWithErrorHandling(
      () => registerUser(formData),
      'Error al registrar usuario'
    );

    if (result.success) {
      // Redirigir o mostrar éxito
      console.log('Usuario registrado:', result.data);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Limpiar error cuando usuario empieza a corregir
    if (error) {
      clearError();
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2>Registro de Usuario</h2>
      
      {error && (
        <ValidationErrorDisplay
          error={error}
          onClose={clearError}
          variant="detailed"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>Nombre</label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label>Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label>Contraseña</label>
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
};
```

Este sistema proporciona una experiencia de usuario mucho mejor al mostrar errores específicos y accionables en lugar de mensajes genéricos.
