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

  console.log("=== DEBUGGING BUILD REPORTE DATA ===");
  console.log("Parámetros recibidos:", params);
  console.log("fecha_inicio:", fecha_inicio);
  console.log("fecha_fin:", fecha_fin);
  console.log("turno:", turno);
  console.log("sector_id:", sector_id);
  console.log("tipo_recurso:", tipo_recurso);

  // 1. Obtener turnos operativos en el rango de fechas
  const queryParams = new URLSearchParams();
  queryParams.append("limit", "1000");
  if (fecha_inicio) queryParams.append("fecha_inicio", fecha_inicio);
  if (fecha_fin) queryParams.append("fecha_fin", fecha_fin);
  if (turno && turno !== "todos") queryParams.append("turno", turno);
  if (sector_id && sector_id !== "todos") queryParams.append("sector_id", sector_id);

  const queryString = queryParams.toString();
  console.log("Query string enviada al backend:", queryString);
  console.log("URL completa:", `/operativos?${queryString}`);

  const turnosResponse = await api.get(`/operativos?${queryString}`);
  const turnosData = turnosResponse.data?.data?.items || turnosResponse.data?.data || turnosResponse.data || [];
  
  console.log("Respuesta del backend (cruda):", turnosResponse.data);
  console.log("Turnos data extraída:", turnosData);
  console.log("Cantidad de turnos recibidos:", turnosData.length);

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
            tipo_vehiculo: veh.vehiculo?.tipoVehiculo?.nombre || "-",
            tipo_vehiculo_id: veh.vehiculo?.tipoVehiculo?.id || veh.vehiculo?.tipo_vehiculo_id,
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

  // Extraer datos originales de turnos para la pestaña Sectores
  const turnosOriginales = turnosData.map(turno => ({
    id: turno.id,
    fecha: turno.fecha,
    turno: turno.turno,
    sector: turno.sector?.nombre || turno.sector_nombre || "-",
    operador: turno.operador
      ? `${turno.operador.nombres || ""} ${turno.operador.apellido_paterno || ""}`.trim()
      : "-",
    supervisor: turno.supervisor
      ? `${turno.supervisor.nombres || ""} ${turno.supervisor.apellido_paterno || ""}`.trim()
      : "-",
    fecha_hora_inicio: turno.fecha_hora_inicio,
    fecha_hora_fin: turno.fecha_hora_fin,
    estado: turno.estado,
    observaciones: turno.observaciones,
    operador_id: turno.operador_id,
    sector_id: turno.sector_id,
    supervisor_id: turno.supervisor_id
  }));

  // NOTA: El backend debe incorporar las novedades en la estructura de datos de los turnos
  // Las novedades deben venir dentro de cada cuadrante en: recurso.cuadrantes[].novedades[]
  // Por ahora, dejamos el array vacío hasta que backend implemente esta funcionalidad
  
  console.log("=== ESPERANDO NOVEDADES DESDE BACKEND ===");
  console.log("El backend debe incorporar novedades en la estructura de cuadrantes");
  console.log("Estructura esperada: recurso.cuadrantes[].novedades[]");
  
  const allNovedades = [];
  
  // Procesar novedades desde la estructura de turnos (cuando backend las incorpore)
  for (const turnoInfo of reporteData) {
    console.log("Procesando turnoInfo para novedades:", turnoInfo.turno_id, "-", turnoInfo.turno);
    
    for (const recurso of turnoInfo.recursos) {
      if (recurso.cuadrantes && recurso.cuadrantes.length > 0) {
        for (const cuadrante of recurso.cuadrantes) {
          // Cuando backend incorpore novedades, vendrán en: cuadrante.novedades
          if (cuadrante.novedades && cuadrante.novedades.length > 0) {
            for (const novedad of cuadrante.novedades) {
              allNovedades.push({
                fecha_ocurrencia: novedad.fecha_hora_ocurrencia || novedad.fecha_ocurrencia || turnoInfo.fecha,
                turno: turnoInfo.turno,
                sector: turnoInfo.sector,
                operador: turnoInfo.operador,
                supervisor: turnoInfo.supervisor,
                tipo_recurso: recurso.tipo,
                recurso_nombre: recurso.personal_nombre || recurso.vehiculo_placa || "-",
                cuadrante_codigo: cuadrante.cuadrante_code || cuadrante.codigo || "-",
                cuadrante_nombre: cuadrante.cuadrante_nombre || cuadrante.nombre || "-",
                tipo_novedad: novedad.tipo_novedad?.nombre || novedad.tipo_novedad || "-",
                descripcion: novedad.descripcion || novedad.detalle || "-",
                hora_ingreso: cuadrante.hora_ingreso,
                hora_salida: cuadrante.hora_salida,
                estado: novedad.estado || "REPORTADA",
                novedad_id: novedad.id
              });
            }
          }
        }
      }
    }
  }
  
  console.log("Total de novedades encontradas (desde backend):", allNovedades.length);
  
  // Filtrar novedades por rango de fechas si se especifica
  let novedadesFiltradas = allNovedades;
  if (fecha_inicio || fecha_fin) {
    console.log("Aplicando filtro de fechas a novedades del backend:");
    console.log("fecha_inicio:", fecha_inicio);
    console.log("fecha_fin:", fecha_fin);
    
    novedadesFiltradas = allNovedades.filter(nov => {
      if (!nov.fecha_ocurrencia) return false;
      const fechaNov = new Date(nov.fecha_ocurrencia).toISOString().split('T')[0];
      if (fecha_inicio && fechaNov < fecha_inicio) return false;
      if (fecha_fin && fechaNov > fecha_fin) return false;
      return true;
    });
    console.log("Novedades después de filtrar por fecha:", novedadesFiltradas.length);
  }

  const resultado = {
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
    turnos: turnosOriginales, // Agregar turnos originales para pestaña Sectores
    novedades: novedadesFiltradas, // Agregar novedades para pestaña Novedades
  };

  console.log("=== DEBUGGING RETORNO FINAL ===");
  console.log("total_turnos:", resultado.total_turnos);
  console.log("total_recursos:", resultado.total_recursos);
  console.log("total_cuadrantes:", resultado.total_cuadrantes);
  console.log("total_novedades:", resultado.total_novedades);
  console.log("turnos.length:", resultado.turnos?.length || 0);
  console.log("novedades.length:", resultado.novedades?.length || 0);
  console.log("Estructura completa del resultado:", resultado);

  return resultado;
}

export default {
  getReporteOperativos,
  getTurnosParaReporte,
  buildReporteData,
};
