/**
 * File: src/pages/operativos/vehiculos/OperativosVehiculosModal.jsx
 * @version 1.0.0
 * @description Modal para gestionar vehículos de un turno operativo
 * @module src/pages/operativos/vehiculos/OperativosVehiculosModal.jsx
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  X,
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
import { canPerformAction } from "../../../rbac/rbac.js";
import { useAuthStore } from "../../../store/useAuthStore.js";
import AsignarVehiculoForm from "./AsignarVehiculoForm.jsx";
import VerVehiculoModal from "./VerVehiculoModal.jsx";
import EditarVehiculoForm from "./EditarVehiculoForm.jsx";

/**
 * OperativosVehiculosModal
 * Modal para ver y gestionar vehículos de un turno operativo
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Object} props.turno - Turno operativo seleccionado
 */
export default function OperativosVehiculosModal({ isOpen, onClose, turno }) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const canCreate = canPerformAction(user, "operativos_vehiculos_create");
  const canEdit = canPerformAction(user, "operativos_vehiculos_update");
  const canDelete = canPerformAction(user, "operativos_vehiculos_delete");
  const canReadCuadrantes = canPerformAction(user, "operativos.vehiculos.cuadrantes.read");

  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);

  // Manejar teclas ESC, Alt+N y Alt+V
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC para cerrar (solo si no estamos en el formulario/modal de edición/vista)
      if (e.key === "Escape" && isOpen && !showCreateForm && !showEditForm && !showViewModal) {
        onClose();
      }
      // Alt+N: prevenir que se abra Nuevo Turno cuando estamos en este modal
      if (e.altKey && e.key === "n" && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        // No cerramos el modal, solo prevenimos que se abra el modal de Nuevo Turno
      }
      // Alt+V: abrir formulario de asignación de vehículo (solo si tiene permiso y no está ya en el formulario)
      if (e.altKey && e.key === "v" && isOpen && !showCreateForm && !showEditForm && canCreate) {
        e.preventDefault();
        setShowCreateForm(true);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown, true); // Usar capture phase
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [isOpen, onClose, showCreateForm, showEditForm, showViewModal, canCreate]);

  // Cargar vehículos del turno
  const fetchVehiculos = useCallback(async () => {
    if (!turno?.id) return;

    setLoading(true);
    try {
      const result = await listVehiculosByTurno(turno.id);
      const items = result?.data || result || [];
      setVehiculos(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Error cargando vehículos:", err);
      toast.error(err?.response?.data?.message || "Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  }, [turno?.id]);

  useEffect(() => {
    if (isOpen && turno?.id) {
      fetchVehiculos();
    }
  }, [isOpen, turno?.id, fetchVehiculos]); // Agregado fetchVehiculos a las dependencias

  const handleView = (vehiculo) => {
    setSelectedVehiculo(vehiculo);
    setShowViewModal(true);
  };

  const handleEdit = (vehiculo) => {
    setSelectedVehiculo(vehiculo);
    setShowEditForm(true);
  };

  const handleCuadrantes = (vehiculo) => {
    // Navegar a la página de cuadrantes del vehículo
    navigate(`/operativos/turnos/${turno.id}/vehiculos/${vehiculo.id}/cuadrantes`);
  };

  const handleDelete = async (vehiculo) => {
    const confirmed = window.confirm(
      `¿Eliminar el vehículo ${vehiculo.vehiculo?.placa} de este turno?`
    );
    if (!confirmed) return;

    try {
      await deleteVehiculoOperativo(turno.id, vehiculo.id);
      toast.success("Vehículo eliminado del turno");
      fetchVehiculos();
    } catch (err) {
      console.error("Error eliminando vehículo:", err);
      toast.error(err?.response?.data?.message || "Error al eliminar vehículo");
    }
  };

  const formatPersonalNombre = (persona) => {
    if (!persona) return "—";
    const nombres = [
      persona.nombres,
      persona.apellido_paterno,
      persona.apellido_materno,
    ]
      .filter(Boolean)
      .join(" ");
    return nombres || "—";
  };

  const getSupervisorNombre = () => {
    if (turno?.supervisor) return formatPersonalNombre(turno.supervisor);
    return "—";
  };

  const getOperadorNombre = () => {
    if (turno?.operador) return formatPersonalNombre(turno.operador);
    return "—";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Car size={24} className="text-blue-600" />
                Vehículos del Turno Operativo
              </h2>
              {canCreate && !showCreateForm && !showEditForm && (
                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
                  Alt+V = Asignar Vehículo
                </span>
              )}
              {(showCreateForm || showEditForm) && (
                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
                  Alt+G = Guardar | Esc = Cancelar
                </span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400">
                  📅 {turno?.fecha} | 🌅 {turno?.turno} | 📍{" "}
                  {turno?.sector?.nombre || "Sector"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Supervisor:</span>{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {getSupervisorNombre()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Operador:</span>{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {getOperadorNombre()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Cerrar (ESC)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar - solo mostrar si NO estamos en modo crear/editar Y hay registros */}
        {!showCreateForm && !showEditForm && vehiculos.length > 0 && (
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              {canCreate && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 transition-colors"
                  title="Asignar Vehículo (Alt+V)"
                >
                  <Plus size={18} />
                  Asignar Vehículo
                </button>
              )}
            </div>
            <button
              onClick={fetchVehiculos}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refrescar"
            >
              <RefreshCw size={18} />
              Refrescar
            </button>
          </div>
        )}

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-6">
          {showCreateForm ? (
            <AsignarVehiculoForm
              turnoId={turno.id}
              vehiculosAsignados={vehiculos}
              onSuccess={() => {
                setShowCreateForm(false);
                fetchVehiculos();
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          ) : showEditForm && selectedVehiculo ? (
            <EditarVehiculoForm
              turnoId={turno.id}
              turno={turno}
              vehiculo={selectedVehiculo}
              vehiculosAsignados={vehiculos}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedVehiculo(null);
                fetchVehiculos();
              }}
              onCancel={() => {
                setShowEditForm(false);
                setSelectedVehiculo(null);
              }}
            />
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">
                  Cargando vehículos...
                </p>
              </div>
            </div>
          ) : vehiculos.length === 0 ? (
            <div className="text-center py-12">
              <Car size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                No hay vehículos asignados a este turno
              </p>
              {canCreate && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800"
                  title="Asignar Vehículo (Alt+V)"
                >
                  <Plus size={18} />
                  Asignar primer vehículo
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
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
          )}
        </div>

        {/* Footer - solo mostrar si NO estamos en modo crear/editar */}
        {!showCreateForm && !showEditForm && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {vehiculos.length} vehículo{vehiculos.length !== 1 ? "s" : ""} asignado
              {vehiculos.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Modal de Ver Detalle */}
      <VerVehiculoModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedVehiculo(null);
        }}
        vehiculo={selectedVehiculo}
      />
    </div>
  );
}
