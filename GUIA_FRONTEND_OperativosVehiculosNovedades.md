# 📋 Guía para Frontend - OperativosVehiculosNovedades

## 🎯 **Descripción General**

El módulo **OperativosVehiculosNovedades** permite registrar y gestionar todas las novedades atendidas por los vehículos operativos en sus cuadrantes asignados. Esta tabla incluye información completa de todos los niveles superiores: Turno → Vehículo → Cuadrante → Novedad.

---

## 🏗️ **Estructura de Datos**

### **Jerarquía de Información**
```
Turno (OperativosTurno)
├── Vehículo Operativo (OperativosVehiculos)
    ├── Cuadrante Asignado (OperativosVehiculosCuadrantes)
        └── Novedades Atendidas (OperativosVehiculosNovedades) ← ESTE MÓDULO
```

### **Campos Principales de Novedad**
```typescript
interface OperativosVehiculosNovedades {
  id: number;                           // ID único de la novedad atendida
  operativo_vehiculo_cuadrante_id: number; // ID del cuadrante donde se atendió
  novedad_id: number;                   // ID del tipo de novedad
  reportado: Date;                      // Fecha y hora del reporte
  atendido?: Date;                      // Fecha y hora de atención (opcional)
  estado: 0 | 1 | 2;                    // 0: Inactivo, 1: Activo, 2: Atendido
  prioridad: "BAJA" | "MEDIA" | "ALTA" | "URGENTE";
  observaciones?: string;                // Observaciones (máx. 1000 caracteres)
  acciones_tomadas?: string;            // Acciones realizadas (máx. 2000 caracteres)
  resultado: "PENDIENTE" | "RESUELTO" | "ESCALADO" | "CANCELADO";
  created_by: number;                   // ID del usuario que registró
  created_at: Date;                     // Fecha de creación
  updated_by?: number;                  // ID del usuario que actualizó
  updated_at?: Date;                    // Fecha de actualización
}

// Interface para respuesta del API
interface NovedadesResponse {
  status: "success";
  message: string;
  data: OperativosVehiculosNovedades[];  // Array de novedades (puede estar vacío)
  cuadranteInfo: {
    cuadrante: {
      id: number;
      nombre: string;
      codigo: string;
    };
    operativoVehiculo: {
      id: number;
      kilometraje_inicio: number;
      kilometraje_fin: number | null;
      nivel_combustible_inicio: number;
      nivel_combustible_fin: number | null;
      hora_inicio: string;
      hora_fin: string | null;
      turno: {
        id: number;
        fecha: string;
        turno: "MAÑANA" | "TARDE" | "NOCHE";
        estado: "ACTIVO" | "CERRADO" | "ANULADO";
      };
      vehiculo: {
        id: number;
        placa: string;
        marca: string;
        modelo: string;
      };
      conductor: {
        id: number;
        nombres: string;
        apellidos: string;
      };
      copiloto: {
        id: number;
        nombres: string;
        apellidos: string;
      };
    };
  };
  summary: {
    total: number;
    porEstado: {
      activas: number;
      inactivas: number;
      atendidas: number;
    };
    porPrioridad: {
      baja: number;
      media: number;
      alta: number;
    };
    porResultado: {
      pendientes: number;
      resueltas: number;
      escaladas: number;
      canceladas: number;
    };
  };
}
```

---

## 🔗 **Endpoints API**

### **Base URL**
```
/api/v1/operativos/{turnoId}/vehiculos/{vehiculoId}/cuadrantes/{cuadranteId}/novedades
```

### **1. Obtener Novedades de un Cuadrante**
```http
GET /api/v1/operativos/{turnoId}/vehiculos/{vehiculoId}/cuadrantes/{cuadranteId}/novedades
```

**Response:**
```json
{
  "status": "success",
  "message": "Novedades obtenidas exitosamente con información completa",
  "data": [
    {
      "id": 1,
      "novedad_id": 5,
      "reportado": "2026-01-14T18:30:00.000Z",
      "atendido": null,
      "estado": 1,
      "prioridad": "ALTA",
      "observaciones": "Accidente vehicular reportado",
      "acciones_tomadas": null,
      "resultado": "PENDIENTE",
      "novedad": {
        "id": 5,
        "nombre": "Accidente Vehicular",
        "descripcion": "Colisión entre vehículos",
        "tipo_novedad": "EMERGENCIA"
      },
      "cuadranteOperativo": {
        "id": 10,
        "hora_ingreso": "2026-01-14T18:00:00.000Z",
        "hora_salida": null,
        "observaciones": "Patrullaje normal",
        "cuadrante": {
          "id": 7,
          "nombre": "Centro Histórico",
          "codigo": "C-007"
        },
        "operativoVehiculo": {
          "id": 5,
          "kilometraje_inicio": 15000,
          "kilometraje_fin": null,
          "hora_inicio": "2026-01-14T17:00:00.000Z",
          "turno": {
            "id": 3,
            "fecha": "2026-01-14",
            "turno": "TARDE",
            "estado": "ACTIVO"
          },
          "vehiculo": {
            "id": 12,
            "placa": "ABC-123",
            "marca": "Toyota",
            "modelo": "Hilux"
          },
          "conductor": {
            "id": 25,
            "nombres": "Juan Pérez",
            "apellidos": "García"
          },
          "copiloto": {
            "id": 30,
            "nombres": "María López",
            "apellidos": "Díaz"
          }
        }
      }
    }
  ],
  "cuadranteInfo": {
    "cuadrante": {
      "id": 7,
      "nombre": "Centro Histórico",
      "codigo": "C-007"
    },
    "operativoVehiculo": {
      "id": 5,
      "kilometraje_inicio": 15000,
      "kilometraje_fin": null,
      "nivel_combustible_inicio": 80,
      "nivel_combustible_fin": null,
      "hora_inicio": "2026-01-14T17:00:00.000Z",
      "hora_fin": null,
      "turno": {
        "id": 3,
        "fecha": "2026-01-14",
        "turno": "TARDE",
        "estado": "ACTIVO"
      },
      "vehiculo": {
        "id": 12,
        "placa": "ABC-123",
        "marca": "Toyota",
        "modelo": "Hilux"
      },
      "conductor": {
        "id": 25,
        "nombres": "Juan Pérez",
        "apellidos": "García"
      },
      "copiloto": {
        "id": 30,
        "nombres": "María López",
        "apellidos": "Díaz"
      }
    }
  },
  "summary": {
    "total": 1,
    "porEstado": {
      "activas": 1,
      "inactivas": 0,
      "atendidas": 0
    },
    "porPrioridad": {
      "baja": 0,
      "media": 0,
      "alta": 1,
      "urgente": 0
    },
    "porResultado": {
      "pendientes": 1,
      "resueltas": 0,
      "escaladas": 0,
      "canceladas": 0
    }
  }
}
```

**📋 Nota Importante:** 
- **`data`**: Array de novedades (puede estar vacío `[]`)
- **`cuadranteInfo`**: Siempre incluye información completa del cuadrante y vehículo, incluso cuando no hay novedades
- **`summary`**: Estadísticas basadas en las novedades existentes

**Ejemplo de respuesta sin novedades:**
```json
{
  "status": "success",
  "message": "Novedades obtenidas exitosamente con información completa",
  "data": [],
  "cuadranteInfo": {
    "cuadrante": {
      "id": 7,
      "nombre": "Centro Histórico",
      "codigo": "C-007"
    },
    "operativoVehiculo": {
      "id": 5,
      "vehiculo": {
        "id": 12,
        "placa": "ABC-123",
        "marca": "Toyota",
        "modelo": "Hilux"
      },
      "conductor": {
        "id": 25,
        "nombres": "Juan Pérez",
        "apellidos": "García"
      },
      "copiloto": {
        "id": 30,
        "nombres": "María López",
        "apellidos": "Díaz"
      }
    }
  },
  "summary": {
    "total": 0,
    "porEstado": {
      "activas": 0,
      "inactivas": 0,
      "atendidas": 0
    },
    "porPrioridad": {
      "baja": 0,
      "media": 0,
      "alta": 0,
      "urgente": 0
    },
    "porResultado": {
      "pendientes": 0,
      "resueltas": 0,
      "escaladas": 0,
      "canceladas": 0
    }
  }
}
```

### **2. Obtener Novedades Disponibles del Cuadrante**
```http
GET /api/v1/operativos/{turnoId}/vehiculos/{vehiculoId}/cuadrantes/{cuadranteId}/novedades/disponibles
```

**📋 Propósito:** Obtener la lista de novedades del sistema que pertenecen a este cuadrante específico para que el frontend pueda seleccionar cuál atender.

**Response:**
```json
{
  "status": "success",
  "message": "Novedades disponibles del cuadrante obtenidas exitosamente",
  "data": [
    {
      "id": 40,
      "novedad_code": "000029",
      "fecha_hora_ocurrencia": "2026-01-06 05:22:00",
      "fecha_hora_reporte": "2026-01-06 10:22:58",
      "descripcion": "Alarma activada en domicilio",
      "prioridad_actual": "ALTA",
      "localizacion": "Ca. San Martín N° 852",
      "novedadTipoNovedad": {
        "id": 7,
        "nombre": "ALARMA ACTIVADA",
        "color_hex": "#F59E0B",
        "icono": null
      },
      "novedadSubtipoNovedad": {
        "id": 28,
        "nombre": "DE DOMICILIO",
        "descripcion": "Alarma activada en domicilio particular",
        "prioridad": "ALTA"
      },
      "novedadEstado": {
        "id": 2,
        "nombre": "DESPACHADO",
        "color_hex": "#F59E0B",
        "icono": "send"
      },
      "novedadCuadrante": {
        "id": 9,
        "nombre": "Cuadrante 12",
        "cuadrante_code": "12"
      },
      "novedadVehiculo": {
        "id": 32,
        "codigo_vehiculo": "C-02",
        "placa": "AUE-202"
      }
    }
  ],
  "cuadranteInfo": {
    "id": 9,
    "nombre": "Cuadrante 12",
    "codigo": "12"
  },
  "summary": {
    "total": 1,
    "porPrioridad": {
      "urgente": 0,
      "alta": 1,
      "media": 0,
      "baja": 0
    },
    "porEstado": {
      "despachado": 1,
      "pendiente": 0,
      "atendido": 0
    }
  }
}
```

### **3. Registrar Nueva Novedad Atendida**
```http
POST /api/v1/operativos/{turnoId}/vehiculos/{vehiculoId}/cuadrantes/{cuadranteId}/novedades
```

**Request Body:**
```json
{
  "novedad_id": 40,  // ID de la novedad disponible (del endpoint /disponibles)
  "reportado": "2026-01-14T18:30:00.000Z",
  "prioridad": "ALTA",
  "observaciones": "Alarma atendida por patrullaje",
  "resultado": "PENDIENTE"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Novedad registrada en el cuadrante correctamente",
  "data": {
    "id": 1,
    // ... todos los campos del registro creado
    "cuadranteOperativo": {
      // ... información completa del cuadrante y niveles superiores
    }
  }
}
```

### **3. Actualizar Novedad**
```http
PUT /api/v1/operativos/{turnoId}/vehiculos/{vehiculoId}/cuadrantes/{cuadranteId}/novedades/{id}
```

**Request Body:**
```json
{
  "atendido": "2026-01-14T19:15:00.000Z",
  "acciones_tomadas": "Se coordinó con grúa y servicios médicos",
  "resultado": "RESUELTO"
}
```

**Nota:** Si `resultado` se establece en `"RESUELTO"`, el sistema automáticamente:
- Actualiza `atendido` a la fecha/hora actual si no se proporciona
- Cambia `estado` a `2` (Atendido)

### **4. Eliminar Novedad**
```http
DELETE /api/v1/operativos/{turnoId}/vehiculos/{vehiculoId}/cuadrantes/{cuadranteId}/novedades/{id}
```

**Response:**
```json
{
  "status": "success",
  "message": "Novedad eliminada correctamente"
}
```

---

## 🎨 **Componentes UI Sugeridos**

### **1. Lista de Novedades**
```typescript
interface NovedadesListProps {
  cuadranteId: number;
  turnoId: number;
  vehiculoId: number;
}

// Componente para mostrar lista de novedades con filtros y resumen
const NovedadesList: React.FC<NovedadesListProps> = ({ cuadranteId }) => {
  // Implementar filtros por:
  // - Estado (Activo/Inactivo/Atendido)
  // - Prioridad (Baja/Media/Alta/Urgente)
  // - Resultado (Pendiente/Resuelto/Escalado/Cancelado)
  // - Fecha de reporte
};
```

### **2. Formulario de Registro**
```typescript
interface NovedadFormProps {
  cuadranteId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const NovedadForm: React.FC<NovedadFormProps> = ({ cuadranteId, onSuccess, onCancel }) => {
  // Campos del formulario:
  // - novedad_id (select con lista de novedades disponibles)
  // - reportado (datetime picker)
  // - prioridad (select: BAJA/MEDIA/ALTA/URGENTE)
  // - observaciones (textarea, maxlength 1000)
  // - resultado (select: PENDIENTE/RESUELTO/ESCALADO/CANCELADO)
};
```

### **3. Tarjeta de Novedad**
```typescript
interface NovedadCardProps {
  novedad: OperativosVehiculosNovedades;
  onUpdate?: () => void;
  onDelete?: () => void;
}

const NovedadCard: React.FC<NovedadCardProps> = ({ novedad, onUpdate, onDelete }) => {
  // Mostrar información completa con colores según prioridad:
  // - URGENTE: rojo
  // - ALTA: naranja
  // - MEDIA: amarillo
  // - BAJA: verde
};
```

---

## 🎯 **Estados y Colores**

### **Prioridades**
```css
.prioridad-urgente { background-color: #dc3545; color: white; }
.prioridad-alta   { background-color: #fd7e14; color: white; }
.prioridad-media  { background-color: #ffc107; color: black; }
.prioridad-baja   { background-color: #198754; color: white; }
```

### **Estados**
```css
.estado-activo    { background-color: #198754; color: white; }
.estado-inactivo  { background-color: #6c757d; color: white; }
.estado-atendido  { background-color: #0dcaf0; color: white; }
```

### **Resultados**
```css
.resultado-pendiente { background-color: #ffc107; color: black; }
.resultado-resuelto  { background-color: #198754; color: white; }
.resultado-escalado  { background-color: #dc3545; color: white; }
.resultado-cancelado { background-color: #6c757d; color: white; }
```

---

## 📊 **Flujo de Trabajo Sugerido**

### **1. Registro de Novedad**
1. Usuario selecciona el cuadrante activo
2. Carga el formulario con información del cuadrante (turno, vehículo, personal)
3. Selecciona el tipo de novedad de la lista disponible
4. Asigna prioridad automáticamente según el tipo de novedad
5. Registra observaciones y acciones iniciales
6. Guarda como "PENDIENTE"

### **2. Atención de Novedad**
1. Personal operativo actualiza la novedad
2. Registra fecha/hora de atención
3. Describe acciones tomadas
4. Cambia resultado a "RESUELTO" o "ESCALADO"
5. Sistema actualiza estado automáticamente

### **3. Seguimiento**
1. Dashboard muestra resumen por estados y prioridades
2. Filtros para novedades pendientes
3. Alertas para novedades urgentes no atendidas
4. Reportes de tiempos de respuesta

---

## 🔐 **Permisos Requeridos**

- **Leer novedades**: `operativos.vehiculos.novedades.read`
- **Crear novedades**: `operativos.vehiculos.novedades.create`
- **Actualizar novedades**: `operativos.vehiculos.novedades.update`
- **Eliminar novedades**: `operativos.vehiculos.novedades.delete`

---

## 📱 **Consideraciones Mobile**

### **Formulario Compacto**
- Usar selects desplegables para ahorrar espacio
- Input de fecha/hora con selector nativo
- Textareas con contador de caracteres
- Botones flotantes para acciones rápidas

### **Lista Optimizada**
- Cards apilables con swipe para acciones
- Indicadores visuales de prioridad
- Pull-to-refresh para actualizar
- Infinite scroll para listas largas

---

## 🎯 **Ejemplo de Implementación**

### **React Hook para Novedades**
```typescript
const useNovedades = (cuadranteId: number) => {
  const [novedades, setNovedades] = useState<OperativosVehiculosNovedades[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const fetchNovedades = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/operativos/.../cuadrantes/${cuadranteId}/novedades`);
      setNovedades(response.data.data);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error fetching novedades:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNovedad = async (data: Partial<OperativosVehiculosNovedades>) => {
    // Implementar creación
  };

  const updateNovedad = async (id: number, data: Partial<OperativosVehiculosNovedades>) => {
    // Implementar actualización
  };

  return { novedades, loading, summary, fetchNovedades, createNovedad, updateNovedad };
};
```

---

## 🚀 **Próximos Pasos**

1. **Crear componentes UI** según las especificaciones
2. **Implementar servicio API** con TypeScript
3. **Agregar validaciones frontend** para formularios
4. **Crear dashboard de seguimiento** con gráficos
5. **Implementar notificaciones** para novedades urgentes
6. **Agregar reportes PDF** para impresión

---

## 📞 **Soporte**

Para cualquier duda sobre la implementación o estructura de datos, consultar:
- Documentación técnica del backend
- Esquemas de validación en las rutas
- Modelos de datos en los archivos de modelos

**¡Listo para implementar!** 🎉
