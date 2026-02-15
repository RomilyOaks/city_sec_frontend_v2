/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\services\\catalogosService.js
 * @version 2.0.0
 * @description Servicios para catálogos y datos auxiliares: cargos, ubigeos, tipos y unidades.
 * Contiene helpers de consumo de endpoints que devuelven catálogos usados por formularios y filtros.
 * @module src/services/catalogosService.js
 */

import api from "./api";

/**
 * listCargos
 * Lista los cargos activos usados para asignaciones de personal.
 * @returns {Promise<Array>} Array de objetos cargo o arreglo vacío en caso de error.
 */
export async function listCargos() {
  const res = await api.get("/cargos?activos=true");
  const cargos =
    res?.data?.data?.cargos ||
    res?.data?.cargos ||
    res?.data?.data ||
    res?.data ||
    [];
  return cargos;
}

/**
 * Obtener departamentos
 */
export async function listDepartamentos() {
  const res = await api.get("/catalogos/departamentos");
  return res?.data?.data || res?.data || [];
}

/**
 * Buscar ubigeos
 */
export async function buscarUbigeo({ search, departamento, provincia } = {}) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (departamento) params.append("departamento", departamento);
  if (provincia) params.append("provincia", provincia);

  const res = await api.get(`/catalogos/ubigeo?${params.toString()}`);
  return res?.data?.data || res?.data || [];
}

/**
 * Obtener tipos de novedad
 */
export async function listTiposNovedad() {
  const res = await api.get("/catalogos/tipos-novedad");
  return res?.data?.data || res?.data || [];
}

/**
 * Obtener estados de novedad
 */
export async function listEstadosNovedad() {
  const res = await api.get("/catalogos/estados-novedad");
  return res?.data?.data || res?.data || [];
}

/**
 * Obtener tipos de vehículo
 */
export async function listTiposVehiculo() {
  try {
    const res = await api.get("/catalogos/tipos-vehiculo");
    // Backend devuelve { success: true, data: [...] }
    const tipos = res?.data?.data || res?.data || [];
    return Array.isArray(tipos) ? tipos : [];
  } catch (err) {
    console.error(
      "Error cargando tipos de vehículo:",
      err?.response?.data || err
    );
    return [];
  }
}

/**
 * Obtener unidades/oficinas
 */
export async function listUnidades() {
  try {
    const res = await api.get("/catalogos/unidades");
    const unidades =
      res?.data?.data?.unidades ||
      res?.data?.unidades ||
      res?.data?.data ||
      res?.data ||
      [];
    return Array.isArray(unidades) ? unidades : [];
  } catch (err) {
    console.error("Error cargando unidades:", err);
    return [];
  }
}
