import api from "../services/api";

/**
 * Cache para el ubigeo por defecto
 */
let cachedUbigeo = null;

/**
 * Obtiene el ubigeo por defecto desde el backend
 * Usa caché para evitar llamadas repetidas al servidor
 *
 * @returns {Promise<Object>} Objeto con información del ubigeo default
 * @property {string} code - Código UBIGEO completo (ej: "150101")
 * @property {string} departamento - Nombre del departamento
 * @property {string} provincia - Nombre de la provincia
 * @property {string} distrito - Nombre del distrito
 * @property {string} departamento_code - Código del departamento (ej: "15")
 * @property {string} provincia_code - Código de la provincia (ej: "01")
 * @property {string} distrito_code - Código del distrito (ej: "01")
 */
export async function getDefaultUbigeo() {
  // Si ya tenemos el valor en cache, retornarlo
  if (cachedUbigeo) {
    return cachedUbigeo;
  }

  try {
    const response = await api.get("/config/ubigeo-default");

    if (response.data && response.data.success && response.data.data) {
      cachedUbigeo = response.data.data;
      return cachedUbigeo;
    }

    // Si el response no tiene la estructura esperada, usar fallback
    throw new Error("Estructura de respuesta inesperada");
  } catch (error) {
    console.warn("Error al obtener ubigeo default desde backend, usando fallback:", error.message);

    // Fallback hardcoded (Arequipa - Arequipa - Arequipa)
    const fallback = {
      code: "150101",
      departamento: "Arequipa",
      provincia: "Arequipa",
      distrito: "Arequipa",
      departamento_code: "15",
      provincia_code: "01",
      distrito_code: "01",
    };

    cachedUbigeo = fallback;
    return fallback;
  }
}

/**
 * Limpia el caché del ubigeo default
 * Útil para forzar una recarga desde el servidor
 */
export function clearUbigeoCache() {
  cachedUbigeo = null;
}
