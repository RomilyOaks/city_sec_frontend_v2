import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * Componente reutilizable para mostrar errores de validación
 */
const ValidationErrorDisplay = ({ 
  error, 
  onClose, 
  className = '',
  showIcon = true,
  variant = 'default' // 'default', 'compact', 'detailed'
}) => {
  if (!error) return null;

  // Extraer información del error
  const getErrorInfo = () => {
    if (typeof error === 'string') {
      return {
        title: 'Error',
        message: error,
        details: []
      };
    }

    // 🔥 Manejar errores de validación personalizados (nueva estructura)
    if (error?.isValidationError && error?.validationErrors) {
      const errors = error.validationErrors.map(err => {
        if (typeof err === 'string') return err;
        if (typeof err === 'object') {
          // Manejar el formato específico del backend: {field, value, message, location}
          const field = err.field || err.path || err.param || '';
          const msg = err.message || err.msg || '';
          
          return field ? `${field}: ${msg}` : msg;
        }
        return String(err);
      });

      return {
        title: 'Errores de validación',
        message: 'Por favor, corrija los siguientes campos:',
        details: errors.filter(Boolean)
      };
    }

    // Formato anterior (compatibilidad)
    if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
      const errors = error.response.data.errors.map(err => {
        if (typeof err === 'string') return err;
        if (typeof err === 'object') {
          const field = err.field || err.path || err.param || '';
          const msg = err.message || err.msg || '';
          
          return field ? `${field}: ${msg}` : msg;
        }
        return String(err);
      });

      return {
        title: 'Errores de validación',
        message: 'Por favor, corrija los siguientes campos:',
        details: errors.filter(Boolean)
      };
    }

    const message = error?.response?.data?.message || 
                   error?.response?.data?.error || 
                   error?.response?.data?.msg ||
                   error?.message ||
                   'Error desconocido';

    return {
      title: 'Error',
      message: message,
      details: []
    };
  };

  const errorInfo = getErrorInfo();

  // Renderizado según variante
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        {showIcon && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
        <span className="text-sm text-red-700 flex-1">{errorInfo.message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  if (variant === 'detailed' && errorInfo.details.length > 0) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {showIcon && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
            <h3 className="font-medium text-red-900">{errorInfo.title}</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <p className="text-sm text-red-700 mb-3">{errorInfo.message}</p>
        
        <ul className="space-y-2">
          {errorInfo.details.map((detail, index) => {
            const [field, ...messageParts] = detail.split(':');
            return (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-red-500 mt-0.5">•</span>
                <div>
                  {field && messageParts.length > 0 ? (
                    <>
                      <span className="font-medium text-red-900">{field}:</span>
                      <span className="text-red-700 ml-1">{messageParts.join(':')}</span>
                    </>
                  ) : (
                    <span className="text-red-700">{detail}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // Variante default
  return (
    <div className={`flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
      {showIcon && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
      <div className="flex-1">
        <h3 className="font-medium text-red-900 mb-1">{errorInfo.title}</h3>
        <p className="text-sm text-red-700">{errorInfo.message}</p>
        
        {errorInfo.details.length > 0 && (
          <ul className="mt-2 space-y-1">
            {errorInfo.details.map((detail, index) => (
              <li key={index} className="text-sm text-red-600 flex items-start gap-1">
                <span>•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="text-red-500 hover:text-red-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ValidationErrorDisplay;
