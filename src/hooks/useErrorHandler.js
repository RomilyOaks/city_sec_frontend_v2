import { useState } from 'react';
import { extractValidationErrors, showValidationError } from '../utils/errorUtils';
import toast from 'react-hot-toast';

/**
 * Hook personalizado para manejar errores de forma consistente
 * @returns {Object} - Funciones y estado para manejar errores
 */
export function useErrorHandler() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Maneja errores de forma estandarizada
   * @param {Error} err - Error a manejar
   * @param {string} defaultMessage - Mensaje por defecto
   * @param {Object} options - Opciones adicionales
   */
  const handleError = (err, defaultMessage = 'Error', options = {}) => {
    const {
      showToast = true,
      setErrorState = true
    } = options;

    console.error('Error handled:', err);

    if (setErrorState) {
      setError(err);
    }

    if (showToast) {
      showValidationError(err, toast, defaultMessage);
    }

    return extractValidationErrors(err);
  };

  /**
   * Limpia el estado de error
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Ejecuta una función con manejo automático de errores
   * @param {Function} fn - Función a ejecutar
   * @param {string} errorMessage - Mensaje de error por defecto
   * @param {Object} options - Opciones adicionales
   */
  const executeWithErrorHandling = async (fn, errorMessage = 'Error en la operación', options = {}) => {
    setLoading(true);
    clearError();

    try {
      const result = await fn();
      return { success: true, data: result, error: null };
    } catch (err) {
      const message = handleError(err, errorMessage, options);
      return { success: false, data: null, error: err, message };
    } finally {
      setLoading(false);
    }
  };

  return {
    error,
    loading,
    handleError,
    clearError,
    executeWithErrorHandling
  };
}

/**
 * Hook simplificado para operaciones CRUD
 * @param {Function} apiFunction - Función de API a ejecutar
 * @param {string} successMessage - Mensaje de éxito
 * @param {string} errorMessage - Mensaje de error
 * @returns {Object} - Función execute y estado
 */
export function useCrudOperation(apiFunction, successMessage, errorMessage) {
  const { loading, executeWithErrorHandling, clearError } = useErrorHandler();

  const execute = async (...args) => {
    const result = await executeWithErrorHandling(
      () => apiFunction(...args),
      errorMessage
    );

    if (result.success) {
      toast.success(successMessage);
    }

    return result;
  };

  return {
    execute,
    loading,
    clearError
  };
}
