## 📅 Manejo de Fechas (DateHelper)

### ✅ Checklist Obligatorio
- [ ] **Se importó el dateHelper**: `import { ... } from '../utils/dateHelper.js'`
- [ ] **No hay `new Date()` directos** (usar `getNowLocal()`)
- [ ] **No hay `toISOString()` directos** (usar `safeConvertToTimezone()`)
- [ ] **No hay `toLocaleString()` directos** (usar `formatForDisplay()`)
- [ ] **Se usa `safeConvertToTimezone()` para inputs de usuario**
- [ ] **Se usa `formatForDisplay()` para mostrar fechas en UI**
- [ ] **Se usa `formatForInput()` para inputs datetime-local**

### 📋 Referencia Rápida
| Necesitas | Función | Ejemplo |
|-----------|---------|---------|
| Fecha actual | `getNowLocal()` | `getNowLocal()` |
| Convertir input | `safeConvertToTimezone()` | `safeConvertToTimezone(input)` |
| Mostrar en UI | `formatForDisplay()` | `formatForDisplay(fecha)` |
| Input datetime-local | `formatForInput()` | `formatForInput(fechaBD)` |

### 🚨 Si encuentras `new Date()`, `toISOString()` o `toLocaleString()`
1. **Detente** - No mergear
2. **Reemplaza** con función del dateHelper
3. **Consulta** `src/docs/dateHelper-usage-guide.md`

### 📞 Ayuda
- 📖 Guía completa: `src/docs/dateHelper-usage-guide.md`
- 🔧 Helper: `src/utils/dateHelper.js`
- 💬 Pregunta en #frontend

**REGLA DE ORO: Si es fecha → usa dateHelper.**
