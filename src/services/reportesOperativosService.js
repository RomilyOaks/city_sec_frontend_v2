/**
 * File: src/services/reportesOperativosService.js
 * @version 1.0.0
 * @description Servicio para generar reportes de operativos de patrullaje
 */

import api from "./api.js";
import { listNovedades } from "./novedadesService.js";

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

          // Para cada cuadrante, obtener novedades completas
          const cuadrantesConNovedades = [];
          for (const cuad of cuadrantes) {
            let novedadesData = [];
            try {
              const novResp = await api.get(
                `/operativos/${turnoOp.id}/vehiculos/${veh.id}/cuadrantes/${cuad.id}/novedades`
              );
              const raw = novResp.data?.data?.items ?? novResp.data?.data ?? novResp.data ?? [];
              novedadesData = Array.isArray(raw) ? raw : [];
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
              novedades_count: novedadesData.length,
              novedades: novedadesData, // ← datos completos para hoja Excel
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

          // Para cada cuadrante, obtener novedades completas
          const cuadrantesConNovedades = [];
          for (const cuad of cuadrantes) {
            let novedadesData = [];
            try {
              const novResp = await api.get(
                `/operativos/${turnoOp.id}/personal/${pers.id}/cuadrantes/${cuad.id}/novedades`
              );
              const raw = novResp.data?.data?.items ?? novResp.data?.data ?? novResp.data ?? [];
              novedadesData = Array.isArray(raw) ? raw : [];
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
              novedades_count: novedadesData.length,
              novedades: novedadesData, // ← datos completos para hoja Excel
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
  // DISTINCT: evitar duplicados cuando la misma novedad aparece en varios cuadrantes/recursos
  const seenNovedad = new Set();

  // Procesar novedades desde la estructura de turnos
  for (const turnoInfo of reporteData) {
    for (const recurso of turnoInfo.recursos) {
      if (recurso.cuadrantes && recurso.cuadrantes.length > 0) {
        for (const cuadrante of recurso.cuadrantes) {
          if (cuadrante.novedades && cuadrante.novedades.length > 0) {
            for (const nov of cuadrante.novedades) {
              // Alias reales de Sequelize según backend (confirmados 2026-05-22)
              const novedadRef = nov.novedad || {};
              const uid = nov.novedad_id || nov.id;
              if (uid && seenNovedad.has(uid)) continue;
              if (uid) seenNovedad.add(uid);

              allNovedades.push({
                // Identificación
                novedad_id:       uid,
                codigo_novedad:   novedadRef.novedad_code || "-",
                // Estado (columna C en Excel)
                estado_novedad:   novedadRef.novedadEstado?.nombre || "-",
                // Fechas — usar fecha real de ocurrencia (no nov.reportado que es la fecha del registro de patrullaje)
                fecha_ocurrencia: novedadRef.fecha_hora_ocurrencia || nov.reportado || null,
                // fecha_despacho: campo en DB pero backend aún no lo incluye en Sequelize attributes
                fecha_despacho:   novedadRef.fecha_despacho || nov.atendido || null,
                origen_llamada:   novedadRef.origen_llamada || "-",
                fecha_llegada:    novedadRef.fecha_llegada || null,
                // Clasificación (alias Sequelize reales del backend)
                tipo_novedad:     novedadRef.novedadTipoNovedad?.nombre || "-",
                subtipo_novedad:  novedadRef.novedadSubtipoNovedad?.nombre || "-",
                // Descripción y ubicación
                descripcion:      novedadRef.descripcion || nov.observaciones || "-",
                direccion:        novedadRef.localizacion || "-",
                referencia:       novedadRef.referencia_ubicacion || "-",
                latitud:          novedadRef.latitud ?? null,
                longitud:         novedadRef.longitud ?? null,
                // Resultado
                prioridad:        nov.prioridad || novedadRef.prioridad_actual || "-",
                resultado:        nov.resultado || "PENDIENTE",
                obs_atencion:     novedadRef.observaciones || nov.observaciones || "-",
                // Reportante
                reportante_nombre:   novedadRef.reportante_nombre || "-",
                reportante_telefono: novedadRef.reportante_telefono || "-",
                // Contexto operativo
                turno:            turnoInfo.turno,
                sector:           turnoInfo.sector,
                operador:         turnoInfo.operador,
                supervisor:       turnoInfo.supervisor,
                tipo_recurso:     recurso.tipo === "VEHICULO" ? "Vehículo" : "Personal a Pie",
                recurso_nombre:   recurso.tipo === "VEHICULO"
                  ? (recurso.placa || recurso.codigo_vehiculo || "-")
                  : (recurso.personal_nombre || "-"),
                // Cuadrante
                cuadrante_codigo: cuadrante.cuadrante_code || "-",
                cuadrante_nombre: cuadrante.cuadrante_nombre || "-",
                hora_ingreso:     cuadrante.hora_ingreso || null,
                hora_salida:      cuadrante.hora_salida || null,
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

  // Obtener novedades PENDIENTE directamente desde /novedades (no pasan por cuadrante).
  // limit máximo permitido por el backend: 100. Se filtra adicionalmente client-side
  // por fecha_hora_ocurrencia para manejar el desfase UTC vs hora Peru.
  let novedadesPendientes = [];
  try {
    const pendienteResp = await listNovedades({
      estado_novedad_id: 1, // PENDIENTE
      fecha_inicio,
      fecha_fin,
      limit: 100,
      sort: "fecha_hora_ocurrencia",
      order: "asc",
    });
    const rawPendientes = (pendienteResp.novedades || []).filter(n => {
      if (!n.fecha_hora_ocurrencia) return true;
      const fechaNov = new Date(n.fecha_hora_ocurrencia).toISOString().split("T")[0];
      if (fecha_inicio && fechaNov < fecha_inicio) return false;
      if (fecha_fin   && fechaNov > fecha_fin)     return false;
      return true;
    });
    novedadesPendientes = rawPendientes.map(n => ({
      novedad_id:          n.id,
      codigo_novedad:      n.novedad_code || "-",
      estado_novedad:      n.novedadEstado?.nombre || "PENDIENTE",
      fecha_ocurrencia:    n.fecha_hora_ocurrencia || null,
      fecha_despacho:      n.fecha_despacho || null,
      origen_llamada:      n.origen_llamada || "-",
      fecha_llegada:       n.fecha_llegada || null,
      tipo_novedad:        n.novedadTipoNovedad?.nombre || "-",
      subtipo_novedad:     n.novedadSubtipoNovedad?.nombre || "-",
      descripcion:         n.descripcion || "-",
      direccion:           n.localizacion || "-",
      referencia:          n.referencia_ubicacion || "-",
      latitud:             n.latitud ?? null,
      longitud:            n.longitud ?? null,
      prioridad:           n.prioridad_actual || "-",
      resultado:           "-",
      obs_atencion:        n.observaciones || "-",
      reportante_nombre:   n.reportante_nombre || "-",
      reportante_telefono: n.reportante_telefono || "-",
      // Sin asignación operativa (aún no despachadas)
      turno:            "-",
      sector:           "-",
      operador:         "-",
      supervisor:       "-",
      tipo_recurso:     "-",
      recurso_nombre:   "-",
      cuadrante_codigo: "-",
      cuadrante_nombre: "-",
      hora_ingreso:     null,
      hora_salida:      null,
    }));
    console.log("Novedades PENDIENTE obtenidas:", novedadesPendientes.length);
  } catch (err) {
    console.warn("No se pudieron obtener novedades pendientes:", err.message);
  }

  // Turnos únicos = combinaciones distintas (fecha, turno) — no contar registros de operativo
  const turnosUnicosSet = new Set(reporteData.map(t => `${t.fecha}_${t.turno}`));

  // Recursos únicos = vehículos por placa + personal por nombre (igual que UNION en SQL)
  const recursosUnicosSet = new Set();
  for (const t of reporteData) {
    for (const r of t.recursos) {
      recursosUnicosSet.add(
        r.tipo === "VEHICULO" ? `V_${r.placa}` : `P_${r.personal_nombre}`
      );
    }
  }

  const resultado = {
    filtros: params,
    generado_en: new Date().toISOString(),
    total_turnos: turnosUnicosSet.size,
    total_recursos: recursosUnicosSet.size,
    total_cuadrantes: reporteData.reduce(
      (sum, t) => sum + t.recursos.reduce((s, r) => s + r.total_cuadrantes, 0),
      0
    ),
    total_novedades: reporteData.reduce(
      (sum, t) => sum + t.recursos.reduce((s, r) => s + r.total_novedades, 0),
      0
    ),
    data: reporteData,
    turnos: turnosOriginales,
    novedades: novedadesFiltradas,
    novedades_pendientes: novedadesPendientes,
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
