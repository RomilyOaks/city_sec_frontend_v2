# 📋 Propuesta: Nuevo Sistema de Códigos para Direcciones

## 🔍 Situación Actual

**Código actual**: `DIR-20260106031959-044`

**Formato**: `DIR-YYYYMMDDHHMMSS-XXX`
- `DIR`: Prefijo fijo
- `YYYYMMDDHHMMSS`: Timestamp completo (año, mes, día, hora, minuto, segundo)
- `XXX`: Secuencial de 3 dígitos

**Problema**:
- ❌ Difícil de leer y recordar
- ❌ No proporciona información útil sobre la dirección
- ❌ El timestamp es demasiado largo y técnico
- ❌ No ayuda a identificar rápidamente el tipo o ubicación de la dirección

---

## ✨ Propuestas de Mejora

### **Opción 1: Código por Tipo de Vía + Secuencial** ⭐ (RECOMENDADO)

**Formato**: `[TIPO_VIA][SECUENCIAL]`

**Ejemplos**:
- `AV-00001` → Primera avenida registrada
- `AV-00002` → Segunda avenida registrada
- `JR-00001` → Primer jirón registrado
- `CL-00001` → Primera calle registrada
- `PS-00001` → Primer pasaje registrado
- `PJ-00001` → Primer paseo registrado

**Ventajas**:
- ✅ **Muy intuitivo**: Se entiende inmediatamente que es una dirección de tipo avenida, jirón, etc.
- ✅ **Fácil de recordar**: Solo 2 letras + número
- ✅ **Útil para búsquedas**: Puedes filtrar rápidamente todas las avenidas (AV-*)
- ✅ **Escalable**: Soporta hasta 99,999 direcciones por tipo de vía

**Lógica de implementación**:
```javascript
// Backend - Al crear una nueva dirección:
1. Obtener el tipo_via de la calle asociada (ej: "Avenida")
2. Obtener la abreviatura del tipo_via (ej: "AV")
3. Buscar el último código con ese prefijo (ej: "AV-00050")
4. Incrementar el secuencial: "AV-00051"
5. Si no existe ningún código con ese prefijo, usar "AV-00001"
```

---

### **Opción 2: Código por Tipo de Vía + Primeras Letras + Secuencial**

**Formato**: `[TIPO_VIA][INICIALES][SECUENCIAL]`

**Ejemplos**:
- `AVLP-0001` → Av. Los Proceres #1
- `AVLP-0002` → Av. Los Proceres #2 (otro número en la misma calle)
- `AVSA-0001` → Av. Santa Anita #1
- `JRHU-0001` → Jr. Huancayo #1
- `CLBO-0001` → Calle Bolívar #1

**Ventajas**:
- ✅ **Muy descriptivo**: Se identifica tanto el tipo como la calle específica
- ✅ **Único por calle**: Cada calle tiene su propio rango de códigos
- ✅ **Fácil de agrupar**: Todas las direcciones de "Av. Los Proceres" empiezan con AVLP

**Desventajas**:
- ⚠️ **Más largo**: Puede llegar a 10-11 caracteres
- ⚠️ **Complejidad**: Requiere lógica para extraer iniciales y evitar duplicados
- ⚠️ **Ambigüedad**: "Av. Los Angeles" y "Av. La Aurora" → ambos AVLA

**Lógica de implementación**:
```javascript
// Backend - Al crear una nueva dirección:
1. Obtener el tipo_via y nombre_via de la calle
2. Extraer las primeras 2 letras del nombre (ej: "Los Proceres" → "LP")
3. Formar prefijo: "AVLP"
4. Buscar el último código con ese prefijo
5. Incrementar: "AVLP-0051"
```

---

### **Opción 3: Código por Sector + Secuencial**

**Formato**: `[SECTOR_CODE]-[SECUENCIAL]`

**Ejemplos**:
- `SEC-AQP01-0001` → Primera dirección del sector AQP01
- `SEC-AQP01-0002` → Segunda dirección del sector AQP01
- `SEC-AQP02-0001` → Primera dirección del sector AQP02

**Ventajas**:
- ✅ **Agrupa por zona geográfica**: Útil para operaciones por sector
- ✅ **Coherente con sectores**: Usa la misma nomenclatura de sectores

**Desventajas**:
- ⚠️ **No todas las direcciones tienen sector**: Requiere manejo de casos sin sector
- ⚠️ **Largo**: Puede llegar a 15+ caracteres

---

### **Opción 4: Secuencial Puro con Prefijo Corto**

**Formato**: `D-[SECUENCIAL]`

**Ejemplos**:
- `D-000001` → Primera dirección
- `D-000002` → Segunda dirección
- `D-123456` → Dirección #123,456

**Ventajas**:
- ✅ **Muy simple**: Mínima complejidad de implementación
- ✅ **Corto**: Solo 8 caracteres
- ✅ **Sin ambigüedades**: No depende de otras entidades

**Desventajas**:
- ⚠️ **No descriptivo**: No proporciona información útil
- ⚠️ **Solo mejora longitud**: Poco beneficio vs. sistema actual

---

## 🎯 Recomendación Final

### **Implementar Opción 1: Código por Tipo de Vía + Secuencial**

**Razones**:
1. ✅ **Balance perfecto** entre simplicidad y utilidad
2. ✅ **Fácil de implementar** en backend
3. ✅ **Muy intuitivo** para usuarios finales
4. ✅ **Escalable** y sin ambigüedades
5. ✅ **Útil para búsquedas y filtros**

**Formato final**: `AV-00001`, `JR-00123`, `CL-00456`

---

## 🔧 Plan de Implementación

### **Backend (Node.js/Sequelize)**

```javascript
// services/direccionesService.js

async function generateDireccionCode(calleId) {
  // 1. Obtener información de la calle
  const calle = await Calle.findByPk(calleId, {
    include: [{ model: TipoVia, as: 'tipo_via' }]
  });

  if (!calle || !calle.tipo_via) {
    throw new Error('No se pudo determinar el tipo de vía');
  }

  // 2. Obtener abreviatura del tipo de vía (ej: "AV", "JR", "CL")
  const prefijo = calle.tipo_via.abreviatura || 'DIR';

  // 3. Buscar el último código con ese prefijo
  const ultimaDireccion = await Direccion.findOne({
    where: {
      direccion_code: {
        [Op.like]: `${prefijo}-%`
      }
    },
    order: [['direccion_code', 'DESC']],
    paranoid: false // Incluir eliminados para evitar duplicados
  });

  // 4. Incrementar el secuencial
  let nuevoSecuencial = 1;

  if (ultimaDireccion) {
    // Extraer el número del código: "AV-00123" → "00123" → 123
    const match = ultimaDireccion.direccion_code.match(/-(\d+)$/);
    if (match) {
      nuevoSecuencial = parseInt(match[1]) + 1;
    }
  }

  // 5. Formatear con padding de 5 dígitos
  const codigo = `${prefijo}-${String(nuevoSecuencial).padStart(5, '0')}`;

  return codigo;
}

// Uso en createDireccion:
const direccion_code = await generateDireccionCode(payload.calle_id);
```

### **Tipos de Vía Soportados**

| Tipo de Vía | Abreviatura | Ejemplo Código |
|-------------|-------------|----------------|
| Avenida | AV | AV-00001 |
| Jirón | JR | JR-00001 |
| Calle | CL | CL-00001 |
| Pasaje | PS | PS-00001 |
| Paseo | PJ | PJ-00001 |
| Alameda | AL | AL-00001 |
| Malecón | ML | ML-00001 |
| Prolongación | PR | PR-00001 |
| Carretera | CA | CA-00001 |
| **Sin tipo** | DIR | DIR-00001 |

---

## 📊 Comparación de Opciones

| Aspecto | Sistema Actual | Opción 1 | Opción 2 | Opción 3 | Opción 4 |
|---------|---------------|----------|----------|----------|----------|
| **Longitud** | 23 chars | 8 chars | 11 chars | 15 chars | 8 chars |
| **Legibilidad** | ❌ Baja | ✅ Alta | ✅ Alta | ⚠️ Media | ⚠️ Media |
| **Descriptivo** | ❌ No | ✅ Sí | ✅ Muy | ⚠️ Sí | ❌ No |
| **Complejidad** | ⚠️ Media | ✅ Baja | ⚠️ Media | ⚠️ Media | ✅ Baja |
| **Escalabilidad** | ✅ Alta | ✅ Alta | ✅ Alta | ✅ Alta | ✅ Alta |
| **Unicidad** | ✅ Garantizada | ✅ Garantizada | ⚠️ Requiere validación | ✅ Garantizada | ✅ Garantizada |

---

## 🚀 Migración de Datos Existentes

### **Estrategia Recomendada**

1. **No modificar códigos existentes**: Mantener `DIR-YYYYMMDDHHMMSS-XXX` para direcciones ya creadas
2. **Aplicar nuevo formato solo a nuevas direcciones**: A partir de la fecha de implementación
3. **Migración gradual (opcional)**: Script para regenerar códigos de direcciones antiguas si se desea uniformidad

### **Script de Migración (Opcional)**

```javascript
// migrations/regenerate-direccion-codes.js

async function migrarCodigosDirecciones() {
  const direcciones = await Direccion.findAll({
    include: [{
      model: Calle,
      include: [{ model: TipoVia, as: 'tipo_via' }]
    }],
    order: [['created_at', 'ASC']]
  });

  for (const direccion of direcciones) {
    const nuevoCodigo = await generateDireccionCode(direccion.calle_id);

    // Guardar el código antiguo en un campo de auditoría
    await direccion.update({
      direccion_code: nuevoCodigo,
      direccion_code_legacy: direccion.direccion_code
    });
  }

  console.log(`✅ Migrados ${direcciones.length} códigos de direcciones`);
}
```

---

## ✅ Conclusión

**Recomendación**: Implementar **Opción 1** (`AV-00001`, `JR-00123`, etc.)

**Beneficios principales**:
- 🎯 **Intuitivo y fácil de recordar**
- 🚀 **Simple de implementar**
- 📊 **Útil para análisis y filtros**
- 🔍 **Mejora la experiencia del usuario**

**Próximos pasos**:
1. Aprobar la propuesta
2. Implementar función `generateDireccionCode()` en backend
3. Modificar endpoint `POST /direcciones` para usar nueva lógica
4. Actualizar tests
5. Desplegar en producción
6. (Opcional) Ejecutar script de migración para datos existentes
