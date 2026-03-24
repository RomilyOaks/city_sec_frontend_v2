# 🐛 BACKEND: Campos No Actualizados en Novedades

## 📋 **PROBLEMA REPORTADO**

El frontend está enviando correctamente los siguientes campos pero el backend no está actualizando los datos en la base de datos:

- ❌ **N° Personas Afectadas**
- ❌ **Pérdidas Materiales Estimadas (S/.)**
- ❌ **Fecha Próxima Revisión**

---

## 🔍 **ANÁLISIS TÉCNICO - FRONTEND**

### **📍 **Ubicación del Código**
- **Archivo:** `src/pages/novedades/NovedadesPage.jsx`
- **Función:** `handleGuardarAtencion()`
- **Líneas:** 1652-1699

### **📤 **PAYLOAD ENVIADO AL BACKEND**

El frontend envía el siguiente payload al endpoint `PUT /novedades/:novedadId/asignar-recursos`:

```javascript
const payload = {
  // ... otros campos ...
  
  // 🎯 CAMPOS PROBLEMÁTICOS (se envían correctamente):
  num_personas_afectadas: atencionData.num_personas_afectadas
    ? Number(atencionData.num_personas_afectadas)
    : undefined,
    
  perdidas_materiales_estimadas: atencionData.perdidas_materiales_estimadas
    ? Number(atencionData.perdidas_materiales_estimadas)
    : undefined,
    
  fecha_proxima_revision: atencionData.fecha_proxima_revision || undefined,
  
  // 🆕 CAMPO AGREGADO (se envía cuando hay fecha de cierre):
  ...(atencionData.fecha_cierre ? { usuario_cierre: user?.id } : {}),
  
  // ... otros campos ...
};
```

### **🔧 **CARGA DE DATOS INICIAL**

Los datos se cargan correctamente desde backend en `openAtencionModal()`:

```javascript
setAtencionData({
  // ... otros campos ...
  perdidas_materiales_estimadas: novedadCompleta.perdidas_materiales_estimadas || "",
  num_personas_afectadas: novedadCompleta.num_personas_afectadas ?? 0,
  fecha_proxima_revision: novedadCompleta.fecha_proxima_revision
    ? new Date(novedadCompleta.fecha_proxima_revision)
        .toISOString()
        .slice(0, 10)
    : "",
  // ... otros campos ...
});
```

---

## 🎯 **VERIFICACIÓN FRONTEND**

### **✅ **CONFIRMADO FUNCIONANDO:**

1. **Carga de datos:** Los valores desde BD se muestran correctamente en el modal
2. **Actualización de estado:** Los inputs actualizan `atencionData` correctamente
3. **Envío al backend:** Los campos se incluyen en el payload con formato correcto
4. **Tipos de datos:** Se convierten correctamente (Number, String)

### **📊 **EJEMPLOS DE PAYLOAD ENVIADO:**

**Caso 1: Todos los campos con valores**
```javascript
{
  "num_personas_afectadas": 3,           // Number
  "perdidas_materiales_estimadas": 1500,  // Number  
  "fecha_proxima_revision": "2024-12-31"   // String YYYY-MM-DD
}
```

**Caso 2: Campos vacíos/undefined**
```javascript
{
  "num_personas_afectadas": 0,           // Number (valor por defecto)
  "perdidas_materiales_estimadas": undefined,  // No se envía si está vacío
  "fecha_proxima_revision": undefined    // No se envía si está vacío
}
```

---

## 🐛 **DIAGNÓSTICO - POSIBLES CAUSAS BACKEND**

### **🔍 **VERIFICAR EN BACKEND:**

**1. Endpoint: `PUT /novedades/:novedadId/asignar-recursos`**
```javascript
// Verificar que estos campos estén en el req.body:
const { 
  num_personas_afectadas,
  perdidas_materiales_estimadas, 
  fecha_proxima_revision,
  // ... otros campos ...
} = req.body;
```

**2. Actualización de la base de datos:**
```javascript
// Verificar que se incluyan en la actualización:
const datosActualizacion = {
  // ... otros campos ...
  num_personas_afectadas,
  perdidas_materiales_estimadas,
  fecha_proxima_revision,
  // ... otros campos ...
};

await Novedad.update(datosActualizacion, {
  where: { id: novedadId }
});
```

**3. Validación de tipos de datos:**
- `num_personas_afectadas`: Debe ser INTEGER o NUMBER
- `perdidas_materiales_estimadas`: Debe ser DECIMAL o FLOAT
- `fecha_proxima_revision`: Debe ser DATE

---

## 🎯 **ACCIONES REQUERIDAS BACKEND**

### **📝 **PASOS PARA DIAGNÓSTICO:**

**1. Agregar logging en el controlador:**
```javascript
console.log("🔍 DEBUG - Payload recibido:", {
  num_personas_afectadas: req.body.num_personas_afectadas,
  perdidas_materiales_estimadas: req.body.perdidas_materiales_estimadas,
  fecha_proxima_revision: req.body.fecha_proxima_revision,
  tipo_num_personas: typeof req.body.num_personas_afectadas,
  tipo_perdidas: typeof req.body.perdidas_materiales_estimadas,
  tipo_fecha: typeof req.body.fecha_proxima_revision
});
```

**2. Verificar actualización:**
```javascript
console.log("🔍 DEBUG - Datos a actualizar:", datosActualizacion);

const [affectedRows] = await Novedad.update(datosActualizacion, {
  where: { id: novedadId }
});

console.log("🔍 DEBUG - Filas afectadas:", affectedRows);
```

**3. Validar esquema de BD:**
```sql
-- Verificar que los campos existan en la tabla novedades
DESCRIBE novedades;

-- Verificar tipos de datos
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'novedades' 
  AND COLUMN_NAME IN (
    'num_personas_afectadas', 
    'perdidas_materiales_estimadas', 
    'fecha_proxima_revision'
  );
```

---

## 🚀 **SOLUCIÓN ESPERADA**

**El backend debe:**
1. ✅ Recibir correctamente los campos en el payload
2. ✅ Incluirlos en la actualización de la BD
3. ✅ Manejar correctamente los tipos de datos
4. ✅ Devolver los valores actualizados en la respuesta

---

## 📞 **CONTACTO PARA COORDINACIÓN**

**Frontend confirmado funcionando correctamente.**
**Por favor revisar el endpoint `PUT /novedades/:novedadId/asignar-recursos` en el backend.**

**Una vez corregido, probar con:**
1. Cambiar N° Personas Afectadas de 2 a 3
2. Cambiar Pérdidas Materiales de 1000 a 1500  
3. Cambiar Fecha Próxima Revisión a una fecha futura
4. Guardar y verificar que se actualice en BD

---

**📅 Fecha:** 23/03/2026  
**👤 Reportado por:** Frontend Development Team  
**🔧 Prioridad:** Alta (afecta funcionalidad crítica)
