/**
 * File: src/services/reportesOperativosService.js
 * @version 1.0.0
 * @description Servicio para generar reportes de operativos de patrullaje
 */

import api from "./api.js";

/**
 * Obtiene datos para el reporte de operativos
 * @param {Object} params - Parámetros de filtro
 * @param {string} params.fecha_inicio - Fecha inicio (YYYY-MM-DD)
 * @param {string} params.fecha_fin - Fecha fin (YYYY-MM-DD)
 * @param {number|string} params.turno - Turno específico o "todos"
 * @param {number|string} params.sector_id - Sector específico o "todos"
 * @param {string} params.tipo_recurso - "VEHICULO", "PERSONAL" o "todos"
 * @returns {Promise<Object>} Datos del reporte
 */
export async function getReporteOperativos(params) {
  const queryParams = new URLSearchParams();

  if (params.fecha_inicio) queryParams.append("fecha_inicio", params.fecha_inicio);
  if (params.fecha_fin) queryParams.append("fecha_fin", params.fecha_fin);
  if (params.turno && params.turno !== "todos") queryParams.append("turno", params.turno);
  if (params.sector_id && params.sector_id !== "todos") queryParams.append("sector_id", params.sector_id);
  if (params.tipo_recurso && params.tipo_recurso !== "todos") queryParams.append("tipo_recurso", params.tipo_recurso);

  const response = await api.get(`/operativos/reportes?${queryParams.toString()}`);
  return response.data?.data || response.data || [];
}

/**
 * Obtiene lista de turnos para el dropdown del reporte
 * @returns {Promise<Array>} Lista de turnos únicos
 */
export async function getTurnosParaReporte() {
  try {
    const response = await api.get("/operativos?limit=1000");
    const turnos = response.data?.data?.items || response.data?.data || response.data || [];

    // Extraer turnos únicos
    const turnosUnicos = [...new Set(turnos.map(t => t.turno))].filter(Boolean);
    return turnosUnicos.map(t => ({ value: t, label: t }));
  } catch (error) {
    console.error("Error obteniendo turnos para reporte:", error);
    return [
      { value: "MAÑANA", label: "Mañana" },
      { value: "TARDE", label: "Tarde" },
      { value: "NOCHE", label: "Noche" },
    ];
  }
}

/**
 * Construye los datos del reporte desde múltiples endpoints
 * @param {Object} params - Parámetros de filtro
 * @returns {Promise<Object>} Datos consolidados del reporte
 */
export async function buildReporteData(params) {
  const { fecha_inicio, fecha_fin, turno, sector_id, tipo_recurso } = params;

  // 1. Obtener turnos operativos en el rango de fechas
  const queryParams = new URLSearchParams();
  queryParams.append("limit", "1000");
  if (fecha_inicio) queryParams.append("fecha_inicio", fecha_inicio);
  if (fecha_fin) queryParams.append("fecha_fin", fecha_fin);
  if (turno && turno !== "todos") queryParams.append("turno", turno);
  if (sector_id && sector_id !== "todos") queryParams.append("sector_id", sector_id);

  const turnosResponse = await api.get(`/operativos?${queryParams.toString()}`);
  const turnosData = turnosResponse.data?.data?.items || turnosResponse.data?.data || turnosResponse.data || [];

  // 2. Para cada turno, obtener vehículos y/o personal según tipo_recurso
  const reporteData = [];

  for (const turnoOp of turnosData) {
    const turnoInfo = {
      turno_id: turnoOp.id,
      fecha: turnoOp.fecha,
      turno: turnoOp.turno,
      sector: turnoOp.sector?.nombre || turnoOp.sector_nombre || "-",
      sector_id: turnoOp.sector_id,
      operador: turnoOp.operador
        ? `${turnoOp.operador.nombres || ""} ${turnoOp.operador.apellido_paterno || ""}`.trim()
        : "-",
      supervisor: turnoOp.supervisor
        ? `${turnoOp.supervisor.nombres || ""} ${turnoOp.supervisor.apellido_paterno || ""}`.trim()
        : "-",
      recursos: [],
    };

    // Obtener vehículos si corresponde
    if (tipo_recurso === "todos" || tipo_recurso === "VEHICULO") {
      try {
        const vehiculosResp = await api.get(`/operativos/${turnoOp.id}/vehiculos`);
        const vehiculos = vehiculosResp.data?.data || vehiculosResp.data || [];

        for (const veh of vehiculos) {
          // Obtener cuadrantes del vehículo
          let cuadrantes = [];
          try {
            const cuadResp = await api.get(`/operativos/${turnoOp.id}/vehiculos/${veh.id}/cuadrantes`);
            cuadrantes = cuadResp.data?.data || cuadResp.data || [];
          } catch {
            console.warn(`No se pudieron obtener cuadrantes para vehículo ${veh.id}`);
          }

          // Para cada cuadrante, contar novedades
          const cuadrantesConNovedades = [];
          for (const cuad of cuadrantes) {
            let novedadesCount = 0;
            try {
              const novResp = await api.get(
                `/operativos/${turnoOp.id}/vehiculos/${veh.id}/cuadrantes/${cuad.id}/novedades`
              );
              const novedades = novResp.data?.data || novResp.data || [];
              novedadesCount = Array.isArray(novedades) ? novedades.length : 0;
            } catch {
              // Sin novedades
            }

            cuadrantesConNovedades.push({
              cuadrante_id: cuad.cuadrante_id || cuad.id,
              cuadrante_code: cuad.datosCuadrante?.cuadrante_code || cuad.cuadrante?.cuadrante_code || "-",
              cuadrante_nombre: cuad.datosCuadrante?.nombre || cuad.cuadrante?.nombre || "-",
              hora_ingreso: cuad.hora_ingreso,
              hora_salida: cuad.hora_salida,
              tiempo_minutos: cuad.tiempo_minutos || 0,
              novedades_count: novedadesCount,
            });
          }

          turnoInfo.recursos.push({
            tipo: "VEHICULO",
            id: veh.id,
            // Datos del vehículo
            codigo_vehiculo: veh.vehiculo?.codigo_vehiculo || veh.vehiculo?.codigo || "-",
            placa: veh.vehiculo?.placa || "-",
            // Acceder a veh.vehiculo.tipo.nombre según la estructura del backend
            tipo_vehiculo: veh.vehiculo?.tipo?.nombre || veh.vehiculo?.tipo_vehiculo?.nombre || "-",
            tipo_vehiculo_id: veh.vehiculo?.tipo_id || veh.vehiculo?.tipo?.id || veh.vehiculo?.tipo_vehiculo_id,
            // Unidad/Oficina
            unidad_oficina: veh.vehiculo?.unidad?.nombre || "-",
            // SOAT
            soat: veh.vehiculo?.soat || "-",
            fec_soat: veh.vehiculo?.fec_soat || veh.vehiculo?.fecha_vencimiento_soat || null,
            // Conductor y copiloto
            conductor: veh.conductor
              ? `${veh.conductor.nombres || ""} ${veh.conductor.apellido_paterno || ""}`.trim()
              : "-",
            copiloto: veh.copiloto
              ? `${veh.copiloto.nombres || ""} ${veh.copiloto.apellido_paterno || ""}`.trim()
              : "-",
            tipo_copiloto: veh.tipoCopiloto?.descripcion || veh.tipo_copiloto?.descripcion || "-",
            // Radio TETRA
            radio_tetra_code: veh.radioTetra?.codigo || veh.radio_tetra?.codigo || "-",
            // Estado operativo
            estado_operativo: veh.estadoOperativoRecurso?.descripcion || veh.estado_operativo?.descripcion || "-",
            // Kilometraje y combustible
            kilometraje_inicio: veh.kilometraje_inicio,
            hora_inicio: veh.fecha_hora_inicio || veh.hora_inicio,
            kilometraje_recarga: veh.kilometraje_recarga,
            hora_recarga: veh.fecha_hora_recarga || veh.hora_recarga,
            combustible_litros: veh.combustible_litros,
            importe_recarga: veh.importe_recarga,
            nivel_combustible_recarga: veh.nivel_combustible_recarga || veh.nivel_combustible,
            kilometraje_fin: veh.kilometraje_fin,
            kilometros_recorridos: veh.kilometros_recorridos,
            // Observaciones
            observaciones: veh.observaciones || "-",
            // Cuadrantes
            cuadrantes: cuadrantesConNovedades,
            total_cuadrantes: cuadrantesConNovedades.length,
            total_novedades: cuadrantesConNovedades.reduce((sum, c) => sum + c.novedades_count, 0),
          });
        }
      } catch {
        console.warn(`No se pudieron obtener vehículos para turno ${turnoOp.id}`);
      }
    }

    // Obtener personal a pie si corresponde
    if (tipo_recurso === "todos" || tipo_recurso === "PERSONAL") {
      try {
        const personalResp = await api.get(`/operativos/${turnoOp.id}/personal`);
        const personal = personalResp.data?.data?.items || personalResp.data?.data || personalResp.data || [];

        for (const pers of personal) {
          // Obtener cuadrantes del personal
          let cuadrantes = [];
          try {
            const cuadResp = await api.get(`/operativos/${turnoOp.id}/personal/${pers.id}/cuadrantes`);
            cuadrantes = cuadResp.data?.data || cuadResp.data || [];
          } catch {
            console.warn(`No se pudieron obtener cuadrantes para personal ${pers.id}`);
          }

          // Para cada cuadrante, contar novedades
          const cuadrantesConNovedades = [];
          for (const cuad of cuadrantes) {
            let novedadesCount = 0;
            try {
              const novResp = await api.get(
                `/operativos/${turnoOp.id}/personal/${pers.id}/cuadrantes/${cuad.id}/novedades`
              );
              const novedades = novResp.data?.data || novResp.data || [];
              novedadesCount = Array.isArray(novedades) ? novedades.length : 0;
            } catch {
              // Sin novedades
            }

            cuadrantesConNovedades.push({
              cuadrante_id: cuad.cuadrante_id || cuad.id,
              cuadrante_code: cuad.datosCuadrante?.cuadrante_code || cuad.cuadrante?.cuadrante_code || "-",
              cuadrante_nombre: cuad.datosCuadrante?.nombre || cuad.cuadrante?.nombre || "-",
              hora_ingreso: cuad.hora_ingreso,
              hora_salida: cuad.hora_salida,
              tiempo_minutos: cuad.tiempo_minutos || 0,
              novedades_count: novedadesCount,
            });
          }

          turnoInfo.recursos.push({
            tipo: "PERSONAL",
            id: pers.id,
            personal_nombre: pers.personal
              ? `${pers.personal.nombres || ""} ${pers.personal.apellido_paterno || ""}`.trim()
              : "-",
            tipo_patrullaje: pers.tipo_patrullaje || "-",
            cargo: pers.personal?.cargo?.nombre || "-",
            cuadrantes: cuadrantesConNovedades,
            total_cuadrantes: cuadrantesConNovedades.length,
            total_novedades: cuadrantesConNovedades.reduce((sum, c) => sum + c.novedades_count, 0),
          });
        }
      } catch {
        console.warn(`No se pudieron obtener personal para turno ${turnoOp.id}`);
      }
    }

    if (turnoInfo.recursos.length > 0) {
      reporteData.push(turnoInfo);
    }
  }

  return {
    filtros: params,
    generado_en: new Date().toISOString(),
    total_turnos: reporteData.length,
    total_recursos: reporteData.reduce((sum, t) => sum + t.recursos.length, 0),
    total_cuadrantes: reporteData.reduce(
      (sum, t) => sum + t.recursos.reduce((s, r) => s + r.total_cuadrantes, 0),
      0
    ),
    total_novedades: reporteData.reduce(
      (sum, t) => sum + t.recursos.reduce((s, r) => s + r.total_novedades, 0),
      0
    ),
    data: reporteData,
  };
}

export default {
  getReporteOperativos,
  getTurnosParaReporte,
  buildReporteData,
};
