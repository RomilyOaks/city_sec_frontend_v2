/**
 * File: src/pages/operativos/OperativosTurnoPage.jsx
 * @version 1.0.0
 * @description Página para gestión de operativos de patrullaje por turnos (Nivel 1)
 * Permite crear, editar, eliminar y visualizar turnos operativos con sus datos básicos.
 * @module src/pages/operativos/OperativosTurnoPage.jsx
 */

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  Calendar,
  User,
  Users,
  MapPin,
  PersonStanding,
} from "lucide-react";

import {
  listOperativosTurno,
  createOperativosTurno,
  updateOperativosTurno,
  deleteOperativosTurno,
} from "../../services/operativosTurnoService.js";
import { listPersonal } from "../../services/personalService.js";
import { listSectores } from "../../services/sectoresService.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { canPerformAction } from "../../rbac/rbac.js";
import OperativosVehiculosModal from "./vehiculos/OperativosVehiculosModal.jsx";
import OperativosPersonalModal from "./personal/OperativosPersonalModal.jsx";

// Opciones de turno según documentación
const TURNO_OPTIONS = [
  { value: "MAÑANA", label: "Mañana", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "TARDE", label: "Tarde", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  { value: "NOCHE", label: "Noche", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
];

// Función para obtener fecha actual en formato YYYY-MM-DD
const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función para obtener fecha/hora actual en formato YYYY-MM-DDTHH:mm
const getTodayDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Estado inicial del formulario
const initialFormData = {
  operador_id: "",
  supervisor_id: "",
  sector_id: "",
  fecha: getTodayDate(),
  fecha_hora_inicio: getTodayDateTime(),
  fecha_hora_fin: "",
  turno: "MAÑANA",
  estado: 1,
  observaciones: "",
};

/**
 * extractErrorMessage
 * Extrae mensaje de error legible desde la respuesta del backend
 */
function extractErrorMessage(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || "Error desconocido";

  // Si el backend ya envía un mensaje apropiado, usarlo directamente
  if (data.message) return data.message;
  if (data.error) return data.error;
  if (data.msg) return data.msg;

  // Manejar arrays de errores de validación
  if (data.errors && Array.isArray(data.errors)) {
    const messages = data.errors.map((e) => {
      const field = e.path || e.param || e.field || "";
      const msg = e.msg || e.message || "";
      return field ? `${field}: ${msg}` : msg;
    });
    return messages.join(". ");
  }

  return "Error de validación";
}

/**
 * formatDate
 * Formatea una fecha ISO a formato legible
 * Parsea como fecha local para evitar problemas de timezone
 */
const formatDate = (dateString) => {
  if (!dateString) return "—";

  // Si es solo fecha (YYYY-MM-DD), parsear como fecha local
  if (dateString.length === 10 && dateString.includes("-")) {
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  }

  // Si tiene hora, usar Date normal
  const date = new Date(dateString);
  return date.toLocaleDateString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * formatDateTime
 * Formatea una fecha/hora ISO a formato legible
 */
const formatDateTime = (dateString) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleString("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * OperativosTurnoPage - Página principal para gestión de turnos operativos
 * @component
 */
export default function OperativosTurnoPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canCreate = canPerformAction(user, "operativos_turnos_create");
  const canEdit = canPerformAction(user, "operativos_turnos_update");
  const canDelete = canPerformAction(user, "operativos_turnos_delete");

  // Estado principal
  const [operativos, setOperativos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  // Filtros
  const [searchTerm, setSearchTerm] = useState(""); // Valor inmediato del input
  const [search, setSearch] = useState(""); // Valor con debounce que se envía al backend
  const [isSearching, setIsSearching] = useState(false); // Indicador de búsqueda activa
  const [filterSector, setFilterSector] = useState("");
  const [filterFecha, setFilterFecha] = useState("");
  const [filterTurno, setFilterTurno] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOperativo, setEditingOperativo] = useState(null);
  const [viewingOperativo, setViewingOperativo] = useState(null);
  const [showVehiculosModal, setShowVehiculosModal] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Catálogos
  const [personal, setPersonal] = useState([]);
  const [sectores, setSectores] = useState([]);

  // Refs para mantener valores actualizados en event listeners
  const formDataRef = useRef(formData);
  const savingRef = useRef(saving);
  const showCreateModalRef = useRef(showCreateModal);
  const editingOperativoRef = useRef(editingOperativo);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);
  useEffect(() => {
    showCreateModalRef.current = showCreateModal;
  }, [showCreateModal]);
  useEffect(() => {
    editingOperativoRef.current = editingOperativo;
  }, [editingOperativo]);

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [personalRes, sectoresRes] = await Promise.all([
          listPersonal({ limit: 100 }),
          listSectores({ limit: 100 }),
        ]);

        // Manejar diferentes formatos de respuesta de personal
        let personalData = [];
        if (Array.isArray(personalRes)) {
          personalData = personalRes;
        } else if (personalRes?.personal && Array.isArray(personalRes.personal)) {
          personalData = personalRes.personal;
        } else if (personalRes?.data && Array.isArray(personalRes.data)) {
          personalData = personalRes.data;
        }

        // Filtrar solo personal activo
        const personalActivo = personalData.filter(
          (p) => p.estado === 1 || p.estado === true
        );

        // Manejar diferentes formatos de respuesta de sectores
        let sectoresData = [];
        if (Array.isArray(sectoresRes)) {
          sectoresData = sectoresRes;
        } else if (sectoresRes?.items && Array.isArray(sectoresRes.items)) {
          sectoresData = sectoresRes.items;
        } else if (sectoresRes?.data && Array.isArray(sectoresRes.data)) {
          sectoresData = sectoresRes.data;
        }

        setPersonal(personalActivo);
        setSectores(sectoresData);
      } catch (err) {
        console.error("Error cargando catálogos:", err);
        toast.error("Error al cargar catálogos. Verifica la configuración del backend.");
      }
    };
    loadCatalogos();
  }, []);

  /**
   * fetchOperativos
   * Consulta paginada de operativos con filtros
   */
  const fetchOperativos = async ({ nextPage = 1 } = {}) => {
    setLoading(true);
    try {
      const result = await listOperativosTurno({
        page: nextPage,
        limit: 15,
        sector_id: filterSector || undefined,
        fecha: filterFecha || undefined,
        turno: filterTurno || undefined,
        estado: filterEstado || undefined,
        search: search || undefined,
      });

      const items = result?.data || result || [];
      setOperativos(Array.isArray(items) ? items : []);
      setPagination(result?.pagination || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al cargar operativos");
    } finally {
      setLoading(false);
    }
  };

  // Debounce para el campo de búsqueda de texto
  // Espera 500ms después de que el usuario deje de escribir antes de aplicar el filtro
  useEffect(() => {
    // Si hay texto en búsqueda y es diferente al valor actual, activar indicador
    if (searchTerm !== search) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setSearch(searchTerm);
      setPage(1); // Resetear a página 1 cuando cambia la búsqueda
      setIsSearching(false); // Desactivar indicador cuando se ejecuta la búsqueda
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchOperativos({ nextPage: page });
  }, [page, filterSector, filterTurno, filterEstado, filterFecha, search]);

  // Pre-cargar operador_id cuando se abra el modal de creación
  useEffect(() => {
    if (showCreateModal && user?.personal_seguridad_id) {
      setFormData(prev => ({
        ...prev,
        operador_id: user.personal_seguridad_id
      }));
    }
  }, [showCreateModal, user]);

  const handleDelete = async (operativo) => {
    const confirmed = window.confirm(
      `¿Eliminar el turno operativo del ${formatDate(operativo.fecha)}?`
    );
    if (!confirmed) return;

    try {
      await deleteOperativosTurno(operativo.id);
      toast.success("Turno operativo eliminado");
      fetchOperativos({ nextPage: page });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al eliminar");
    }
  };

  const resetForm = () => {
    const operadorId = user?.personal_seguridad_id || "";

    setFormData({
      ...initialFormData,
      operador_id: operadorId,
    });
    setShowValidation(false);
  };

  /**
   * Validaciones frontend
   */
  const validateForm = () => {
    if (!formData.operador_id) {
      toast.error("Seleccione el operador del turno");
      return false;
    }

    if (!formData.sector_id) {
      toast.error("Seleccione el sector");
      return false;
    }

    if (!formData.fecha) {
      toast.error("Seleccione la fecha del turno");
      return false;
    }

    if (!formData.turno) {
      toast.error("Seleccione el turno (Mañana/Tarde/Noche)");
      return false;
    }

    // Validar que fecha_hora_fin sea posterior a fecha_hora_inicio si ambas están presentes
    if (formData.fecha_hora_inicio && formData.fecha_hora_fin) {
      const inicio = new Date(formData.fecha_hora_inicio);
      const fin = new Date(formData.fecha_hora_fin);
      if (fin <= inicio) {
        toast.error("La fecha/hora de fin debe ser posterior a la de inicio");
        return false;
      }
    }

    return true;
  };

  /**
   * handleCreate
   * Crea un nuevo turno operativo
   */
  const handleCreate = async () => {
    setShowValidation(true);
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Construir payload limpio
      const payload = {
        operador_id: Number(formData.operador_id),
        sector_id: Number(formData.sector_id),
        fecha: formData.fecha, // YYYY-MM-DD
        turno: formData.turno, // "MAÑANA" | "TARDE" | "NOCHE"
        estado: "ACTIVO", // "ACTIVO" | "INACTIVO"
      };

      // Agregar campos opcionales solo si tienen valor
      if (formData.supervisor_id) {
        payload.supervisor_id = Number(formData.supervisor_id);
      }
      if (formData.fecha_hora_inicio) {
        payload.fecha_hora_inicio = formData.fecha_hora_inicio; // YYYY-MM-DDTHH:mm
      }
      if (formData.fecha_hora_fin) {
        payload.fecha_hora_fin = formData.fecha_hora_fin; // YYYY-MM-DDTHH:mm
      }
      if (formData.observaciones?.trim()) {
        payload.observaciones = formData.observaciones.trim();
      }

      console.log('📤 Payload completo a enviar:', JSON.stringify(payload, null, 2));

      await createOperativosTurno(payload);
      toast.success("Turno operativo creado exitosamente");
      setShowCreateModal(false);
      resetForm();
      fetchOperativos({ nextPage: 1 });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /**
   * handleUpdate
   * Actualiza un turno operativo existente
   */
  const handleUpdate = async () => {
    if (!editingOperativo) return;
    setShowValidation(true);
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        operador_id: Number(formData.operador_id),
        sector_id: Number(formData.sector_id),
        fecha: formData.fecha,
        turno: formData.turno,
        estado: formData.estado === "ACTIVO" || formData.estado === 1 || formData.estado === true ? "ACTIVO" : "INACTIVO",
      };

      // Agregar campos opcionales solo si tienen valor
      if (formData.supervisor_id) {
        payload.supervisor_id = Number(formData.supervisor_id);
      }
      if (formData.fecha_hora_inicio) {
        payload.fecha_hora_inicio = formData.fecha_hora_inicio;
      }
      if (formData.fecha_hora_fin) {
        payload.fecha_hora_fin = formData.fecha_hora_fin;
      }
      if (formData.observaciones?.trim()) {
        payload.observaciones = formData.observaciones.trim();
      }

      await updateOperativosTurno(editingOperativo.id, payload);
      toast.success("Turno operativo actualizado exitosamente");
      setEditingOperativo(null);
      resetForm();
      fetchOperativos({ nextPage: page });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /**
   * openEditModal
   * Abre modal de edición con datos precargados
   */
  const openEditModal = (operativo) => {
    setEditingOperativo(operativo);
    setFormData({
      operador_id: operativo.operador_id || "",
      supervisor_id: operativo.supervisor_id || "",
      sector_id: operativo.sector_id || "",
      fecha: operativo.fecha ? operativo.fecha.split("T")[0] : "",
      fecha_hora_inicio: operativo.fecha_hora_inicio
        ? new Date(operativo.fecha_hora_inicio).toISOString().slice(0, 16)
        : "",
      fecha_hora_fin: operativo.fecha_hora_fin
        ? new Date(operativo.fecha_hora_fin).toISOString().slice(0, 16)
        : "",
      turno: operativo.turno || "MAÑANA",
      estado: operativo.estado === "ACTIVO" ? 1 : 0, // Convertir string a número para el checkbox
      observaciones: operativo.observaciones || "",
    });
  };

  /**
   * getTurnoColor
   * Retorna clases CSS para el badge del turno
   */
  const getTurnoColor = (turno) => {
    const turnoOption = TURNO_OPTIONS.find((t) => t.value === turno);
    return turnoOption?.color || "bg-slate-100 text-slate-800";
  };

  /**
   * getPersonalNombre
   * Obtiene el nombre completo del personal
   */
  const getPersonalNombre = (personalId) => {
    const persona = personal.find((p) => p.id === personalId);
    if (!persona) return "—";
    return `${persona.nombres} ${persona.apellido_paterno} ${persona.apellido_materno || ""}`.trim();
  };

  /**
   * getSectorNombre
   * Obtiene el nombre del sector
   */
  const getSectorNombre = (sectorId) => {
    const sector = sectores.find((s) => s.id === sectorId);
    return sector?.nombre || sector?.sector || "—";
  };

  /**
   * formatPersonalNombre
   * Formatea el nombre completo del personal desde el objeto anidado del backend
   */
  const formatPersonalNombre = (personalObj) => {
    if (!personalObj) return "—";
    const partes = [
      personalObj.nombres,
      personalObj.apellido_paterno,
      personalObj.apellido_materno
    ].filter(Boolean);
    return partes.join(' ').trim() || "—";
  };

  // Hotkeys: Alt+N (Nuevo), Alt+G (Guardar), Escape (Cerrar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (showCreateModalRef.current && !savingRef.current) {
          document.getElementById("btn-crear-operativo")?.click();
        } else if (editingOperativoRef.current && !savingRef.current) {
          document.getElementById("btn-guardar-operativo")?.click();
        }
      }

      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (canCreate && !showCreateModal && !editingOperativo) {
          setShowCreateModal(true);
        }
      }

      if (e.key === "Escape") {
        if (showCreateModal) {
          setShowCreateModal(false);
          resetForm();
        } else if (editingOperativo) {
          setEditingOperativo(null);
          resetForm();
        } else if (viewingOperativo) {
          setViewingOperativo(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCreateModal, editingOperativo, viewingOperativo, canCreate]);

  /**
   * renderForm
   * Renderiza el formulario de creación/edición
   */
  const renderForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Operador */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            <User size={16} className="inline mr-1" />
            Operador * {!editingOperativo && <span className="text-xs text-slate-500 dark:text-slate-400">(Pre-cargado)</span>}
          </label>
          <select
            value={formData.operador_id}
            onChange={(e) =>
              setFormData({ ...formData, operador_id: e.target.value })
            }
            disabled={!editingOperativo}
            className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-50 ${
              !editingOperativo
                ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed'
                : 'bg-white dark:bg-slate-950/40'
            }`}
          >
            <option value="">— Seleccione operador —</option>
            {personal.length === 0 ? (
              <option value="" disabled>No hay personal disponible</option>
            ) : (
              personal.map((p) => {
                const nombreCompleto = [
                  p.nombres,
                  p.apellido_paterno,
                  p.apellido_materno
                ].filter(Boolean).join(' ');
                const tipoDoc = p.doc_tipo || 'DNI';
                const numeroDoc = p.dni || p.doc_numero || '';
                return (
                  <option key={p.id} value={p.id}>
                    {nombreCompleto}{numeroDoc ? ` - ${tipoDoc} ${numeroDoc}` : ''}
                  </option>
                );
              })
            )}
          </select>
          {showValidation && personal.length === 0 && (
            <p className="mt-1 text-xs text-red-500">
              No se encontró personal activo. Verifica que existan usuarios con estado activo.
            </p>
          )}
        </div>

        {/* Sector */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            <MapPin size={16} className="inline mr-1" />
            Sector * {editingOperativo && <span className="text-xs text-slate-500 dark:text-slate-400">(No editable)</span>}
          </label>
          <select
            value={formData.sector_id}
            onChange={(e) => {
              const sectorId = e.target.value;
              const sectorSeleccionado = sectores.find(s => s.id === Number(sectorId));

              // Auto-cargar el supervisor del sector si existe
              const nuevoSupervisor = sectorSeleccionado?.supervisor_id || "";

              setFormData({
                ...formData,
                sector_id: sectorId,
                supervisor_id: nuevoSupervisor
              });
            }}
            disabled={!!editingOperativo}
            className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-50 ${
              editingOperativo
                ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed'
                : 'bg-white dark:bg-slate-950/40'
            }`}
          >
            <option value="">— Seleccione sector —</option>
            {sectores.length === 0 ? (
              <option value="" disabled>No hay sectores disponibles</option>
            ) : (
              sectores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre || s.sector || `Sector ${s.id}`}
                </option>
              ))
            )}
          </select>
          {showValidation && sectores.length === 0 && (
            <p className="mt-1 text-xs text-red-500">
              No se encontraron sectores. Verifica que existan sectores activos en el sistema.
            </p>
          )}
        </div>

        {/* Supervisor */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            <Users size={16} className="inline mr-1" />
            Supervisor (opcional) {formData.sector_id && <span className="text-xs text-slate-500 dark:text-slate-400">(Auto-cargado del sector)</span>}
          </label>
          <select
            value={formData.supervisor_id}
            onChange={(e) =>
              setFormData({ ...formData, supervisor_id: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
          >
            <option value="">— Sin supervisor —</option>
            {personal.map((p) => {
              const nombreCompleto = [
                p.nombres,
                p.apellido_paterno,
                p.apellido_materno
              ].filter(Boolean).join(' ');
              const tipoDoc = p.doc_tipo || 'DNI';
              const numeroDoc = p.dni || p.doc_numero || '';
              return (
                <option key={p.id} value={p.id}>
                  {nombreCompleto}{numeroDoc ? ` - ${tipoDoc} ${numeroDoc}` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            <Calendar size={16} className="inline mr-1" />
            Fecha * {editingOperativo && <span className="text-xs text-slate-500 dark:text-slate-400">(No editable)</span>}
          </label>
          <input
            type="date"
            value={formData.fecha}
            onChange={(e) =>
              setFormData({ ...formData, fecha: e.target.value })
            }
            disabled={!!editingOperativo}
            className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-50 ${
              editingOperativo
                ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed'
                : 'bg-white dark:bg-slate-950/40'
            }`}
          />
        </div>

        {/* Turno */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            <Clock size={16} className="inline mr-1" />
            Turno * {editingOperativo && <span className="text-xs text-slate-500 dark:text-slate-400">(No editable)</span>}
          </label>
          <select
            value={formData.turno}
            onChange={(e) =>
              setFormData({ ...formData, turno: e.target.value })
            }
            disabled={!!editingOperativo}
            className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-50 ${
              editingOperativo
                ? 'bg-slate-100 dark:bg-slate-800/50 cursor-not-allowed'
                : 'bg-white dark:bg-slate-950/40'
            }`}
          >
            {TURNO_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha/Hora Inicio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            Fecha/Hora Inicio
          </label>
          <input
            type="datetime-local"
            value={formData.fecha_hora_inicio}
            onChange={(e) =>
              setFormData({ ...formData, fecha_hora_inicio: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
          />
        </div>

        {/* Fecha/Hora Fin */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            Fecha/Hora Fin
          </label>
          <input
            type="datetime-local"
            value={formData.fecha_hora_fin}
            onChange={(e) =>
              setFormData({ ...formData, fecha_hora_fin: e.target.value })
            }
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
          />
        </div>

        {/* Observaciones */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            Observaciones
          </label>
          <textarea
            value={formData.observaciones}
            onChange={(e) =>
              setFormData({ ...formData, observaciones: e.target.value })
            }
            rows={3}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            placeholder="Notas adicionales sobre el turno operativo..."
          />
        </div>

        {/* Estado */}
        <div className="col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.estado === 1}
              onChange={(e) =>
                setFormData({ ...formData, estado: e.target.checked ? 1 : 0 })
              }
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Turno Activo
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Operativos por Turnos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestión de turnos operativos de patrullaje
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchOperativos({ nextPage: page })}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Refrescar
          </button>
          {canCreate && (
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-700 text-white px-4 py-2 text-sm font-medium hover:bg-primary-800"
            >
              <Plus size={16} />
              Nuevo Turno
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Filtro Fecha */}
          <input
            type="date"
            value={filterFecha}
            onChange={(e) => {
              setFilterFecha(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
          />

          {/* Filtro Turno */}
          <select
            value={filterTurno}
            onChange={(e) => {
              setFilterTurno(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
          >
            <option value="">Todos los turnos</option>
            {TURNO_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Filtro Sector */}
          <select
            value={filterSector}
            onChange={(e) => {
              setFilterSector(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
          >
            <option value="">Todos los sectores</option>
            {sectores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre || s.sector}
              </option>
            ))}
          </select>

          {/* Búsqueda por Supervisor/Operador */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Supervisor/Operador..."
              className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isSearching && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {searchTerm && !isSearching && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setPage(1);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                  title="Limpiar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Filtro Estado */}
          <select
            value={filterEstado}
            onChange={(e) => {
              setFilterEstado(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
          >
            <option value="">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="CERRADO">Cerrado</option>
            <option value="ANULADO">Anulado</option>
          </select>

          {/* Botón Limpiar Filtros */}
          {(searchTerm || filterSector || filterTurno || filterFecha || filterEstado !== "") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterSector("");
                setFilterTurno("");
                setFilterFecha("");
                setFilterEstado("");
                setPage(1);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 p-2 text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Limpiar todos los filtros"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Turno
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Sector
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Supervisor
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Operador
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Estado
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Cargando...
                  </td>
                </tr>
              ) : operativos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No hay registros
                  </td>
                </tr>
              ) : (
                operativos.map((op) => (
                  <tr
                    key={op.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {formatDate(op.fecha)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getTurnoColor(
                          op.turno
                        )}`}
                      >
                        {TURNO_OPTIONS.find((t) => t.value === op.turno)?.label || op.turno}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {getSectorNombre(op.sector_id)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {op.supervisor ? formatPersonalNombre(op.supervisor) : (op.supervisor_id ? getPersonalNombre(op.supervisor_id) : "—")}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {op.operador ? formatPersonalNombre(op.operador) : getPersonalNombre(op.operador_id)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          op.estado === "ACTIVO"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {op.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botón Vehículos (patrullaje motorizado) */}
                        <button
                          onClick={() => {
                            navigate(`/operativos/turnos/${op.id}/vehiculos?sector_id=${op.sector_id}`);
                          }}
                          className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          title="Vehículos del turno"
                        >
                          <Car size={14} />
                        </button>
                        {/* Botón Personal (patrullaje a pie) */}
                        <button
                          onClick={() => {
                            setSelectedTurno(op);
                            setShowPersonalModal(true);
                          }}
                          className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                          title="Personal a pie del turno"
                        >
                          <PersonStanding size={14} />
                        </button>
                        <button
                          onClick={() => setViewingOperativo(op)}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Ver detalle"
                        >
                          <Eye size={14} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => openEditModal(op)}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(op)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Página {pagination.page} de {pagination.totalPages} ({pagination.total} registros)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Nuevo Turno Operativo
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">{renderForm()}</div>
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400">
                Alt+G = Guardar | Esc = Cancelar
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  id="btn-crear-operativo"
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Crear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editingOperativo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Editar Turno Operativo
              </h2>
              <button
                onClick={() => {
                  setEditingOperativo(null);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">{renderForm()}</div>
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400">
                Alt+G = Guardar | Esc = Cancelar
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingOperativo(null);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  id="btn-guardar-operativo"
                  onClick={handleUpdate}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalle */}
      {viewingOperativo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Detalle del Turno Operativo
              </h2>
              <button
                onClick={() => setViewingOperativo(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Header del turno */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                    {formatDate(viewingOperativo.fecha)}
                  </h3>
                  <p className="text-slate-500">
                    Turno {TURNO_OPTIONS.find((t) => t.value === viewingOperativo.turno)?.label}
                  </p>
                </div>
              </div>

              {/* Grid de información */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Operador</p>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {viewingOperativo.operador ? formatPersonalNombre(viewingOperativo.operador) : getPersonalNombre(viewingOperativo.operador_id)}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Supervisor</p>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {viewingOperativo.supervisor
                      ? formatPersonalNombre(viewingOperativo.supervisor)
                      : (viewingOperativo.supervisor_id ? getPersonalNombre(viewingOperativo.supervisor_id) : "Sin supervisor")}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Sector</p>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {getSectorNombre(viewingOperativo.sector_id)}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Turno</p>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getTurnoColor(
                      viewingOperativo.turno
                    )}`}
                  >
                    {TURNO_OPTIONS.find((t) => t.value === viewingOperativo.turno)?.label}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Hora Inicio</p>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {formatDateTime(viewingOperativo.fecha_hora_inicio)}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Hora Fin</p>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {formatDateTime(viewingOperativo.fecha_hora_fin)}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Estado</p>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      viewingOperativo.estado === "ACTIVO"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {viewingOperativo.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              {/* Observaciones */}
              {viewingOperativo.observaciones && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
                    Observaciones
                  </p>
                  <p className="text-slate-900 dark:text-slate-50">
                    {viewingOperativo.observaciones}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewingOperativo(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Vehículos (patrullaje motorizado) */}
      <OperativosVehiculosModal
        isOpen={showVehiculosModal}
        onClose={() => {
          setShowVehiculosModal(false);
          setSelectedTurno(null);
        }}
        turno={selectedTurno}
      />

      {/* Modal Personal (patrullaje a pie) */}
      <OperativosPersonalModal
        isOpen={showPersonalModal}
        onClose={() => {
          setShowPersonalModal(false);
          setSelectedTurno(null);
        }}
        turno={selectedTurno}
      />
    </div>
  );
}
