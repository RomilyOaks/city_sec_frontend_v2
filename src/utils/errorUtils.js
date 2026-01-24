/**
 * Utilidades reutilizables para manejo de errores
 */

/**
 * Extrae mensajes de error específicos del backend
 * @param {Object} error - Error对象 de axios o fetch
 * @returns {string} - Mensaje de error formateado
 */
export function extractValidationErrors(error) {
  // Si no hay respuesta del servidor
  if (!error?.response?.data) {
    return error?.message || "Error desconocido";
  }

  const data = error.response.data;

  // Si hay errores específicos en response.data.errors (formato nuevo)
  if (data.errors && Array.isArray(data.errors)) {
    const messages = data.errors.map((err) => {
      // Manejar diferentes formatos de errores
      if (typeof err === 'string') {
        return err;
      }
      
      if (typeof err === 'object') {
        // Priorizar diferentes campos de mensaje
        const field = err.field || err.path || err.param || '';
        const msg = err.message || err.msg || '';
        
        return field ? `${field}: ${msg}` : msg;
      }
      
      return String(err);
    });
    
    return messages.join('. ');
  }

  // Si hay un mensaje general
  if (data.message) {
    return data.message;
  }

  if (data.error) {
    return data.error;
  }

  if (data.msg) {
    return data.msg;
  }

  // Si hay un error con código específico
  if (data.code) {
    const codeMessages = {
      'VALIDATION_ERROR': 'Error de validación de datos',
      'DUPLICATE_ENTRY': 'Registro duplicado',
      'NOT_FOUND': 'Recurso no encontrado',
      'UNAUTHORIZED': 'No autorizado',
      'FORBIDDEN': 'Acceso denegado',
      'INTERNAL_ERROR': 'Error interno del servidor'
    };
    
    return codeMessages[data.code] || `Error (${data.code})`;
  }

  // Mensaje por defecto según status HTTP
  const statusMessages = {
    400: 'Solicitud inválida',
    401: 'No autorizado',
    403: 'Acceso denegado',
    404: 'Recurso no encontrado',
    409: 'Conflicto de datos',
    422: 'Error de validación',
    500: 'Error interno del servidor'
  };

  return statusMessages[error.response.status] || 'Error en la solicitud';
}

/**
 * Muestra errores de validación en toast
 * @param {Object} error - Error对象
 * @param {Function} toast - Función toast (react-hot-toast o similar)
 * @param {string} defaultMessage - Mensaje por defecto
 */
export function showValidationError(error, toast, defaultMessage = 'Error de validación') {
  const errorMessage = extractValidationErrors(error);
  
  if (errorMessage.includes(':')) {
    // Si hay errores específicos, mostrarlos individualmente
    const errors = errorMessage.split('. ').filter(Boolean);
    errors.forEach((err, index) => {
      setTimeout(() => {
        toast.error(err.trim());
      }, index * 100); // Pequeño delay entre mensajes
    });
  } else {
    toast.error(errorMessage || defaultMessage);
  }
}

/**
 * Formatea errores para mostrar en un componente
 * @param {Object} error - Error对象
 * @returns {Object} - Objeto con { title, message, details }
 */
export function formatErrorForDisplay(error) {
  const message = extractValidationErrors(error);
  
  // Si es un error de validación con múltiples campos
  if (message.includes(':') && message.includes('.')) {
    const errors = message.split('. ').filter(Boolean);
    return {
      title: 'Errores de validación',
      message: 'Por favor, corrija los siguientes campos:',
      details: errors.map(err => {
        const [field, ...msgParts] = err.split(':');
        return {
          field: field.trim(),
          message: msgParts.join(':').trim()
        };
      })
    };
  }
  
  return {
    title: 'Error',
    message: message,
    details: []
  };
}
