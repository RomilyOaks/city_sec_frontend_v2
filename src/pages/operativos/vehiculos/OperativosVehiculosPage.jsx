/**
 * File: src/pages/operativos/vehiculos/OperativosVehiculosPage.jsx
 * @version 1.0.0
 * @description Página para gestionar vehículos de un turno operativo (Nivel 2)
 * @module src/pages/operativos/vehiculos/OperativosVehiculosPage.jsx
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  Car,
  MapPin,
} from "lucide-react";

import {
  listVehiculosByTurno,
  deleteVehiculoOperativo,
} from "../../../services/operativosVehiculosService.js";
import api from "../../../services/api.js";
import { canPerformAction } from "../../../rbac/rbac.js";
import { useAuthStore } from "../../../store/useAuthStore.js";
import AsignarVehiculoForm from "./AsignarVehiculoForm.jsx";
import VerVehiculoModal from "./VerVehiculoModal.jsx";
import EditarVehiculoForm from "./EditarVehiculoForm.jsx";

/**
 * Formatea nombre de personal
 */
const formatPersonalNombre = (personal) => {
  if (!personal) return "—";
  return `${personal.nombres || ""} ${personal.apellido_paterno || ""}`.trim() || "—";
};

/**
 * OperativosVehiculosPage - Página para gestionar vehículos de un turno
 * @component
 */
export default function OperativosVehiculosPage() {
  const { turnoId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  
  // Obtener sector_id desde query params
  const sectorIdFromUrl = searchParams.get('sector_id');
  
  const canCreate = canPerformAction(user, "operativos_vehiculos_create");
  const canEdit = canPerformAction(user, "operativos_vehiculos_update");
  const canDelete = canPerformAction(user, "operativos_vehiculos_delete");
  const canReadCuadrantes = canPerformAction(user, "operativos.vehiculos.cuadrantes.read");

  const [vehiculos, setVehiculos] = useState([]);
  const [turno, setTurno] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);

  // Manejar tecla ESC para retornar
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (showCreateForm || showViewModal || showEditForm) {
          event.preventDefault();
          event.stopPropagation();
          setShowCreateForm(false);
          setShowViewModal(false);
          setShowEditForm(false);
          setSelectedVehiculo(null);
        } else {
          handleBack();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showCreateForm, showViewModal, showEditForm]);

  // Cargar datos del turno
  const fetchTurno = useCallback(async () => {
    try {
      const response = await api.get(`/operativos/${turnoId}`);
      const turnoData = response.data?.data || response.data;
      setTurno(turnoData);
    } catch (err) {
      console.error("Error cargando turno:", err);
    }
  }, [turnoId]);

  // Cargar vehículos del turno
  const fetchVehiculos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listVehiculosByTurno(turnoId);
      const data = response?.data || response || [];
      setVehiculos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando vehículos:", err);
      toast.error("Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  }, [turnoId]);

  useEffect(() => {
    if (turnoId) {
      fetchTurno();
      fetchVehiculos();
    }
  }, [turnoId, fetchTurno, fetchVehiculos]);

  const handleBack = () => {
    navigate("/operativos/turnos");
  };

  const handleView = async (vehiculo) => {
    try {
      // Cargar datos completos del vehículo con auditoría
      const response = await api.get(`/operativos-vehiculos/${vehiculo.id}`);
      const vehiculoCompleto = response.data?.data || response.data;
      setSelectedVehiculo(vehiculoCompleto);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error cargando vehículo completo:', error);
      toast.error('Error al cargar detalles del vehículo');
      // Fallback: usar datos incompletos
      setSelectedVehiculo(vehiculo);
      setShowViewModal(true);
    }
  };

  const handleEdit = (vehiculo) => {
    setSelectedVehiculo(vehiculo);
    setShowEditForm(true);
  };

  const handleCuadrantes = (vehiculo) => {
    // Pasar sector_id como query param para evitar llamada adicional al API
    const sectorParam = sectorIdFromUrl ? `?sector_id=${sectorIdFromUrl}` : (turno?.sector_id ? `?sector_id=${turno.sector_id}` : '');
    navigate(`/operativos/turnos/${turnoId}/vehiculos/${vehiculo.id}/cuadrantes${sectorParam}`);
  };

  const handleDelete = async (vehiculo) => {
    const confirmed = window.confirm(
      `¿Eliminar el vehículo ${vehiculo.vehiculo?.placa} de este turno?`
    );
    if (!confirmed) return;

    try {
      await deleteVehiculoOperativo(turnoId, vehiculo.id);
      toast.success("Vehículo eliminado del turno");
      fetchVehiculos();
    } catch (err) {
      console.error("Error eliminando vehículo:", err);
      toast.error("Error al eliminar vehículo");
    }
  };

  const handleVehiculoCreated = () => {
    setShowCreateForm(false);
    fetchVehiculos();
    toast.success("Vehículo asignado exitosamente");
  };

  const handleVehiculoUpdated = () => {
    setShowEditForm(false);
    fetchVehiculos();
    toast.success("Vehículo actualizado exitosamente");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={16} />
              Volver a Turnos
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Car size={28} className="text-blue-600" />
                Vehículos del Turno
              </h1>
              {turno && (
                <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">Fecha:</span>
                      <span className="text-blue-700 dark:text-blue-300">{turno.fecha}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">Turno:</span>
                      <span className="text-blue-700 dark:text-blue-300">{turno.turno}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">Sector:</span>
                      <span className="text-blue-700 dark:text-blue-300">
                        {turno.sector ? `${turno.sector.sector_code} - ${turno.sector.nombre}` : 'No asignado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">Operador:</span>
                      <span className="text-blue-700 dark:text-blue-300">
                        {turno.operador ? `${turno.operador.nombres} ${turno.operador.apellido_paterno}` : 'No asignado'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-blue-900 dark:text-blue-100">Supervisor:</span>
                      <span className="text-blue-700 dark:text-blue-300">
                        {turno.supervisor ? `${turno.supervisor.nombres} ${turno.supervisor.apellido_paterno}` : 'No asignado'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canCreate && !showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800"
              >
                <Plus size={18} />
                Asignar Vehículo
              </button>
            )}
            <button
              onClick={fetchVehiculos}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw size={16} />
              Refrescar
            </button>
          </div>
        </div>

        {/* Formulario de creación */}
        {showCreateForm && (
          <AsignarVehiculoForm
            turnoId={turnoId}
            onSuccess={handleVehiculoCreated}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Formulario de edición */}
        {showEditForm && selectedVehiculo && (
          <EditarVehiculoForm
            turnoId={turnoId}
            vehiculo={selectedVehiculo}
            vehiculosAsignados={vehiculos}
            onSuccess={handleVehiculoUpdated}
            onCancel={() => setShowEditForm(false)}
          />
        )}

        {/* Modal de visualización */}
        {showViewModal && selectedVehiculo && (
          <VerVehiculoModal
            isOpen={showViewModal}
            vehiculo={selectedVehiculo}
            onClose={() => {
              setShowViewModal(false);
              setSelectedVehiculo(null);
            }}
          />
        )}

        {/* Estado de carga o tabla (solo si no hay formulario de edición abierto) */}
        {!showEditForm && !showCreateForm && loading && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Cargando vehículos...</p>
          </div>
        )}

        {!showEditForm && !showCreateForm && !loading && vehiculos.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <Car size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
              No hay vehículos asignados
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Este turno no tiene vehículos asignados.
            </p>
            {canCreate && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800"
              >
                <Plus size={18} />
                Asignar primer vehículo
              </button>
            )}
          </div>
        )}

        {!showEditForm && !showCreateForm && !loading && vehiculos.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Placa
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Vehículo
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Conductor
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Copiloto
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Km Inicio
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Km Fin
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Km Recorridos
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {vehiculos.map((v) => (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">
                        {v.vehiculo?.placa || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {v.vehiculo
                          ? `${v.vehiculo.marca || ""} ${v.vehiculo.modelo || ""}`.trim()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {formatPersonalNombre(v.conductor)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {formatPersonalNombre(v.copiloto)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {v.kilometraje_inicio?.toLocaleString() || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {v.kilometraje_fin?.toLocaleString() || "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-primary-600 dark:text-primary-400">
                        {v.kilometros_recorridos?.toLocaleString() || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canReadCuadrantes && (
                            <button
                              onClick={() => handleCuadrantes(v)}
                              className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                              title="Ver Cuadrantes"
                            >
                              <MapPin size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleView(v)}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Ver detalle"
                          >
                            <Eye size={14} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleEdit(v)}
                              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(v)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {vehiculos.length} vehículo{vehiculos.length !== 1 ? "s" : ""} asignado{vehiculos.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
