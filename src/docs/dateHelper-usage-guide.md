/**
 * ============================================
 * GUÍA DE USO - DATEHELPER (Frontend)
 * ============================================
 * 
 * Archivo: src/docs/dateHelper-usage-guide.md
 * 
 * FECHA: 2026-03-08
 * VERSIÓN: 1.0.0
 * 
 * PROPÓSITO: Establecer reglas estándar para manejo de fechas
 *           y evitar inconsistencias timezone.
 */

# 📅 Guía de Uso - DateHelper

## 🎯 REGLA DE ORO

> **"NUNCA usar `new Date()`, `toISOString()`, o `toLocaleString()` directamente. SIEMPRE usar el dateHelper."**

---

## 🚫 **QUÉ NO HACER (Prohibido)**

```javascript
// ❌ NUNCA hacer esto
const fecha = new Date().toISOString();           // Convierte a UTC
const timestamp = new Date().toLocaleString();     // Inconsistente
const fechaLlegada = new Date(input).toISOString().slice(0, 19); // UTC
const display = new Date(fecha).toLocaleString();  // Mal formato
```

## ✅ **QUÉ HACER (Correcto)**

```javascript
// ✅ SIEMPRE usar el dateHelper
import { 
  getNowLocal,           // Fecha/hora actual
  convertToTimezone,     // Convertir manteniendo timezone
  safeConvertToTimezone, // Conversión segura (nunca "Invalid Date")
  formatForDisplay,      // Mostrar en UI
  formatForInput         // Para inputs datetime-local
} from '../utils/dateHelper.js';

// Fecha/hora actual
const ahora = getNowLocal();                    // "2026-03-08 11:52:00"

// Convertir de input a BD (seguro)
const fechaLlegada = safeConvertToTimezone(inputDatetime); // "2026-03-08 11:52:00"

// Mostrar en UI
const display = formatForDisplay(fecha);         // "8/3/2026, 11:52 a. m."

// Para input datetime-local
const inputValue = formatForInput(fechaBD);       // "2026-03-08T11:52"
```

---

## 📋 **CASOS DE USO ESTÁNDAR**

### 🔄 **1. Guardar fecha en base de datos**

```javascript
// ✅ CORRECTO
const payload = {
  fecha_llegada: safeConvertToTimezone(editData.fecha_llegada), // Nunca "Invalid Date"
  reportado: getNowLocal(),                                      // Fecha actual
  updated_at: getNowLocal()                                     // Timestamp
};

// ❌ INCORRECTO
const payload = {
  fecha_llegada: new Date(editData.fecha_llegada).toISOString(), // UTC + error
  reportado: new Date().toISOString(),                           // UTC
  updated_at: new Date()                                        // Objeto Date
};
```

### 🎨 **2. Mostrar fecha en UI**

```javascript
// ✅ CORRECTO
<span>{formatForDisplay(novedad.reportado)}</span>
<span>{formatForDisplay(novedad.fecha_llegada)}</span>

// ❌ INCORRECTO
<span>{new Date(novedad.reportado).toLocaleString()}</span>
<span>{new Date(novedad.fecha_llegada).toLocaleString()}</span>
```

### 📝 **3. Input datetime-local**

```javascript
// ✅ CORRECTO
<input
  type="datetime-local"
  value={formatForInput(novedad.fecha_llegada)}
  onChange={(e) => setData({ ...data, fecha_llegada: e.target.value })}
/>

// ❌ INCORRECTO
<input
  type="datetime-local"
  value={novedad.fecha_llegada?.replace(' ', 'T') || ''}
  // Formato inconsistente
/>
```

### ⏰ **4. Timestamps y logs**

```javascript
// ✅ CORRECTO
const timestamp = formatForDisplay(new Date());
const log = `[${timestamp} - Usuario] Acción realizada`;

// ❌ INCORRECTO
const timestamp = new Date().toLocaleString();
const log = `[${timestamp} - Usuario] Acción realizada`;
```

---

## 🛡️ **FUNCIONES DE SEGURIDAD**

### **`safeConvertToTimezone()` - Siempre usar para datos de usuario**

```javascript
// ✅ Siempre para inputs de usuario
const fechaLlegada = safeConvertToTimezone(editData.fecha_llegada);

// Por qué:
// - Nunca retorna "Invalid Date"
// - Fallback automático a fecha actual
// - Maneja errores silenciosamente
// - Previene error 500 en BD
```

### **`getNowLocal()` - Fecha/hora actual**

```javascript
// ✅ Para timestamps y "ahora"
const reportado = getNowLocal();
const created_at = getNowLocal();
const timestamp = formatForDisplay(new Date()); // Para display
```

---

## 📂 **DÓNDE DEJAR LA REGLA**

### **1. En este documento (oficial)**
```
src/docs/dateHelper-usage-guide.md
```

### **2. En .eslintrc.js (regla automatizada)**
```javascript
module.exports = {
  rules: {
    // Personalizado para detectar uso directo de fechas
    'no-direct-date-usage': 'error',
    'date-helper-required': 'error'
  }
};
```

### **3. En PR template (GitHub)**
```markdown
## 📅 Fechas
- [ ] Se usa dateHelper para todo manejo de fechas
- [ ] No hay `new Date()`, `toISOString()`, `toLocaleString()` directos
- [ ] Se usa `safeConvertToTimezone()` para inputs de usuario
```

### **4. En code review checklist**
```markdown
### Fechas
- ¿Se importó el dateHelper?
- ¿Se usan funciones del helper en lugar de Date directo?
- ¿Se usa `safeConvertToTimezone()` para datos de usuario?
- ¿Se usa `formatForDisplay()` para UI?
```

---

## 🔍 **DEBUGGING Y VALIDACIÓN**

### **Para debugging:**
```javascript
import { getTimezoneDebugInfo } from '../utils/dateHelper.js';

console.log('Debug fecha:', getTimezoneDebugInfo());
```

### **Para validación:**
```javascript
// Validar antes de enviar
if (payload.fecha_llegada === "Invalid Date") {
  console.error('¡Fecha inválida detectada!');
  return;
}
```

---

## 📚 **REFERENCIA RÁPIDA**

| Operación | Función | Ejemplo | Resultado |
|-----------|---------|---------|-----------|
| Fecha actual | `getNowLocal()` | `getNowLocal()` | `"2026-03-08 11:52:00"` |
| Convertir seguro | `safeConvertToTimezone()` | `safeConvertToTimezone(input)` | `"2026-03-08 11:52:00"` |
| Mostrar en UI | `formatForDisplay()` | `formatForDisplay(fecha)` | `"8/3/2026, 11:52 a. m."` |
| Para input | `formatForInput()` | `formatForInput(fechaBD)` | `"2026-03-08T11:52"` |
| Diferencia | `getMinutesDifference()` | `getMinutesDifference(a, b)` | `45` |

---

## 🚨 **RECORDATORIO**

> **Cada vez que escribas `new Date()` o `.toISOString()`, PISA EL FRENO.**
> 
> **Ve al dateHelper primero.**

---

## 📞 **SOPORTE**

Si tienes dudas:
1. Revisa este documento
2. Revisa `src/utils/dateHelper.js`
3. Pide ayuda en el canal #frontend

**¡Manejo de fechas sin estrés!** 🎉
