# 🚀 Implementación: Código Secuencial para Direcciones

## ✅ Decisión Final: Secuencial Puro `D-000001`

**Formato adoptado**: `D-[SECUENCIAL de 6 dígitos]`

**Ejemplos**:
- `D-000001` → Primera dirección
- `D-000123` → Dirección #123
- `D-123456` → Dirección #123,456
- `D-999999` → Dirección #999,999 (capacidad máxima)

**Capacidad**: Hasta 999,999 direcciones

---

## 🔧 Implementación Backend

### **1. Función para Generar Código**

```javascript
// services/direccionesService.js

/**
 * Genera el siguiente código de dirección secuencial
 * @returns {Promise<string>} Código en formato D-XXXXXX
 */
async function generateDireccionCode() {
  try {
    // Buscar la última dirección creada (incluyendo eliminadas para evitar duplicados)
    const ultimaDireccion = await Direccion.findOne({
      where: {
        direccion_code: {
          [Op.like]: 'D-%'
        }
      },
      order: [['direccion_code', 'DESC']],
      paranoid: false // Incluir soft-deleted
    });

    let nuevoSecuencial = 1;

    if (ultimaDireccion && ultimaDireccion.direccion_code) {
      // Extraer el número del código: "D-000123" → "000123" → 123
      const match = ultimaDireccion.direccion_code.match(/D-(\d+)$/);
      if (match) {
        nuevoSecuencial = parseInt(match[1], 10) + 1;
      }
    }

    // Validar que no exceda la capacidad
    if (nuevoSecuencial > 999999) {
      throw new Error('Se ha alcanzado el límite máximo de direcciones (999,999)');
    }

    // Formatear con padding de 6 dígitos
    const codigo = `D-${String(nuevoSecuencial).padStart(6, '0')}`;

    console.log(`📋 Código de dirección generado: ${codigo}`);
    return codigo;

  } catch (error) {
    console.error('❌ Error al generar código de dirección:', error);
    throw error;
  }
}

module.exports = {
  generateDireccionCode,
  // ... otras funciones
};
```

### **2. Uso en Creación de Dirección**

```javascript
// controllers/direccionesController.js

async function createDireccion(req, res) {
  try {
    const payload = req.body;

    // Generar código automáticamente
    const direccion_code = await generateDireccionCode();

    // Crear la dirección
    const nuevaDireccion = await Direccion.create({
      ...payload,
      direccion_code,
      created_by: req.user.id
    });

    res.status(201).json({
      success: true,
      data: nuevaDireccion,
      message: 'Dirección creada exitosamente'
    });

  } catch (error) {
    console.error('Error al crear dirección:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear dirección'
    });
  }
}
```

### **3. Validación de Unicidad**

```javascript
// models/Direccion.js

module.exports = (sequelize, DataTypes) => {
  const Direccion = sequelize.define('Direccion', {
    // ... otros campos
    direccion_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: {
        msg: 'El código de dirección ya existe'
      },
      validate: {
        is: {
          args: /^D-\d{6}$/,
          msg: 'El código debe tener el formato D-XXXXXX'
        }
      }
    },
    // ... resto de campos
  });

  return Direccion;
};
```

---

## 🎨 Implementación Frontend

### **1. Función Helper para Auto-completar Ceros**

```javascript
// src/utils/direccionCodeHelper.js

/**
 * Normaliza un código de dirección agregando ceros faltantes
 * Permite al usuario escribir "D-123" y lo convierte a "D-000123"
 *
 * @param {string} input - Código ingresado por el usuario
 * @returns {string} Código normalizado con padding
 *
 * @example
 * normalizeDireccionCode("D-123")    → "D-000123"
 * normalizeDireccionCode("D-1")      → "D-000001"
 * normalizeDireccionCode("D-000456") → "D-000456"
 * normalizeDireccionCode("123")      → "D-000123"
 * normalizeDireccionCode("d-123")    → "D-000123"
 */
export function normalizeDireccionCode(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Convertir a mayúsculas y limpiar espacios
  let codigo = input.trim().toUpperCase();

  // Si no empieza con "D-", agregarlo
  if (!codigo.startsWith('D-')) {
    // Si es solo números, agregar el prefijo
    if (/^\d+$/.test(codigo)) {
      codigo = `D-${codigo}`;
    } else if (codigo.startsWith('D')) {
      // Si empieza con D sin guión, agregarlo
      codigo = `D-${codigo.substring(1)}`;
    } else {
      // Formato inválido, retornar sin cambios
      return input;
    }
  }

  // Extraer la parte numérica
  const match = codigo.match(/^D-(\d+)$/);

  if (!match) {
    // Si no coincide con el patrón, retornar sin cambios
    return input;
  }

  const numero = match[1];

  // Validar que no exceda 6 dígitos
  if (numero.length > 6) {
    return input; // Retornar sin cambios si excede el límite
  }

  // Agregar padding de ceros a la izquierda (6 dígitos)
  const numeroPadded = numero.padStart(6, '0');

  return `D-${numeroPadded}`;
}

/**
 * Valida si un código de dirección tiene el formato correcto
 *
 * @param {string} codigo - Código a validar
 * @returns {boolean} true si es válido
 */
export function isValidDireccionCode(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return false;
  }

  // Debe ser exactamente D-XXXXXX (6 dígitos)
  return /^D-\d{6}$/.test(codigo.trim().toUpperCase());
}

/**
 * Extrae el número de un código de dirección
 *
 * @param {string} codigo - Código de dirección
 * @returns {number|null} Número extraído o null si es inválido
 */
export function extractDireccionNumber(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return null;
  }

  const match = codigo.trim().toUpperCase().match(/^D-(\d{6})$/);

  if (!match) {
    return null;
  }

  return parseInt(match[1], 10);
}
```

### **2. Modificar Filtro de Búsqueda en DireccionesPage**

```javascript
// src/pages/direcciones/DireccionesPage.jsx

import { normalizeDireccionCode } from '../../utils/direccionCodeHelper';

// ... dentro del componente

const [searchInput, setSearchInput] = useState(''); // Input del usuario
const [search, setSearch] = useState(''); // Búsqueda normalizada

// Handler para el input de búsqueda
const handleSearchChange = (e) => {
  const rawValue = e.target.value;
  setSearchInput(rawValue);

  // Si parece un código de dirección (empieza con D o es solo números cortos)
  if (rawValue.match(/^[Dd]-?\d+$/) || (rawValue.match(/^\d{1,6}$/) && rawValue.length <= 6)) {
    // Normalizar automáticamente
    const normalized = normalizeDireccionCode(rawValue);
    console.log(`🔍 Búsqueda normalizada: "${rawValue}" → "${normalized}"`);
    setSearch(normalized);
  } else {
    // Búsqueda normal por otros campos
    setSearch(rawValue);
  }
};

// Efecto para cargar direcciones cuando cambia la búsqueda normalizada
useEffect(() => {
  loadDirecciones();
}, [search, currentPage, /* otros filtros */]);

// En el JSX del input de búsqueda:
<input
  type="text"
  placeholder="Buscar por código (ej: D-123), dirección, número..."
  value={searchInput}
  onChange={handleSearchChange}
  className="..."
/>

// Mostrar el código normalizado debajo del input (opcional)
{searchInput && searchInput !== search && (
  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
    Buscando: <span className="font-mono text-primary-600">{search}</span>
  </p>
)}
```

### **3. Implementación Completa en DireccionesPage**

Ubicación del filtro en el código actual:
- El input de búsqueda está en la sección de filtros
- Usar `handleSearchChange` para normalizar en tiempo real
- Mostrar feedback visual del código normalizado

---

## 📊 Ejemplos de Uso

### **Búsqueda Inteligente**

| Usuario escribe | Sistema normaliza | Resultado |
|----------------|-------------------|-----------|
| `123` | `D-000123` | ✅ Encuentra dirección #123 |
| `D-123` | `D-000123` | ✅ Encuentra dirección #123 |
| `d-123` | `D-000123` | ✅ Encuentra dirección #123 |
| `D-000123` | `D-000123` | ✅ Encuentra dirección #123 |
| `1` | `D-000001` | ✅ Encuentra primera dirección |
| `999999` | `D-999999` | ✅ Encuentra última dirección |
| `D 123` | (sin cambios) | ❌ Formato inválido |
| `1234567` | (sin cambios) | ❌ Excede 6 dígitos |

### **Flujo de Usuario**

1. **Usuario abre el panel de Direcciones**
2. **Quiere buscar la dirección #123**
3. **Escribe en el filtro**: `D-123` (o solo `123`)
4. **Sistema muestra**: "Buscando: D-000123"
5. **Backend busca**: `WHERE direccion_code LIKE '%D-000123%'`
6. **Resultado**: Encuentra y muestra la dirección

---

## 🧪 Testing

### **Tests Unitarios Backend**

```javascript
// tests/direccion.code.test.js

describe('generateDireccionCode', () => {
  it('debe generar D-000001 para la primera dirección', async () => {
    const codigo = await generateDireccionCode();
    expect(codigo).toBe('D-000001');
  });

  it('debe incrementar correctamente el secuencial', async () => {
    await Direccion.create({ direccion_code: 'D-000005', /* otros campos */ });
    const codigo = await generateDireccionCode();
    expect(codigo).toBe('D-000006');
  });

  it('debe usar padding de 6 dígitos', async () => {
    await Direccion.create({ direccion_code: 'D-000099', /* otros campos */ });
    const codigo = await generateDireccionCode();
    expect(codigo).toBe('D-000100');
  });
});
```

### **Tests Unitarios Frontend**

```javascript
// tests/direccionCodeHelper.test.js

import { normalizeDireccionCode, isValidDireccionCode } from '@/utils/direccionCodeHelper';

describe('normalizeDireccionCode', () => {
  it('debe normalizar números sin prefijo', () => {
    expect(normalizeDireccionCode('123')).toBe('D-000123');
    expect(normalizeDireccionCode('1')).toBe('D-000001');
    expect(normalizeDireccionCode('999999')).toBe('D-999999');
  });

  it('debe normalizar códigos con prefijo incompleto', () => {
    expect(normalizeDireccionCode('D-123')).toBe('D-000123');
    expect(normalizeDireccionCode('d-123')).toBe('D-000123');
    expect(normalizeDireccionCode('D-1')).toBe('D-000001');
  });

  it('debe mantener códigos ya normalizados', () => {
    expect(normalizeDireccionCode('D-000123')).toBe('D-000123');
  });

  it('debe rechazar formatos inválidos', () => {
    expect(normalizeDireccionCode('D 123')).toBe('D 123'); // Sin cambios
    expect(normalizeDireccionCode('1234567')).toBe('1234567'); // Excede límite
  });
});

describe('isValidDireccionCode', () => {
  it('debe validar códigos correctos', () => {
    expect(isValidDireccionCode('D-000001')).toBe(true);
    expect(isValidDireccionCode('D-123456')).toBe(true);
  });

  it('debe rechazar códigos incorrectos', () => {
    expect(isValidDireccionCode('D-123')).toBe(false);
    expect(isValidDireccionCode('D-0001234')).toBe(false);
    expect(isValidDireccionCode('d-000001')).toBe(false); // Minúscula
  });
});
```

---

## 🔄 Migración de Datos Existentes

### **Script de Migración**

```javascript
// migrations/migrate-direccion-codes.js

const { Direccion } = require('../models');

async function migrateDireccionCodes() {
  console.log('🔄 Iniciando migración de códigos de direcciones...');

  try {
    // Obtener todas las direcciones ordenadas por fecha de creación
    const direcciones = await Direccion.findAll({
      order: [['created_at', 'ASC']],
      paranoid: false // Incluir eliminadas
    });

    console.log(`📊 Total de direcciones a migrar: ${direcciones.length}`);

    let contador = 0;

    // Crear backup de códigos antiguos en un campo legacy
    for (const direccion of direcciones) {
      contador++;

      const nuevoCodigo = `D-${String(contador).padStart(6, '0')}`;

      await direccion.update({
        direccion_code_legacy: direccion.direccion_code, // Guardar código anterior
        direccion_code: nuevoCodigo
      });

      if (contador % 100 === 0) {
        console.log(`   Procesadas: ${contador}/${direcciones.length}`);
      }
    }

    console.log(`✅ Migración completada: ${contador} códigos actualizados`);

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  }
}

// Ejecutar migración
migrateDireccionCodes()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
```

### **Rollback (si es necesario)**

```javascript
// migrations/rollback-direccion-codes.js

async function rollbackDireccionCodes() {
  console.log('⏪ Revertiendo códigos de direcciones...');

  const direcciones = await Direccion.findAll({
    where: {
      direccion_code_legacy: {
        [Op.ne]: null
      }
    },
    paranoid: false
  });

  for (const direccion of direcciones) {
    await direccion.update({
      direccion_code: direccion.direccion_code_legacy
    });
  }

  console.log(`✅ Rollback completado: ${direcciones.length} direcciones`);
}
```

---

## ✅ Checklist de Implementación

### Backend
- [ ] Crear función `generateDireccionCode()`
- [ ] Modificar controller para usar la nueva función
- [ ] Actualizar modelo con validación de formato
- [ ] Agregar campo `direccion_code_legacy` para backup
- [ ] Escribir tests unitarios
- [ ] Ejecutar migración de datos existentes

### Frontend
- [ ] Crear archivo `utils/direccionCodeHelper.js`
- [ ] Implementar función `normalizeDireccionCode()`
- [ ] Modificar filtro de búsqueda en DireccionesPage
- [ ] Agregar feedback visual de normalización
- [ ] Escribir tests unitarios
- [ ] Actualizar documentación de usuario

### Testing
- [ ] Probar generación de códigos consecutivos
- [ ] Probar búsqueda con diferentes formatos
- [ ] Verificar que el padding funciona correctamente
- [ ] Validar comportamiento con 999,999 direcciones
- [ ] Probar migración en ambiente de desarrollo

---

## 📝 Notas Adicionales

### **Ventajas del Sistema Implementado**
- ✅ Simple y fácil de entender
- ✅ Búsqueda flexible (con o sin ceros)
- ✅ Escalable hasta 999,999 registros
- ✅ Fácil de implementar y mantener
- ✅ Baja complejidad en el código

### **Consideraciones Futuras**
- Si se alcanza el límite de 999,999, considerar expandir a 7 u 8 dígitos
- Opción de permitir múltiples prefijos si se requiere categorización (D1-, D2-, etc.)
- Posible integración con códigos QR para escaneo móvil

---

## 🎯 Resultado Final

**Formato**: `D-000001` a `D-999999`

**Búsqueda inteligente**:
- Usuario escribe: `D-123` o `123`
- Sistema busca: `D-000123`
- Resultado: ✅ Dirección encontrada

**UX mejorada**: El usuario puede escribir códigos abreviados y el sistema los completa automáticamente.
