# Plan de Trabajo - Abastecimiento de Combustible

## 📋 **Objetivo**
Implementar la funcionalidad de registro de abastecimiento de combustible para vehículos que participan en operativos, con interfaz responsiva y optimizada para celular.

---

## 🎯 **Requisitos Funcionales**

### **1. Modificación VehiculosPage.jsx**
- **Icono Fuel**: Agregar icono de combustible en la zona de Acciones (antes de MapPin)
- **Acceso**: Al hacer click en el icono, abrir panel CRUD de abastecimiento
- **Datos del vehículo**: Mostrar información completa del vehículo seleccionado

### **2. Panel CRUD de Abastecimiento**
- **Cabecera fija**: Datos principales del vehículo
  - Tipo (Motocicleta, Patrullero, etc.)
  - Placa
  - Código vehículo
  - Kilometraje actual
  - Nombres + apellidos del conductor asignado
  - Capacidad combustible

- **Grid de registros**: Lista de abastecimientos con filtros por rango de fechas
- **Formulario**: Crear/Editar abastecimientos
- **Responsivo**: Optimizado para vista móvil

---

## 🏗️ **Arquitectura Técnica**

### **Frontend Stack**
- **Framework**: React 18 con Hooks
- **Routing**: React Router
- **Estado**: Zustand para estado global
- **HTTP Client**: Axios con interceptores
- **UI**: TailwindCSS + Lucide React icons
- **Validación**: React Hook Form + Zod
- **Notificaciones**: React Hot Toast

### **Backend Integration**
- **Base URL**: `http://localhost:3000/api/v1/abastecimientos`
- **Autenticación**: JWT Bearer Token
- **RBAC**: `vehiculos.abastecimiento.{create,read,update,delete}`

---

## 📁 **Estructura de Archivos**

### **1. Servicios (services/)**
```
services/
├── abastecimientosService.js     # CRUD de abastecimientos
├── vehiculosService.js           # Modificado para incluir datos de conductor
└── tiposCombustibleService.js     # Catálogo de tipos de combustible
```

### **2. Componentes (components/)**
```
components/
├── vehiculos/
│   ├── VehiculosPage.jsx          # Modificada con icono Fuel
│   ├── AbastecimientoModal.jsx    # Modal CRUD principal
│   ├── AbastecimientoForm.jsx     # Formulario de creación/edición
│   ├── AbastecimientoList.jsx     # Grid de registros
│   └── VehiculoInfoCard.jsx       # Cabecera con datos del vehículo
├── common/
│   ├── DatePicker.jsx              # Selector de fechas con rango
│   ├── FilterControls.jsx           # Controles de filtrado
│   └── LoadingSpinner.jsx          # Componente de carga
└── forms/
    └── AbastecimientoSchema.js    # Validación Zod
```

### **3. Páginas (pages/)**
```
pages/vehiculos/
├── VehiculosPage.jsx              # Página principal modificada
└── AbastecimientosPage.jsx       # Página dedicada (opcional)
```

---

## 🔧 **Implementación Detallada**

### **Fase 1: Servicios Backend**
1. **Crear abastecimientosService.js**
   ```javascript
   // Endpoints principales
   - getAbastecimientos(filters)
   - getAbastecimiento(id) 
   - createAbastecimiento(data)
   - updateAbastecimiento(id, data)
   - deleteAbastecimiento(id)
   
   // Utilidades
   - formatFechaHora(fecha)
   - calcularConsumo(km_anterior, km_actual)
   ```

2. **Modificar vehículosService.js**
   ```javascript
   // Nuevos métodos
   - getVehiculoConductor(id)
   - updateKilometraje(id, km)
   
   // Campos adicionales en respuestas
   - conductor_asignado
   - kilometraje_actual
   - capacidad_combustible
   ```

### **Fase 2: Componentes UI**
1. **VehiculosPage.jsx - Modificación**
   ```jsx
   // Importaciones nuevas
   import { Fuel } from 'lucide-react';
   import AbastecimientoModal from './AbastecimientoModal';
   
   // Icono Fuel en acciones
   <button onClick={() => openAbastecimiento(vehicle)}>
     <Fuel size={16} />
   </button>
   ```

2. **AbastecimientoModal.jsx - Modal Principal**
   ```jsx
   // Estructura
   <Modal>
     <VehiculoInfoCard vehicle={vehicle} />  {/* Cabecera fija */}
     <FilterControls onFilter={handleFilter} /> {/* Filtros de fecha */}
     <AbastecimientoList data={abastecimientos} /> {/* Grid de datos */}
     <AbastecimientoForm onSubmit={handleSubmit} /> {/* Formulario */}
   </Modal>
   ```

3. **VehiculoInfoCard.jsx - Cabecera**
   ```jsx
   // Datos del vehículo
   <div className="bg-gray-50 p-4 rounded-lg">
     <h3>{vehicle.tipo} - {vehicle.placa}</h3>
     <div>Conductor: {vehicle.conductor?.nombres} {vehicle.conductor?.apellidos}</div>
     <div>Kilometraje: {vehicle.kilometraje_actual} km</div>
     <div>Capacidad: {vehicle.capacidad_combustible} L</div>
   </div>
   ```

### **Fase 3: Estado y Validación**
1. **Store Zustand**
   ```javascript
   const useAbastecimientosStore = create((set) => ({
     abastecimientos: [],
     vehicleSelected: null,
     loading: false,
     filters: { fecha_inicio: null, fecha_fin: null },
     
     fetchAbastecimientos: async (filters) => { /* ... */ },
     createAbastecimiento: async (data) => { /* ... */ },
     updateAbastecimiento: async (id, data) => { /* ... */ },
     deleteAbastecimiento: async (id) => { /* ... */ }
   }));
   ```

2. **Validación Zod**
   ```javascript
   const abastecimientoSchema = z.object({
     vehiculo_id: z.number().positive("Vehículo requerido"),
     fecha_hora: z.string().datetime("Fecha requerida"),
     tipo_combustible: z.string().min(1, "Tipo requerido"),
     km_actual: z.number().min(0, "Kilometraje válido"),
     cantidad: z.number().min(0.1, "Cantidad requerida"),
     precio_unitario: z.number().min(0.01, "Precio unitario requerido"),
     grifo_nombre: z.string().min(1, "Grifo requerido"),
     grifo_ruc: z.string().optional(),
     factura_boleta: z.string().optional(),
     observaciones: z.string().optional()
   });
   ```

---

## 📱 **Diseño Responsivo**

### **Mobile-First Approach**
1. **Modal Full Screen**: En móviles, el modal ocupa toda la pantalla
2. **Cards Apiladas**: Información del vehículo en formato vertical
3. **Tabla Scrollable**: Grid con scroll horizontal en móviles
4. **Botones Flotantes**: Acciones principales fijas en móvil
5. **Touch-Friendly**: Tamaños de toque mínimos (44px)

### **Breakpoints**
- **Mobile**: < 640px - Layout apilado
- **Tablet**: 640px - 1024px - Layout adaptativo
- **Desktop**: > 1024px - Layout completo

---

## 🔐 **Seguridad y Permisos**

### **RBAC Implementation**
```javascript
// Permisos requeridos
const ABASTECIMIENTO_PERMISSIONS = {
  CREATE: 'vehiculos.abastecimiento.create',
  READ: 'vehiculos.abastecimiento.read', 
  UPDATE: 'vehiculos.abastecimiento.update',
  DELETE: 'vehiculos.abastecimiento.delete'
};

// Verificación de permisos
const checkPermission = (permission) => {
  const userPermissions = getUserPermissions();
  return userPermissions.includes(permission);
};
```

### **Validaciones de Negocio**
1. **Kilometraje creciente**: No permitir km anterior al actual
2. **Capacidad no excedida**: Validar contra capacidad del vehículo
3. **Fechas lógicas**: No permitir fechas futuras
4. **Duplicidad**: Evitar registros duplicados por fecha/vehículo

---

## 📊 **Métricas y Reporting**

### **Indicadores Clave**
1. **Consumo por km**: Calcular automáticamente
2. **Costo por mes**: Reportes de gastos
3. **Rendimiento**: Comparación entre vehículos
4. **Frecuencia**: Tiempo entre abastecimientos

### **Exportación de Datos**
- **CSV**: Exportar registros filtrados
- **PDF**: Reportes formateados
- **Excel**: Análisis detallado

---

## 🚀 **Plan de Implementación**

### **Sprint 1: Backend Integration (3 días)**
- [ ] Crear servicios de abastecimientos
- [ ] Implementar endpoints CRUD
- [ ] Modificar VehiculosPage con icono
- [ ] Crear modal básica

### **Sprint 2: UI y UX (4 días)**
- [ ] Diseñar componente VehiculoInfoCard
- [ ] Implementar filtros de fecha
- [ ] Crear formulario de abastecimiento
- [ ] Agregar grid de registros

### **Sprint 3: Validación y Optimización (3 días)**
- [ ] Implementar validaciones Zod
- [ ] Agregar manejo de errores
- [ ] Optimizar para móvil
- [ ] Testing y correcciones

### **Sprint 4: Funcionalidades Avanzadas (2 días)**
- [ ] Reportes y exportación
- [ ] Métricas y dashboard
- [ ] Notificaciones en tiempo real
- [ ] Documentación final

---

## 📋 **Checklist de Calidad**

### **Code Quality**
- [ ] ESLint sin errores
- [ ] Prettier configurado
- [ ] Componentes reutilizables
- [ ] Sin código duplicado
- [ ] Manejo adecuado de errores

### **UX/UI**
- [ ] Diseño responsivo
- [ ] Estados de carga
- [ ] Mensajes de error claros
- [ ] Feedback visual inmediato
- [ ] Navegación intuitiva

### **Performance**
- [ ] Lazy loading de componentes
- [ ] Paginación optimizada
- [ ] Cache de datos
- [ ] Sin re-renders innecesarios
- [ ] Optimización de imágenes

---

## 🎯 **Definición de "Terminado"**

La funcionalidad se considerará completa cuando:

1. ✅ **Icono Fuel** visible en VehiculosPage
2. ✅ **Modal funcional** con todos los CRUD
3. ✅ **Filtros por fecha** trabajando
4. ✅ **Formulario validado** con Zod
5. ✅ **Diseño responsivo** probado en móvil
6. ✅ **Integración backend** completa
7. ✅ **Manejo de errores** implementado
8. ✅ **Testing manual** exitoso
9. ✅ **Documentación** actualizada

---

## 📞 **Riesgos y Mitigaciones**

| Riesgo | Impacto | Mitigación |
|---------|----------|-------------|
| Backend no disponible | Alto | Mock data para desarrollo |
| Cambios en API | Medio | Versionamiento de endpoints |
| Rendimiento móvil | Medio | Lazy loading y virtualización |
| Complejidad de validación | Bajo | Schema Zod progresivo |
| Integración con operativos | Alto | Coordinación con equipo backend |

---

**📅 Fecha de Inicio**: 2026-04-14
**👤 Responsable**: Equipo Frontend CitySecure
**🎯 Fecha Límite**: 2026-04-28 (2 semanas)
