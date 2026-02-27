/**
 * File: src/pages/operativos/vehiculos/CuadrantesPorVehiculo.jsx
 * @version 1.0.0
 * @description Página para visualizar cuadrantes asignados a un vehículo operativo
 * @module src/pages/operativos/vehiculos/CuadrantesPorVehiculo.jsx
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
  AlertTriangle,
  FileText,
  Clock,
  Map,
} from "lucide-react";

import api from "../../../services/api.js";
import { canPerformAction } from "../../../rbac/rbac.js";
import { useAuthStore } from "../../../store/useAuthStore.js";
import AsignarCuadranteForm from "./AsignarCuadranteForm.jsx";
import EditarCuadranteForm from "./EditarCuadranteForm.jsx";
import CuadranteMapaModal from "../../../components/calles/CuadranteMapaModal.jsx";

/**
 * Formatea fecha/hora a formato legible
 */
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formatea minutos a texto legible
 */
const formatTiempo = (minutos) => {
  if (!minutos) return "-";
  return `${minutos} min`;
};

/**
 * CuadrantesPorVehiculo - Página para mostrar cuadrantes de un vehículo
 * @component
 */
export default function CuadrantesPorVehiculo() {
  const { turnoId, vehiculoId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canRead = canPerformAction(user, "operativos.vehiculos.cuadrantes.read");
  const canCreate = canPerformAction(user, "operativos.vehiculos.cuadrantes.create");
  const canEdit = canPerformAction(user, "operativos.vehiculos.cuadrantes.update");
  const canDelete = canPerformAction(user, "operativos.vehiculos.cuadrantes.delete");
  const canReadNovedades = canPerformAction(user, "operativos.vehiculos.novedades.read");

  const [cuadrantes, setCuadrantes] = useState([]);
  const [vehiculo, setVehiculo] = useState(null);
  // Obtener sector_id desde query params o estado
  const [sectorId, setSectorId] = useState(searchParams.get('sector_id') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedCuadrante, setSelectedCuadrante] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedCuadranteForMap, setSelectedCuadranteForMap] = useState(null);
  const [novedadesCounts, setNovedadesCounts] = useState({});

  // Obtener sector_id desde query params
  useEffect(() => {
    const sectorFromUrl = searchParams.get('sector_id');
    if (sectorFromUrl) {
      setSectorId(parseInt(sectorFromUrl));
    }
  }, [searchParams]);

  // Cargar datos del vehículo por separado
  const fetchVehiculo = useCallback(async () => {
    try {
      const response = await api.get(`/operativos/${turnoId}/vehiculos/${vehiculoId}`);
      const vehiculoData = response.data?.data || response.data;
      
      if (vehiculoData) {
        const vehiculoInfo = {
          id: vehiculoData.id,
          placa: vehiculoData.vehiculo?.placa || "-",
          marca: vehiculoData.vehiculo?.marca || "-",
          modelo: vehiculoData.vehiculo?.modelo_vehiculo || "-",
          tipo: vehiculoData.vehiculo?.tipo_vehiculo?.nombre || "Patrullero",
          tipo_vehiculo: { nombre: vehiculoData.vehiculo?.tipo_vehiculo?.nombre || "Patrullero" },
          conductor: vehiculoData.conductor,
          copiloto: vehiculoData.copiloto,
          kilometraje_inicio: vehiculoData.kilometraje_inicio,
          kilometraje_fin: vehiculoData.kilometraje_fin,
          kilometros_recorridos: vehiculoData.kilometros_recorridos
        };
        setVehiculo(vehiculoInfo);

        // Obtener sector_id del turno incluido en la respuesta
        if (vehiculoData.turno?.sector_id) {
          setSectorId(vehiculoData.turno.sector_id);
        } else if (vehiculoData.turno?.sector?.id) {
          setSectorId(vehiculoData.turno.sector.id);
        }
      }
    } catch (err) {
      console.error("❌ Error cargando vehículo:", err);
      setVehiculo({
        id: parseInt(vehiculoId),
        placa: "Cargando...",
        marca: "-",
        modelo: "-",
        tipo_vehiculo: { nombre: "-" }
      });
    }
  }, [turnoId, vehiculoId]);

  // Cargar datos del vehículo y sus cuadrantes
  const fetchCuadrantes = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingDemoData(false);
    
    // Cargar datos del vehículo (incluye sector_id)
    await fetchVehiculo();
    
    try {
      const response = await api.get(`/operativos/${turnoId}/vehiculos/${vehiculoId}/cuadrantes`);
      const data = response.data?.data || response.data || [];
      
      // Filtrar solo cuadrantes activos (estado_registro=1 y deleted_at=null)
      const cuadrantesActivos = Array.isArray(data) 
        ? data.filter(c => c.estado_registro === 1 && !c.deleted_at) 
        : [];
      
      if (cuadrantesActivos.length > 0) {
        setCuadrantes(cuadrantesActivos);
        setUsingDemoData(false);
        // Cargar contador de novedades para cada cuadrante
        await fetchNovedadesCounts(cuadrantesActivos);
      } else {
        const demoData = [
          {
            id: 1,
            operativo_vehiculo_id: parseInt(vehiculoId),
            cuadrante_id: 45,
            hora_ingreso: "2026-01-12T08:00:00.000Z",
            hora_salida: "2026-01-12T12:00:00.000Z",
            observaciones: "Patrullaje en centro comercial",
            incidentes_reportados: null,
            tiempo_minutos: 240,
            estado_registro: 1,
            deleted_at: null,
            created_at: "2026-01-12T08:00:00.000Z",
            updated_at: "2026-01-12T12:00:00.000Z",
            cuadrante: {
              id: 45,
              cuadrante_code: "C015",
              nombre: "Centro Comercial Norte",
              sector_id: 3,
              zona_code: "ZONA-A",
              latitud: -12.04380000,
              longitud: -77.04400000,
              color_mapa: "#10B981",
              estado: true
            }
          },
          {
            id: 2,
            operativo_vehiculo_id: parseInt(vehiculoId),
            cuadrante_id: 46,
            hora_ingreso: "2026-01-12T13:00:00.000Z",
            hora_salida: "2026-01-12T14:30:00.000Z",
            observaciones: "Patrullaje preventivo en parque",
            incidentes_reportados: null,
            tiempo_minutos: 90,
            estado_registro: 1,
            deleted_at: null,
            created_at: "2026-01-12T13:00:00.000Z",
            updated_at: "2026-01-12T14:30:00.000Z",
            cuadrante: {
              id: 46,
              cuadrante_code: "C016",
              nombre: "Parque Central",
              sector_id: 3,
              zona_code: "ZONA-B",
              latitud: -12.04560000,
              longitud: -77.04320000,
              color_mapa: "#F59E0B",
              estado: true
            }
          }
        ];
        
        setCuadrantes(demoData);
        setVehiculo({
          id: parseInt(vehiculoId),
          placa: "ABC-123",
          marca: "Toyota",
          modelo: "Hilux",
          tipo: "Patrullero",
          tipo_vehiculo: { nombre: "Patrullero" },
          conductor: {
            nombres: "Juan",
            apellido_paterno: "Pérez"
          },
          copiloto: {
            nombres: "Carlos", 
            apellido_paterno: "López"
          }
        });
        setUsingDemoData(true);
      }
    } catch (err) {
      console.error("❌ Error cargando cuadrantes:", err);
      
      // En caso de error, usar datos de demostración
      const demoData = [
        {
          id: 1,
          operativo_vehiculo_id: parseInt(vehiculoId),
          cuadrante_id: 45,
          hora_ingreso: "2026-01-12T08:00:00.000Z",
          hora_salida: "2026-01-12T12:00:00.000Z",
          observaciones: "Patrullaje en centro comercial",
          incidentes_reportados: null,
          tiempo_minutos: 240,
          estado_registro: 1,
          deleted_at: null,
          created_at: "2026-01-12T08:00:00.000Z",
          updated_at: "2026-01-12T12:00:00.000Z",
          cuadrante: {
            id: 45,
            cuadrante_code: "C015",
            nombre: "Centro Comercial Norte",
            sector_id: 3,
            zona_code: "ZONA-A",
            latitud: -12.04380000,
            longitud: -77.04400000,
            color_mapa: "#10B981",
            estado: true
          }
        }
      ];
      
      setCuadrantes(demoData);
      setVehiculo({
        id: parseInt(vehiculoId),
        placa: "ABC-123",
        marca: "Toyota",
        modelo: "Hilux",
        tipo: "Patrullero",
        tipo_vehiculo: { nombre: "Patrullero" },
        conductor: {
          nombres: "Juan",
          apellido_paterno: "Pérez"
        },
        copiloto: {
          nombres: "Carlos", 
          apellido_paterno: "López"
        }
      });
      setUsingDemoData(true);
      
      const errorMessage = err?.response?.data?.message || "Error al cargar los cuadrantes";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [turnoId, vehiculoId, fetchVehiculo]);

  useEffect(() => {
    if (!canRead) {
      setError("No tienes permisos para ver esta información");
      setLoading(false);
      return;
    }

    if (turnoId && vehiculoId) {
      fetchCuadrantes();
    }
  }, [turnoId, vehiculoId, canRead, fetchCuadrantes]);

  // Manejar tecla ESC para retornar
  const handleBack = useCallback(() => {
    navigate(`/operativos/turnos/${turnoId}/vehiculos`);
  }, [navigate, turnoId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (showCreateForm || showEditForm) {
          event.preventDefault();
          event.stopPropagation();
          setShowCreateForm(false);
          setShowEditForm(false);
          setSelectedCuadrante(null);
        } else {
          handleBack();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, true); // capture phase
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [showCreateForm, showEditForm, handleBack]);

  const handleCreateCuadrante = () => {
    setShowCreateForm(true);
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  const handleCuadranteCreated = () => {
    setShowCreateForm(false);
    fetchCuadrantes();
    toast.success("Cuadrante asignado exitosamente");
  };

  const handleEditCuadrante = (cuadrante) => {
    setSelectedCuadrante(cuadrante);
    setShowEditForm(true);
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setSelectedCuadrante(null);
  };

  const handleCuadranteUpdated = () => {
    setShowEditForm(false);
    setSelectedCuadrante(null);
    fetchCuadrantes();
    toast.success("Cuadrante actualizado exitosamente");
  };

  const handleViewNovedades = (cuadrante) => {
    navigate(`/operativos/turnos/${turnoId}/vehiculos/${vehiculoId}/cuadrantes/${cuadrante.id}/novedades`);
  };

  const handleViewMap = (cuadrante) => {
    const cuadranteData = cuadrante.datosCuadrante || cuadrante.cuadrante;
    
    if (cuadranteData?.id) {
      setSelectedCuadranteForMap(cuadranteData.id);
      setShowMapModal(true);
    } else {
      toast.error("No se pudo obtener la información del cuadrante");
    }
  };

  const fetchNovedadesCounts = async (cuadrantesList) => {
    const counts = {};
    for (const cuadrante of cuadrantesList) {
      try {
        const response = await api.get(`/operativos/${turnoId}/vehiculos/${vehiculoId}/cuadrantes/${cuadrante.id}/novedades`);
        const novedades = response.data?.data || response.data || [];
        counts[cuadrante.id] = Array.isArray(novedades) ? novedades.length : 0;
      } catch {
        counts[cuadrante.id] = 0;
      }
    }
    setNovedadesCounts(counts);
  };

  const handleDeleteCuadrante = async (cuadrante) => {
    // Validar que no tenga novedades asignadas
    const novedadesCount = novedadesCounts[cuadrante.id] || 0;
    
    if (novedadesCount > 0) {
      toast.error(`No se puede eliminar. El cuadrante tiene ${novedadesCount} ${novedadesCount === 1 ? 'novedad asignada' : 'novedades asignadas'}`);
      return;
    }
    
    const cuadranteInfo = cuadrante.datosCuadrante || cuadrante.cuadrante || {};
    const confirmed = window.confirm(
      `¿Está seguro de eliminar el cuadrante ${cuadranteInfo.cuadrante_code || cuadranteInfo.codigo || ''} - ${cuadranteInfo.nombre || ''}?`
    );
    
    if (!confirmed) return;
    
    try {
      await api.delete(`/operativos/${turnoId}/vehiculos/${vehiculoId}/cuadrantes/${cuadrante.id}`);
      
      toast.success("Cuadrante eliminado exitosamente");
      fetchCuadrantes();
    } catch (err) {
      console.error("Error eliminando cuadrante:", err);
      const errorMsg = err.response?.data?.message || "Error al eliminar cuadrante";
      toast.error(errorMsg);
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">
                Cargando cuadrantes...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Error de Conexión
              </h3>
            </div>
            <p className="text-red-700 dark:text-red-300 mb-4 whitespace-pre-line">
              {error}
            </p>
            <div className="flex gap-3">
              <button
                onClick={fetchCuadrantes}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <RefreshCw size={16} />
                Reintentar
              </button>
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                <ArrowLeft size={16} />
                Volver a Vehículos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              Volver a Vehículos
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <MapPin size={28} className="text-green-600" />
                Cuadrantes del Vehículo
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cuadrantes asignados durante el patrullaje
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {usingDemoData && (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm">
                <AlertTriangle size={14} />
                Modo Demostración
              </div>
            )}
            <button
              onClick={fetchCuadrantes}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw size={16} />
              Refrescar
            </button>
          </div>
        </div>

        {/* Información del vehículo */}
        {vehiculo && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Car size={24} className="text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Información del Vehículo
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Placa:</span>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {vehiculo.placa || "-"}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Marca/Modelo:</span>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {vehiculo.marca && vehiculo.modelo 
                    ? `${vehiculo.marca} ${vehiculo.modelo}` 
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Tipo:</span>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {vehiculo.tipo_vehiculo?.nombre || vehiculo.tipo || "-"}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Conductor:</span>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {vehiculo.conductor 
                    ? `${vehiculo.conductor.nombres} ${vehiculo.conductor.apellido_paterno}`.trim()
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Copiloto:</span>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {vehiculo.copiloto 
                    ? `${vehiculo.copiloto.nombres} ${vehiculo.copiloto.apellido_paterno}`.trim()
                    : "-"}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Km Inicio:</span>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {vehiculo.kilometraje_inicio?.toLocaleString() || "-"}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Km Fin:</span>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {vehiculo.kilometraje_fin?.toLocaleString() || "-"}
                </p>
              </div>
              <div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Km Recorridos:</span>
                <p className="font-medium text-primary-600 dark:text-primary-400">
                  {vehiculo.kilometros_recorridos?.toLocaleString() || "-"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de cuadrantes */}
        {showCreateForm ? (
          <AsignarCuadranteForm
            vehiculo={vehiculo}
            turnoId={turnoId}
            vehiculoId={vehiculoId}
            sectorId={sectorId}
            cuadrantesAsignados={cuadrantes.map(c => c.cuadrante_id || c.datosCuadrante?.id || c.cuadrante?.id)}
            onSuccess={handleCuadranteCreated}
            onCancel={handleCancelCreate}
          />
        ) : showEditForm && selectedCuadrante ? (
          <EditarCuadranteForm
            cuadrante={selectedCuadrante}
            turnoId={turnoId}
            vehiculoId={vehiculoId}
            onSuccess={handleCuadranteUpdated}
            onCancel={handleCancelEdit}
          />
        ) : cuadrantes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <MapPin size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Sin cuadrantes asignados
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Este vehículo no tiene cuadrantes asignados en este turno.
            </p>
            {canCreate && (
              <button
                onClick={handleCreateCuadrante}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800"
              >
                <Plus size={18} />
                Asignar primer cuadrante
              </button>
            )}
            {usingDemoData && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-4">
                Mostrando datos de demostración
              </p>
            )}
          </div>
        ) : (
          <>
            {/* Toolbar para asignar cuadrantes */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
              <div className="flex items-center gap-2">
                {canCreate && (
                  <button
                    onClick={handleCreateCuadrante}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800"
                  >
                    <Plus size={18} />
                    Asignar Cuadrante
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden border-t-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Ingreso
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Salida
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Tiempo
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Novedades
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cuadrantes.map((cuadrante) => (
                    <tr
                      key={cuadrante.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-50">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} className="text-green-600" />
                          {cuadrante.datosCuadrante?.cuadrante_code || cuadrante.cuadrante?.cuadrante_code || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {cuadrante.datosCuadrante?.nombre || cuadrante.cuadrante?.nombre || "-"}
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={14} />
                          {formatDateTime(cuadrante.hora_ingreso)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={14} />
                          {formatDateTime(cuadrante.hora_salida)}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-primary-600 dark:text-primary-400">
                        {formatTiempo(cuadrante.tiempo_minutos)}
                      </td>
                      <td className="px-6 py-4">
                        {novedadesCounts[cuadrante.id] > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                            <AlertTriangle size={12} />
                            {novedadesCounts[cuadrante.id]} {novedadesCounts[cuadrante.id] === 1 ? 'novedad' : 'novedades'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs">
                            0 novedades
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewMap(cuadrante)}
                            className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Ver Mapa del Cuadrante"
                          >
                            <Map size={14} />
                          </button>
                          {canReadNovedades && (
                            <button
                              onClick={() => handleViewNovedades(cuadrante)}
                              className="p-2 rounded-lg text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                              title="Ver/Gestionar Novedades"
                            >
                              <AlertTriangle size={14} />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => handleEditCuadrante(cuadrante)}
                              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Editar cuadrante"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteCuadrante(cuadrante)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Eliminar cuadrante"
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
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {cuadrantes.length} cuadrante{cuadrantes.length !== 1 ? "s" : ""} asignado{cuadrantes.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </>
        )}

        {/* Modal de Mapa */}
        <CuadranteMapaModal
          isOpen={showMapModal}
          cuadranteId={selectedCuadranteForMap}
          onClose={() => {
            setShowMapModal(false);
            setSelectedCuadranteForMap(null);
          }}
        />
      </div>
    </div>
  );
}
