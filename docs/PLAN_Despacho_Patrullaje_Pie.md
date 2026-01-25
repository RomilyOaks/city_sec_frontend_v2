# 📋 Plan de Acción - Despacho de Patrullaje a Pie

## 🎯 **Objetivo**

Implementar el flujo de despacho para patrullaje a pie cuando `novedad.personal_cargo_id` tiene dato, complementando el flujo existente de patrullaje vehicular.

---

## 🔄 **Flujo Lógico Principal**

### **📊 Lógica Condicional de Despacho**

```javascript
// En DespacharModal.jsx - handleSubmit()
let resultados = [];

// 🔥 NUEVO: Si hay personal, despachar patrullaje a pie
if (novedadData.personal_cargo_id && novedadData.personal_cargo_id !== '') {
  const resultadoPersonal = await despacharPersonalAPie(novedadData);
  resultados.push({ tipo: 'personal', data: resultadoPersonal });
}

// ✅ EXISTENTE: Si hay vehículo, despachar patrullaje vehicular
if (novedadData.vehiculo_id && novedadData.vehiculo_id !== '') {
  const resultadoVehiculo = await despacharVehiculo(novedadData);
  resultados.push({ tipo: 'vehiculo', data: resultadoVehiculo });
}

// 🔥 IMPORTANTE: Al menos uno debe estar seleccionado
if (resultados.length === 0) {
  throw new Error('Debe seleccionar vehículo o personal para despachar (o ambos)');
}

return resultados; // Array con los resultados de ambos despachos
```

---

## 🛠️ **Plan de Implementación por Fases**

### **📋 FASE 1: Servicios y Endpoints**

#### **1.1 Crear Servicio de Operativos Personales**
```javascript
// src/services/operativosPersonalService.js
export const getPersonalDisponible = async (cuadrante_id = null) => {
  // GET /api/v1/operativos-personal/disponibles?cuadrante_id={id}
};

export const crearOperativoPersonalCompleto = async (novedadData) => {
  // POST /api/v1/operativos-personal/despachar-completo
  // Crea toda la cadena: operativo_turno → operativos_personal → operativos_personal_cuadrantes → operativos_personal_novedades
};
```

#### **1.2 Actualizar operativosHelperService.js**
```javascript
// Agregar funciones para patrullaje a pie
export const getPersonalDisponibleParaDespacho = async (cuadrante_id) => {
  // Wrapper para getPersonalDisponible()
};

export const crearOperativoPersonalCompleto = async (novedadData) => {
  // Wrapper con manejo de errores similar a vehículos
};
```

### **📋 FASE 2: Componentes UI**

#### **2.1 Modificar DespacharModal.jsx**
```javascript
// Agregar estado para personal
const [personalDisponible, setPersonalDisponible] = useState([]);

// Modificar loadOperativosData()
const loadOperativosData = async () => {
  // Cargar vehículos (existente)
  const vehiculosDisp = await getVehiculosDisponiblesParaDespacho();
  setVehiculosDisponibles(vehiculosDisp);

  // 🔥 NUEVO: Cargar personal disponible
  const personalDisp = await getPersonalDisponibleParaDespacho(novedad.cuadrante_id);
  setPersonalDisponible(personalDisp);
};
```

#### **2.2 Agregar Dropdown de Personal (NO Exclusivo)**
```javascript
// En DespacharModal.jsx - Pestaña de Recursos
<div className="space-y-4">
  {/* Dropdown de Vehículos (existente) */}
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
      <Truck size={16} className="inline mr-1" />
      Vehículo de Patrullaje
    </label>
    <select
      value={formData.vehiculo_id || ''}
      onChange={(e) => {
        setFormData({ ...formData, vehiculo_id: e.target.value });
        // 🔥 NO limpiar personal - permitir ambos
      }}
      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2"
    >
      <option value="">Seleccione vehículo...</option>
      {vehiculosDisponibles.map(v => (
        <option key={v.id} value={v.id}>
          {v.placa} - {v.marca} {v.modelo}
        </option>
      ))}
    </select>
  </div>

  {/* 🔥 NUEVO: Dropdown de Personal (NO exclusivo) */}
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
      <Users size={16} className="inline mr-1" />
      Personal de Patrullaje a Pie
    </label>
    <select
      value={formData.personal_cargo_id || ''}
      onChange={(e) => {
        setFormData({ ...formData, personal_cargo_id: e.target.value });
        // 🔥 NO limpiar vehículo - permitir ambos
      }}
      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2"
    >
      <option value="">Seleccione personal...</option>
      {personalDisponible.map(p => (
        <option key={p.id} value={p.id}>
          {p.nombres} {p.apellido_paterno} ({p.codigo_personal})
        </option>
      ))}
    </select>
  </div>

  {/* 🔥 Mensaje informativo actualizado */}
  {(formData.vehiculo_id || formData.personal_cargo_id) && (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
          <Info size={16} />
          <span className="font-medium">Recursos asignados:</span>
        </div>
        <div className="ml-6 space-y-1 text-sm text-blue-700 dark:text-blue-300">
          {formData.vehiculo_id && (
            <div className="flex items-center gap-2">
              <Truck size={14} />
              <span>Patrullaje vehicular</span>
            </div>
          )}
          {formData.personal_cargo_id && (
            <div className="flex items-center gap-2">
              <Users size={14} />
              <span>Patrullaje a pie (personal)</span>
            </div>
          )}
          {formData.vehiculo_id && formData.personal_cargo_id && (
            <div className="text-xs text-blue-600 dark:text-blue-400 italic">
              Se despacharán ambos recursos
            </div>
          )}
        </div>
      </div>
    </div>
  )}
</div>
```

### **📋 FASE 3: Lógica de Despacho**

#### **3.1 Modificar handleSubmit() en DespacharModal.jsx**
```javascript
const handleSubmit = async () => {
  try {
    setSubmitting(true);

    // Validación básica
    if (!formData.vehiculo_id && !formData.personal_cargo_id) {
      throw new Error('Debe seleccionar vehículo o personal para despachar (o ambos)');
    }

    let resultados = [];
    let mensajes = [];

    // 🔥 PRIMERO: Despachar vehículo si hay
    if (formData.vehiculo_id) {
      try {
        const resultadoVehiculo = await despacharVehiculo();
        resultados.push({ tipo: 'vehiculo', data: resultadoVehiculo });
        mensajes.push(`Vehículo ${resultadoVehiculo.vehiculo?.placa || 'despachado'} asignado`);
      } catch (error) {
        console.error('Error despachando vehículo:', error);
        throw new Error(`Error en vehículo: ${error.message}`);
      }
    }

    // 🔥 LUEGO: Despachar personal si hay
    if (formData.personal_cargo_id) {
      try {
        const resultadoPersonal = await despacharPersonalAPie();
        resultados.push({ tipo: 'personal', data: resultadoPersonal });
        mensajes.push(`Personal ${resultadoPersonal.personal?.nombres || 'asignado'} despachado a pie`);
      } catch (error) {
        console.error('Error despachando personal:', error);
        throw new Error(`Error en personal: ${error.message}`);
      }
    }

    // Feedback de éxito combinado
    const mensajeExito = resultados.length > 1 
      ? `Operativos creados exitosamente: ${mensajes.join(' + ')}`
      : mensajes[0];
    
    toast.success(mensajeExito);
    onSubmit(resultados);
    onClose();

  } catch (error) {
    console.error('Error en despacho:', error);
    toast.error(error.message || 'Error al despachar operativo');
  } finally {
    setSubmitting(false);
  }
};
```

#### **3.2 Implementar despacharPersonalAPie()**
```javascript
const despacharPersonalAPie = async () => {
  // Obtener turno actual
  const today = getLocalDate();
  const turnoActual = await getHorarioActivo();
  
  if (!turnoActual?.turno) {
    throw new Error('No se pudo determinar el turno activo');
  }

  // Buscar o crear operativo turno
  const operativo = await findOrCreateOperativoTurno(
    today,
    turnoActual.turno,
    novedad.sector_id,
    user?.personal_seguridad_id
  );

  // Crear operativo personal completo
  const payload = {
    novedad_id: novedad.id,
    personal_cargo_id: formData.personal_cargo_id,
    cuadrante_id: novedad.cuadrante_id,
    prioridad: novedad.prioridad_actual || 'MEDIA',
    turno_id: operativo.id,
    observaciones: formData.observaciones || `Despacho desde novedades - ${new Date().toLocaleString()}`
  };

  const resultado = await crearOperativoPersonalCompleto(payload);
  return resultado;
};
```

### **📋 FASE 4: Validaciones y UX**

#### **4.1 Validaciones en Formulario (Actualizadas)**
```javascript
const validarFormulario = () => {
  const errores = [];

  // 🔥 Se debe seleccionar al menos uno (actualizado)
  if (!formData.vehiculo_id && !formData.personal_cargo_id) {
    errores.push('Debe seleccionar vehículo o personal para despachar (o ambos)');
  }

  // Validar cuadrante si hay personal (mantenido)
  if (formData.personal_cargo_id && !novedad.cuadrante_id) {
    errores.push('El despacho de personal requiere cuadrante asignado');
  }

  // 🔥 NUEVO: Validar que ambos tengan datos válidos
  if (formData.vehiculo_id && isNaN(Number(formData.vehiculo_id))) {
    errores.push('ID de vehículo inválido');
  }

  if (formData.personal_cargo_id && isNaN(Number(formData.personal_cargo_id))) {
    errores.push('ID de personal inválido');
  }

  return errores;
};
```

#### **4.2 Estados de Carga**
```javascript
const [submitting, setSubmitting] = useState(false);
const [loadingPersonal, setLoadingPersonal] = useState(false);

// UI de carga
{submitting && (
  <div className="flex items-center justify-center py-4">
    <Loader2 className="animate-spin mr-2" />
    <span>Despachando operativo...</span>
  </div>
)}
```

---

## 🗂️ **Estructura de Archivos a Crear/Modificar**

### **📁 Archivos Nuevos**
```
src/services/operativosPersonalService.js          # Servicio completo de operativos personales
docs/PLAN_Despacho_Patrullaje_Pie.md                 # Este documento
```

### **📝 Archivos a Modificar**
```
src/components/novedades/DespacharModal.jsx           # Agregar dropdown de personal y lógica
src/services/operativosHelperService.js              # Agregar funciones de personal
src/pages/novedades/NovedadesPage.jsx                 # Validaciones en formulario (si aplica)
```

---

## 🔄 **Flujo de Datos Completo**

### **📊 Esquema de Tablas (Backend)**
```
Operativos_turno (Padre - ya existe)
├── operativos_personal (Hijo)
│   ├── operativo_turno_id = Operativos_turno.id
│   └── personal_id = Novedades.personal_cargo_id
└── operativos_personal_cuadrantes (Nieto)
    ├── operativo_personal_id = operativos_personal.id
    └── cuadrante_id = Novedades.cuadrante_id
    └── operativos_personal_novedades (Bis-nieto)
        ├── operativo_personal_cuadrante_id = operativos_personal_cuadrantes.id
        ├── novedad_id = novedad.id
        ├── reportado = current_timestamp
        ├── prioridad = NOVEDADES.prioridad_actual
        └── resultado = 'PENDIENTE'
```

### **🔄 Flujo Frontend → Backend**
```
1. Usuario selecciona personal en dropdown
2. Frontend valida que no haya vehículo seleccionado
3. Frontend llama a POST /api/v1/operativos-personal/despachar-completo
4. Backend crea toda la cadena de tablas automáticamente
5. Backend retorna objeto con todos los IDs creados
6. Frontend muestra feedback de éxito
```

---

## 🧪 **Plan de Testing**

### **✅ Casos de Éxito**
1. **Solo Vehículo**: Seleccionar vehículo → Crear operativo vehicular
2. **Solo Personal**: Seleccionar personal → Crear operativo personal completo
3. **🔥 AMBOS**: Seleccionar vehículo Y personal → Crear ambos operativos
4. **Múltiples Recursos**: Feedback combinado para ambos despachos

### **❌ Casos de Error**
1. **Sin Selección**: No seleccionar ni vehículo ni personal → Error
2. **Sin Cuadrante**: Personal sin cuadrante asignado → Error
3. **IDs Inválidos**: Vehículo o personal con ID inválido → Error
4. **Backend Error**: Error en endpoint → Manejo con try/catch

### **🔄 Edge Cases**
1. **Personal No Disponible**: Dropdown vacío → Mensaje informativo
2. **Error Parcial**: Vehículo OK, Personal ERROR → Mostrar error específico
3. **Concurrencia**: Múltiples despachos simultáneos → Backend maneja
4. **Recursos Mixtos**: Un vehículo con múltiples personales → Soportado

---

## 🎯 **Criterios de Aceptación**

### **✅ Funcionalidad**
- [ ] Dropdown de personal disponible se carga correctamente
- [ ] 🔥 **Permitir selección múltiple**: vehículo Y personal simultáneamente
- [ ] Creación exitosa de toda la cadena de operativos personales
- [ ] Feedback visual adecuado durante el proceso
- [ ] Manejo de errores específicos y claros
- [ ] 🔥 **Despacho secuencial**: vehículo primero, luego personal

### **✅ Calidad**
- [ ] ESLint sin errores críticos
- [ ] Build exitoso
- [ ] Componentes reutilizables y mantenibles
- [ ] Código documentado y limpio
- [ ] Testing de casos principales

### **✅ UX/UI**
- [ ] Interface intuitiva y consistente
- [ ] 🔥 **Feedback claro para múltiples recursos**: muestra ambos despachos
- [ ] Mensajes claros para el usuario
- [ ] Estados de carga visibles
- [ ] Responsive design
- [ ] Accesibilidad básica

---

## 🚀 **Próximos Pasos**

1. **FASE 1**: Crear servicios y endpoints
2. **FASE 2**: Modificar componente DespacharModal
3. **FASE 3**: Implementar lógica de despacho
4. **FASE 4**: Agregar validaciones y UX
5. **TESTING**: Probar flujo completo
6. **REVIEW**: ESLint + Build
7. **DEPLOY**: Subir a GitHub

---

## 📝 **Notas Importantes**

- **🔥 CAMBIO CLAVE**: Ahora permite vehículo Y personal simultáneamente (no exclusivo)
- **Despacho Secuencial**: Primero vehículo, luego personal (como solicitaste)
- **Reutilización**: Máxima reutilización de código existente (turnos, cuadrantes, etc.)
- **Consistencia**: Mantener patrones similares al flujo vehicular
- **Robustez**: Manejo completo de errores y edge cases
- **Documentación**: Código bien documentado para mantenimiento futuro

**¿Listo para proceder con la implementación?** 🚀
