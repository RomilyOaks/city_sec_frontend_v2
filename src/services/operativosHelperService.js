/**
 * File: src/services/operativosHelperService.js
 * @version 1.0.0
 * @description Servicio auxiliar para integrar Despachar con Operativos de Patrullaje
 * Reutiliza servicios existentes y añade funcionalidad específica para el flujo de despacho
 * @module src/services/operativosHelperService.js
 */

import { getHorarioActivo } from "./horariosTurnosService.js";
import { listOperativosTurno, createOperativosTurno } from "./operativosTurnoService.js";
import { createVehiculoOperativo, listVehiculosByTurno } from "./operativosVehiculosService.js";
import { listVehiculosDisponibles } from "./vehiculosService.js";
import api from "./api.js";
import toast from "react-hot-toast";

/**
 * Obtiene el turno activo actual
 * @returns {Promise<Object>} Datos del turno activo
 */
export async function getTurnoActivo() {
  try {
    const turno = await getHorarioActivo();
    return turno;
  } catch (error) {
    console.error("Error obteniendo turno activo:", error);
    throw error;
  }
}

/**
 * Busca un operativo de turno por fecha, turno y sector_id
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} turno - Turno: "MAÑANA" | "TARDE" | "NOCHE"
 * @param {number} sector_id - ID del sector
 * @returns {Promise<Object|null>} Operativo encontrado o null
 */
export async function findOperativoTurnoByParams(fecha, turno, sector_id) {
  try {
    console.log("🔍 Buscando operativo con params:", { fecha, turno, sector_id });
    
    const result = await listOperativosTurno({
      fecha,
      turno,
      sector_id,
      // No filtrar por estado para encontrar turnos existentes con cualquier estado
      limit: 10 // Aumentar para ver todos los resultados
    });
    
    const operativos = result?.data || result || [];
    console.log("📋 Operativos encontrados:", operativos.length, operativos);
    
    if (operativos.length > 0) {
      const operativo = operativos[0];
      console.log("✅ Operativo seleccionado:", operativo);
      return operativo;
    }
    
    console.log("❌ No se encontraron operativos");
    return null;
  } catch (error) {
    console.error("Error buscando operativo de turno:", error);
    throw error;
  }
}

/**
 * Crea un nuevo operativo de turno si no existe
 * @param {string} fecha - Fecha en formato YYYY-MM-DD
 * @param {string} turno - Turno: "MAÑANA" | "TARDE" | "NOCHE"
 * @param {number} sector_id - ID del sector
 * @param {number} operador_id - ID del operador
 * @param {number} [supervisor_id] - ID del supervisor (requerido por backend)
 * @returns {Promise<Object>} Operativo creado o existente
 */
export async function findOrCreateOperativoTurno(fecha, turno, sector_id, operador_id, supervisor_id = null) {
  try {
    console.log("🚀 findOrCreateOperativoTurno llamado con:", { 
      fecha, 
      turno, 
      sector_id, 
      operador_id, 
      supervisor_id 
    });
    
    // Primero buscar si ya existe
    const existente = await findOperativoTurnoByParams(fecha, turno, sector_id);
    if (existente) {
      console.log("✅ Usando operativo existente:", existente);
      return existente;
    }

    console.log("🆕 Creando nuevo operativo...");
    // Si no existe, crearlo
    const payload = {
      operador_id,
      sector_id,
      fecha,
      turno,
      // No enviar estado para que use el default del backend
      fecha_hora_inicio: new Date().toISOString()
    };

    // Solo agregar supervisor_id si tiene un valor válido
    if (supervisor_id) {
      payload.supervisor_id = supervisor_id;
    }

    console.log("📤 Payload para crear operativo:", payload);
    const nuevoOperativo = await createOperativosTurno(payload);
    console.log("✅ Nuevo operativo creado:", nuevoOperativo);

    return nuevoOperativo;
  } catch (error) {
    // Si es error 409 (turno duplicado), buscar nuevamente y retornar el existente
    if (error.response?.status === 409 && error.response?.data?.code === "DUPLICATE_TURNO") {
      console.log("🔄 Turno duplicado detectado, buscando existente...");
      try {
        const existente = await findOperativoTurnoByParams(fecha, turno, sector_id);
        if (existente) {
          console.log("✅ Usando operativo existente después de duplicado:", existente);
          return existente;
        }
      } catch (searchError) {
        console.error("Error buscando turno duplicado:", searchError);
      }
    }
    
    console.error("Error creando operativo de turno:", error);
    throw error;
  }
}

/**
 * Obtiene vehículos disponibles para asignación
 * @returns {Promise<Array>} Lista de vehículos disponibles
 */
export async function getVehiculosDisponiblesParaDespacho() {
  try {
    const vehiculos = await listVehiculosDisponibles();
    return Array.isArray(vehiculos) ? vehiculos : [];
  } catch (error) {
    console.error("Error obteniendo vehículos disponibles:", error);
    // Si hay error, retornar array vacío para que cargue todos los vehículos
    return [];
  }
}

/**
 * Crea un vehículo operativo en un turno
 * @param {number} turnoId - ID del turno operativo
 * @param {number} vehiculo_id - ID del vehículo
 * @param {number} [kilometraje_inicio] - Kilometraje inicial (opcional)
 * @returns {Promise<Object>} Vehículo operativo creado
 */
export async function createVehiculoEnTurno(turnoId, vehiculo_id, kilometraje_inicio = 0) {
  try {
    const payload = {
      vehiculo_id,
      estado_operativo_id: 1, // OPERATIVO ACTIVO
      kilometraje_inicio: kilometraje_inicio || 0,
      hora_inicio: new Date().toISOString(),
      nivel_combustible_inicio: "LLENO"
    };

    const vehiculoOperativo = await createVehiculoOperativo(turnoId, payload);
    
    // Asegurarse de retornar el objeto con el ID correcto
    const resultado = vehiculoOperativo?.data || vehiculoOperativo;
    
    return resultado;
  } catch (error) {
    console.error("Error creando vehículo en turno:", error);
    throw error;
  }
}

/**
 * Busca el ID del vehículo operativo asignado a un turno
 * @param {number} operativo_turno_id - ID del turno operativo
 * @param {number} vehiculo_id - ID del vehículo
 * @returns {Promise<number|null>} ID del vehículo operativo o null si no existe
 */
export async function findVehiculoOperativoId(operativo_turno_id, vehiculo_id) {
  try {
    const result = await listVehiculosByTurno(operativo_turno_id);
    const vehiculos = result?.data || result || [];
    
    // Buscar el vehículo operativo que corresponde al vehiculo_id
    const vehiculoOperativo = vehiculos.find(v => 
      v.operativo_turno_id === Number(operativo_turno_id) && 
      v.vehiculo_id === Number(vehiculo_id)
    );
    
    if (vehiculoOperativo) {
      console.log("✅ Vehículo operativo encontrado:", vehiculoOperativo);
      return vehiculoOperativo.id; // ID del registro en operativos_vehiculos
    }
    
    console.log("❌ Vehículo operativo no encontrado para operativo_turno_id:", operativo_turno_id, "y vehiculo_id:", vehiculo_id);
    return null;
  } catch (error) {
    console.error("Error buscando vehículo operativo:", error);
    return null;
  }
}

/**
 * Busca si existe un cuadrante asignado a un vehículo operativo
 * @param {number} operativo_vehiculo_id - ID del vehículo operativo
 * @param {number} cuadrante_id - ID del cuadrante
 * @returns {Promise<Object|null>} Registro encontrado o null si no existe
 */
export async function findCuadranteAsignadoVehiculo(operativo_vehiculo_id, cuadrante_id, turnoId) {
  try {
    console.log("🔍 findCuadranteAsignadoVehiculo llamado con:", {
      operativo_vehiculo_id,
      cuadrante_id,
      turnoId,
      tipo_operativo_vehiculo_id: typeof operativo_vehiculo_id,
      tipo_cuadrante_id: typeof cuadrante_id
    });
    
    // Corregir endpoint: usar /operativos/{turnoId}/vehiculos/{operativo_vehiculo_id}/cuadrantes
    const response = await api.get(`/operativos/${turnoId}/vehiculos/${operativo_vehiculo_id}/cuadrantes`);
    const cuadrantes = response.data?.data || response.data || [];
    
    console.log("📋 Cuadrantes encontrados para vehículo operativo:", cuadrantes);
    
    // Buscar el cuadrante específico
    const cuadranteAsignado = cuadrantes.find(c => 
      c.operativo_vehiculo_id === Number(operativo_vehiculo_id) && 
      c.cuadrante_id === Number(cuadrante_id)
    );
    
    if (cuadranteAsignado) {
      console.log("✅ Cuadrante asignado encontrado:", cuadranteAsignado);
      return cuadranteAsignado;
    }
    
    console.log("❌ Cuadrante no asignado para operativo_vehiculo_id:", operativo_vehiculo_id, "y cuadrante_id:", cuadrante_id);
    return null;
  } catch (error) {
    console.error("Error buscando cuadrante asignado:", error);
    return null;
  }
}

/**
 * Asigna cuadrantes a un vehículo operativo
 * @param {number} turnoId - ID del turno operativo
 * @param {number} vehiculoOperativoId - ID del vehículo operativo
 * @param {number} cuadrante_id - ID del cuadrante
 * @returns {Promise<Object>} Resultado de la asignación
 */
export async function asignarCuadranteAVehiculo(turnoId, vehiculoOperativoId, cuadrante_id) {
  try {
    const response = await api.post(
      `/operativos/${turnoId}/vehiculos/${vehiculoOperativoId}/cuadrantes`,
      { cuadrante_id }
    );
    
    // Asegurarse de retornar el objeto con el ID correcto
    const resultado = response.data?.data || response.data;
    
    return resultado;
  } catch (error) {
    console.error("Error asignando cuadrante a vehículo:", error);
    throw error;
  }
}

/**
 * Asigna una novedad a un vehículo operativo en un cuadrante
 * @param {number} turnoId - ID del turno operativo
 * @param {number} vehiculoOperativoId - ID del vehículo operativo
 * @param {number} cuadrante_id - ID del cuadrante
 * @param {number} operativo_vehiculo_cuadrante_id - ID del registro en operativos_vehiculos_cuadrantes
 * @param {Object} novedadData - Datos de la novedad
 * @returns {Promise<Object>} Novedad asignada
 */
export async function asignarNovedadAVehiculo(turnoId, vehiculoOperativoId, cuadrante_id, operativo_vehiculo_cuadrante_id, novedadData) {
  try {
    // Corregir payload según especificación del backend
    const payload = {
      novedad_id: novedadData.novedad_id,
      operativo_vehiculo_cuadrante_id: operativo_vehiculo_cuadrante_id, // ID del registro en operativos_vehiculos_cuadrantes
      // No enviar 'estado' - es para soft-delete
      prioridad: novedadData.prioridad_actual || "MEDIA", // fallback a MEDIA
      resultado: "PENDIENTE", // ENUM: PENDIENTE
      fecha_despacho: novedadData.fecha_despacho,
      observaciones: novedadData.observaciones
    };
    
    // Corregir endpoint: usar operativo_vehiculo_cuadrante_id en lugar de cuadrante_id
    const response = await api.post(
      `/operativos/${turnoId}/vehiculos/${vehiculoOperativoId}/cuadrantes/${operativo_vehiculo_cuadrante_id}/novedades`,
      payload
    );
    
    return response.data;
  } catch (error) {
    console.error("Error asignando novedad a vehículo:", error);
    throw error;
  }
}

/**
 * Formatea errores del backend para mostrar con toast.error
 * @param {Object} error - Error de la respuesta del backend
 * @returns {Array} Array de mensajes de error formateados
 */
export function formatearErroresBackend(error) {
  const data = error?.response?.data;
  
  if (!data) {
    return [error?.message || "Error desconocido"];
  }

  // Si el backend ya envía un mensaje apropiado, usarlo directamente
  if (data.message) return [data.message];
  if (data.error) return [data.error];
  if (data.msg) return [data.msg];

  // Manejar arrays de errores de validación
  if (data.errors && Array.isArray(data.errors)) {
    return data.errors.map((e) => {
      const field = e.path || e.param || e.field || "";
      const msg = e.msg || e.message || "";
      return field ? `${field}: ${msg}` : msg;
    });
  }

  // Manejar objeto de errores por campo
  if (data.errors && typeof data.errors === 'object') {
    return Object.entries(data.errors).map(([campo, mensajes]) => {
      const msg = Array.isArray(mensajes) ? mensajes.join(', ') : mensajes;
      return `${campo}: ${msg}`;
    });
  }

  return ["Error de validación"];
}

/**
 * Muestra errores específicos del backend usando toast.error
 * @param {Object} error - Error de la respuesta del backend
 * @param {string} mensajeDefault - Mensaje por defecto
 */
export function mostrarErroresEspecificos(error, mensajeDefault = "Error en la operación") {
  try {
    const errores = formatearErroresBackend(error);
    
    // Mostrar cada error por separado
    errores.forEach((mensaje, index) => {
      // Usar setTimeout para evitar que los toast se sobreescriban
      setTimeout(() => {
        toast.error(mensaje);
      }, index * 100);
    });
  } catch (e) {
    console.error("Error mostrando errores:", e);
    toast.error(mensajeDefault);
  }
}
