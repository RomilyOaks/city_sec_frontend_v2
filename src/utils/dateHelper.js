/**
 * ============================================
 * HELPER: Manejo de Fechas con Timezone (Frontend)
 * ============================================
 *
 * Ruta: src/utils/dateHelper.js
 *
 * VERSIÓN: 1.0.0
 * FECHA: 2026-03-08
 *
 * Descripción:
 * Funciones helper para manejar fechas con timezone correcto en frontend.
 * Adaptado del backend para consistencia en el manejo de DATETIME/TIMESTAMP.
 * Resuelve problemas de timezone al enviar fechas al backend.
 *
 * PROBLEMA:
 * - toISOString() convierte fechas a UTC
 * - new Date() puede interpretar fechas incorrectamente
 * - Los campos DATETIME/TIMESTAMP se grababan con hora incorrecta
 *
 * SOLUCIÓN:
 * - Usar estas funciones en lugar de manipulación directa de fechas
 * - El timezone por defecto es "America/Lima" (UTC-5)
 * - Formato consistente con backend: "YYYY-MM-DD HH:mm:ss"
 */

// Timezone por defecto: intenta leer ambas variantes de env (.env.APP_TIMEZONE
// o VITE_APP_TIMEZONE), luego fallback a America/Lima.
const DEFAULT_TIMEZONE =
  import.meta.env.APP_TIMEZONE ||
  import.meta.env.VITE_APP_TIMEZONE ||
  "America/Lima";

/**
 * Formatea una fecha en la timezone configurada a "YYYY-MM-DD HH:mm:ss".
 * Usa Intl.DateTimeFormat con la zona configurada para evitar conversiones UTC
 * indeseadas cuando el navegador hace .toISOString().
 */
const formatInConfiguredTimezone = (dateObj) => {
  try {
    const tz = DEFAULT_TIMEZONE;
    // Formato 'en-CA' produce YYYY-MM-DD, combinamos con la hora.
    const formatted = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: tz,
    })
      .format(dateObj)
      .replace(",", "");

    // Asegurar separadores con guiones
    return formatted.replace(/\//g, "-").trim();
  } catch (err) {
    // Usar el error para evitar warning de variable no usada, pero no interrumpir flow
    void err;
    // Fallback robusto: asegurar timezone correcto incluso en error
    return dateObj
      .toLocaleString("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: DEFAULT_TIMEZONE,
      })
      .replace(",", "")
      .replace(/\//g, "-");
  }
};

/**
 * Formatea un Date a string "YYYY-MM-DD HH:mm:ss" en la timezone local.
 * Evita conversión a UTC que causa problemas en DATETIME/TIMESTAMP.
 *
 * @param {Date} dateObj - Fecha a formatear
 * @returns {string} "YYYY-MM-DD HH:mm:ss" en hora local
 */
export const formatDateTimeToString = (dateObj) => {
  // Usar la timezone configurada en DEFAULT_TIMEZONE para formatear la fecha.
  return formatInConfiguredTimezone(dateObj);
};

/**
 * Obtiene la fecha/hora actual en timezone local.
 * Retorna string "YYYY-MM-DD HH:mm:ss" para enviar al backend.
 *
 * @returns {string} Fecha actual en formato "YYYY-MM-DD HH:mm:ss"
 *
 * @example
 * // Retorna "2026-03-08 11:30:00" (hora Perú)
 * const ahora = getNowLocal();
 */
export const getNowLocal = () => {
  const now = new Date();
  return formatInConfiguredTimezone(now);
};

/**
 * Convierte una fecha a string "YYYY-MM-DD HH:mm:ss" en hora local.
 * - Si es string: normaliza al formato correcto
 * - Si es Date: convierte manteniendo timezone local
 * - Si es string de input datetime-local: convierte correctamente
 *
 * @param {Date|string} date - Fecha a convertir
 * @returns {string} Fecha en formato "YYYY-MM-DD HH:mm:ss" (hora local)
 *
 * @example
 * // Desde input datetime-local
 * convertToTimezone("2026-03-08T14:30") // "2026-03-08 14:30:00"
 *
 * // Desde Date object
 * convertToTimezone(new Date()) // "2026-03-08 11:30:00"
 *
 * // Desde string normalizado
 * convertToTimezone("2026-03-08 14:30:00") // "2026-03-08 14:30:00"
 */
export const convertToTimezone = (date) => {
  if (!date) return null;

  if (typeof date === "string") {
    // Validar que no sea "Invalid Date"
    if (date === "Invalid Date" || date === "null" || date === "undefined") {
      return getNowLocal(); // Fallback a fecha actual
    }

    // Si es formato datetime-local (YYYY-MM-DDTHH:mm)
    if (
      date.includes("T") &&
      !date.includes("Z") &&
      !/[+-]\d{2}:\d{2}$/.test(date)
    ) {
      // Parsear directamente sin conversión UTC
      const [datePart, timePart] = date.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute] = timePart.split(":").map(Number);

      // Validar que los componentes sean válidos
      if (
        isNaN(year) ||
        isNaN(month) ||
        isNaN(day) ||
        isNaN(hour) ||
        isNaN(minute)
      ) {
        return getNowLocal(); // Fallback si hay componentes inválidos
      }

      // Crear fecha local sin conversión UTC
      const dateObj = new Date(year, month - 1, day, hour, minute, 0, 0);

      // Validar que la fecha creada sea válida
      if (isNaN(dateObj.getTime())) {
        return getNowLocal(); // Fallback si la fecha es inválida
      }

      return formatDateTimeToString(dateObj);
    }

    // Si ya está en formato correcto, normalizar
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(date)) {
      return date;
    }

    // Si tiene formato YYYY-MM-DD HH:mm (sin segundos)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(date)) {
      return date + ":00";
    }

    // Para otros formatos, intentar crear Date y validar
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return getNowLocal(); // Fallback si la fecha es inválida
    }
    return formatDateTimeToString(dateObj);
  }

  // Es objeto Date
  if (isNaN(date.getTime())) {
    return getNowLocal(); // Fallback si la fecha es inválida
  }
  return formatDateTimeToString(date);
};

/**
 * Valida y convierte fecha de forma segura. Nunca retorna "Invalid Date".
 *
 * @param {Date|string} date - Fecha a validar y convertir
 * @returns {string|null} Fecha válida o null
 */
export const safeConvertToTimezone = (date) => {
  try {
    const result = convertToTimezone(date);
    return result && result !== "Invalid Date" ? result : getNowLocal();
  } catch (error) {
    console.warn("Error al convertir fecha, usando fecha actual:", error);
    return getNowLocal();
  }
};

/**
 * Convierte fecha de backend a formato para input datetime-local.
 * Formato requerido: "YYYY-MM-DDTHH:mm"
 *
 * @param {string} backendDate - Fecha en formato "YYYY-MM-DD HH:mm:ss"
 * @returns {string} Fecha en formato "YYYY-MM-DDTHH:mm"
 *
 * @example
 * // Para input datetime-local
 * formatForInput("2026-03-08 14:30:00") // "2026-03-08T14:30"
 */
export const formatForInput = (backendDate) => {
  if (!backendDate) return "";

  // Si ya tiene el formato correcto
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(backendDate)) {
    return backendDate;
  }

  // Convertir de "YYYY-MM-DD HH:mm:ss" a "YYYY-MM-DDTHH:mm"
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(backendDate)) {
    return backendDate.replace(" ", "T").slice(0, 16);
  }

  // Para otros formatos, intentar convertir
  try {
    const dateObj = new Date(backendDate);
    if (isNaN(dateObj.getTime())) return "";
    // Formatear en timezone configurada y devolver con T separator
    const formatted = formatInConfiguredTimezone(dateObj); // YYYY-MM-DD HH:mm:ss
    return formatted.replace(" ", "T").slice(0, 16);
  } catch {
    return "";
  }
};

/**
 * Obtiene solo la hora actual en formato HH:mm:ss
 *
 * @returns {string} Hora en formato HH:mm:ss
 */
export const getTimeLocal = () => {
  const str = formatDateTimeToString(new Date());
  return str.split(" ")[1];
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 *
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getDateLocal = () => {
  const str = formatDateTimeToString(new Date());
  return str.split(" ")[0];
};

/**
 * Formatea una fecha para mostrar en UI (formato legible)
 *
 * @param {Date|string} date - Fecha a formatear
 * @param {string} locale - Locale para formateo (default: "es-PE")
 * @returns {string} Fecha formateada legible
 *
 * @example
 * // Para mostrar en UI
 * formatForDisplay(new Date()) // "8/3/2026, 11:30 a. m."
 */
export const formatForDisplay = (date, locale = "es-PE") => {
  let dateObj;

  if (typeof date === "string") {
    // If backend format "YYYY-MM-DD HH:mm:ss", parse components to avoid
    // inconsistent Date parsing and timezone offsets from `new Date(string)`.
    const backendRegex = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
    const m = date.match(backendRegex);
    if (m) {
      const [, y, mo, d, h, mi, s] = m.map((v) => v);
      dateObj = new Date(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(h),
        Number(mi),
        Number(s),
      );
    } else {
      // Fallback to Date constructor for other formats
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  if (!dateObj || isNaN(dateObj.getTime())) return "";

  // Build a localized date + time string but avoid minute rounding by
  // formatting time with seconds and then stripping seconds textually.
  const datePart = dateObj.toLocaleDateString(locale);
  const timeWithSeconds = dateObj.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  // Remove the seconds (e.g. "11:06:00 p. m." -> "11:06 p. m.") without rounding
  const timeNoSeconds = timeWithSeconds.replace(/:\d{2}(?=[^\d]|$)/, "");

  return `${datePart}, ${timeNoSeconds}`;
};

/**
 * Calcula diferencia en minutos entre dos fechas
 *
 * @param {Date|string} startDate - Fecha inicio
 * @param {Date|string} endDate - Fecha fin
 * @returns {number} Diferencia en minutos
 */
export const getMinutesDifference = (startDate, endDate) => {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  return Math.round((end - start) / (1000 * 60));
};

/**
 * Formatea diferencia de tiempo en formato legible
 *
 * @param {Date|string} startDate - Fecha inicio
 * @param {Date|string} endDate - Fecha fin
 * @returns {string} Diferencia formateada
 *
 * @example
 * // "5 min", "2 horas 30 min", "3 días"
 */
export const formatTimeDifference = (startDate, endDate) => {
  const minutes = getMinutesDifference(startDate, endDate);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes > 0
      ? `${hours} horas ${remainingMinutes} min`
      : `${hours} horas`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0
    ? `${days} días ${remainingHours} horas`
    : `${days} días`;
};

/**
 * Información de debug sobre conversión de timezone
 *
 * @returns {Object} Información de debug
 */
export const getTimezoneDebugInfo = () => {
  const now = new Date();

  return {
    navegador_utc: now.toISOString(),
    navegador_local: now.toString(),
    timezone_configurado: DEFAULT_TIMEZONE,
    hora_formateada_local: getTimeLocal(),
    fecha_formateada_local: getDateLocal(),
    fecha_completa_local: formatDateTimeToString(now),
    fecha_para_ui: formatForDisplay(now),
    fecha_para_input: formatForInput(formatDateTimeToString(now)),
  };
};

// Export default para compatibilidad
export default {
  formatDateTimeToString,
  getNowLocal,
  convertToTimezone,
  safeConvertToTimezone,
  formatForInput,
  getTimeLocal,
  getDateLocal,
  formatForDisplay,
  getMinutesDifference,
  formatTimeDifference,
  getTimezoneDebugInfo,
  DEFAULT_TIMEZONE,
};
