/**
 * File: src/components/catalogos/PersonasAsociadasModal.jsx
 * @version 1.0.0
 * @description Modal para mostrar personas asociadas a un cargo
 */

import { useEffect, useState, memo } from "react";
import { X, Users, AlertTriangle, Mail, Phone, IdCard } from "lucide-react";
import { getPersonasAsociadasCargo } from "../../services/cargosService.js";

const PersonasAsociadasModal = memo(({
  isOpen = false,
  onClose = () => {},
  cargoId = null,
  cargoNombre = "",
}) => {
  const [personas, setPersonas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !cargoId) return;

    const fetchPersonas = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await getPersonasAsociadasCargo(cargoId);
        setPersonas(response.data);
      } catch (error) {
        console.error("Error obteniendo personas asociadas:", error);
        setError("No se pudieron cargar las personas asociadas");
      } finally {
        setLoading(false);
      }
    };

    fetchPersonas();
  }, [isOpen, cargoId]);

  // Manejar tecla ESC
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Personas Asociadas - {cargoNombre}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
              <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          ) : !personas ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
            </div>
          ) : personas.total_personas === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay personas asignadas
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Este cargo no tiene personas asociadas actualmente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Total de personas asociadas: {personas.total_personas}
                  </span>
                </div>
              </div>

              {/* Lista de personas */}
              <div className="space-y-3">
                {personas.personas_asociadas.map((persona) => (
                  <div
                    key={persona.id}
                    className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          {persona.nombres} {persona.apellido_paterno} {persona.apellido_materno}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                            <IdCard className="w-4 h-4" />
                            <span>{persona.doc_tipo}: {persona.doc_numero}</span>
                          </div>
                          
                          {persona.telefono && (
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                              <Phone className="w-4 h-4" />
                              <span>Tel: {persona.telefono}</span>
                            </div>
                          )}
                          
                          {persona.email && (
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{persona.email}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Estado:</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-md ${
                              persona.estado === 'Activo' || persona.estado === true
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
                                : 'bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-700'
                            }`}>
                              {persona.estado === true ? 'Activo' : persona.estado === false ? 'Inactivo' : (persona.estado || 'Activo')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mensaje de advertencia */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium mb-1">Importante:</p>
                    <p>
                      Para poder eliminar este cargo, primero debe reasignar o eliminar las personas asociadas.
                      No se puede eliminar un cargo mientras tenga personal asignado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
});

PersonasAsociadasModal.displayName = "PersonasAsociadasModal";

export default PersonasAsociadasModal;
