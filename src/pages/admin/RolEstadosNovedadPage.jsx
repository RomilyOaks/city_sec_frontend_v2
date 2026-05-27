/**
 * File: src/pages/admin/RolEstadosNovedadPage.jsx
 * @version 1.2.0
 * @description Panel CRUD para la configuración de estados de novedad por rol.
 * Permite a super_admin y admin definir qué estados puede usar cada rol.
 *
 * CHANGELOG v1.2.0:
 * - Fix dark mode: badge "Estado de Novedad" usa dot de color + texto Tailwind legible
 * - Nuevo modal "Copiar estados": copia configuraciones de un rol origen a un rol destino
 */

import { useState, useEffect, useCallback, useRef } from "react";
import useBodyScrollLock from "../../hooks/useBodyScrollLock.js";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
  Shield,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  XCircle,
  Copy,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import {
  listRolEstadosNovedad,
  createRolEstadoNovedad,
  updateRolEstadoNovedad,
  toggleRolEstadoNovedad,
  deleteRolEstadoNovedad,
} from "../../services/rolEstadosNovedadService";
import { listRoles } from "../../services/rolesService";
import { listEstadosNovedad } from "../../services/novedadesService";

// ── Formulario vacío ──────────────────────────────────────────────
const EMPTY_FORM = {
  rol_id: "",
  estado_novedad_id: "",
  descripcion: "",
  observaciones: "",
};

// ── Badge de estado de novedad (dark-mode safe) ───────────────────
function EstadoBadge({ estado }) {
  if (!estado) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-800 dark:text-slate-100 border"
      style={{
        backgroundColor: `${estado.color}22`,
        borderColor: `${estado.color}55`,
      }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: estado.color }}
      />
      {estado.nombre}
    </span>
  );
}

export default function RolEstadosNovedadPage() {
  // ── Datos ─────────────────────────────────────────────────────
  const [registros, setRegistros] = useState([]);
  const [roles, setRoles] = useState([]);
  const [estados, setEstados] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // ── Filtros ───────────────────────────────────────────────────
  const [filterRol, setFilterRol] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterActivo, setFilterActivo] = useState("");
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);

  // ── UI ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  // ── Estado modal Copiar ───────────────────────────────────────
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyRolOrigen, setCopyRolOrigen] = useState("");
  const [copyRolDestino, setCopyRolDestino] = useState("");
  const [copyPreview, setCopyPreview] = useState(null); // { toCopy: [], alreadyExist: [] }
  const [copySelected, setCopySelected] = useState(new Set()); // ids de estado_novedad seleccionados
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [copying, setCopying] = useState(false);

  // ── Bloquear scroll exterior cuando el modal de copia está abierto ─
  useBodyScrollLock(showCopyModal);

  // ── Refs ──────────────────────────────────────────────────────
  const rolSelectRef = useRef(null);
  const estadoSelectRef = useRef(null);
  const descripcionRef = useRef(null);
  const observacionesRef = useRef(null);
  const submitBtnRef = useRef(null);

  const focusNext = (nextRef) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef.current?.focus();
    }
  };

  // ── Cargar catálogos ──────────────────────────────────────────
  const fetchCatalogos = useCallback(async () => {
    try {
      const [rolesData, estadosData] = await Promise.all([
        listRoles(),
        listEstadosNovedad(),
      ]);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setEstados(Array.isArray(estadosData) ? estadosData : []);
    } catch {
      toast.error("Error al cargar catálogos");
    }
  }, []);

  // ── Cargar registros ──────────────────────────────────────────
  const fetchRegistros = useCallback(async (pg = 1, limit = 20) => {
    setLoading(true);
    try {
      const params = { page: pg, limit };
      if (filterRol) params.rol_id = filterRol;
      if (filterEstado) params.estado_novedad_id = filterEstado;
      if (filterActivo !== "") params.estado = filterActivo;
      const res = await listRolEstadosNovedad(params);
      setRegistros(Array.isArray(res.data) ? res.data : []);
      if (res.pagination) setPagination(res.pagination);
    } catch {
      toast.error("Error al cargar configuraciones");
    } finally {
      setLoading(false);
    }
  }, [filterRol, filterEstado, filterActivo]);

  useEffect(() => { fetchCatalogos(); }, [fetchCatalogos]);

  // Cuando hay búsqueda de texto activa: fetch con limit alto desde pág. 1 (debounce 400ms)
  // Cuando no hay texto: fetch normal paginado con limit 20 (inmediato)
  useEffect(() => {
    const delay = searchText ? 400 : 0;
    const timer = setTimeout(() => {
      if (searchText) {
        fetchRegistros(1, 200);
      } else {
        fetchRegistros(page, 20);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [fetchRegistros, page, searchText]);

  // ── Hotkeys ALT+N / ALT+C ────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (!showModal && !showDeleteModal && !showCopyModal) handleOpenCreate();
      }
      if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        if (showModal) submitBtnRef.current?.click();
      }
      if (e.key === "Escape") {
        if (showCopyModal) closeCopyModal();
        else if (showModal) setShowModal(false);
        else if (showDeleteModal) { setShowDeleteModal(false); setDeletingItem(null); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal, showDeleteModal, showCopyModal]);

  // ── Filtrado local por texto ──────────────────────────────────
  const registrosFiltrados = registros.filter((r) => {
    if (!searchText) return true;
    const txt = searchText.toLowerCase();
    const rol = (r.rolRolEstadoNovedad?.nombre || "").toLowerCase();
    const est = (r.estadoNovedadRolEstadoNovedad?.nombre || "").toLowerCase();
    const desc = (r.descripcion || "").toLowerCase();
    return rol.includes(txt) || est.includes(txt) || desc.includes(txt);
  });

  // ── Estados ya asignados para un rol ─────────────────────────
  const estadosAsignados = useCallback((rolId) => {
    if (!rolId) return new Set();
    return new Set(
      registros
        .filter((r) => String(r.rol_id) === String(rolId))
        .map((r) => r.estado_novedad_id)
    );
  }, [registros]);

  // ── Abrir modal Crear ─────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
    setTimeout(() => rolSelectRef.current?.focus(), 50);
  };

  // ── Abrir modal Editar ────────────────────────────────────────
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      rol_id: item.rol_id,
      estado_novedad_id: item.estado_novedad_id,
      descripcion: item.descripcion || "",
      observaciones: item.observaciones || "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  // ── Validar formulario ────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!formData.rol_id) errs.rol_id = "Seleccione un rol";
    if (!formData.estado_novedad_id) errs.estado_novedad_id = "Seleccione un estado";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Guardar (Crear / Actualizar) ──────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingItem) {
        await updateRolEstadoNovedad(editingItem.id, {
          descripcion: formData.descripcion || null,
          observaciones: formData.observaciones || null,
        });
        toast.success("Configuración actualizada");
      } else {
        await createRolEstadoNovedad({
          rol_id: Number(formData.rol_id),
          estado_novedad_id: Number(formData.estado_novedad_id),
          descripcion: formData.descripcion || null,
          observaciones: formData.observaciones || null,
        });
        toast.success("Configuración creada");
      }
      setShowModal(false);
      fetchRegistros(page);
    } catch (err) {
      const msg = err?.response?.data?.message || "Error al guardar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle activo/inactivo ────────────────────────────────────
  const handleToggle = async (item) => {
    try {
      await toggleRolEstadoNovedad(item.id, !item.estado);
      toast.success(item.estado ? "Configuración desactivada" : "Configuración activada");
      fetchRegistros(page);
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  // ── Eliminar ──────────────────────────────────────────────────
  const handleOpenDelete = (item) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteRolEstadoNovedad(deletingItem.id);
      toast.success("Configuración eliminada");
      setShowDeleteModal(false);
      setDeletingItem(null);
      fetchRegistros(page);
    } catch {
      toast.error("Error al eliminar");
    }
  };

  // ── Modal Copiar: abrir / cerrar ──────────────────────────────
  const openCopyModal = () => {
    setCopyRolOrigen("");
    setCopyRolDestino("");
    setCopyPreview(null);
    setShowCopyModal(true);
  };

  const closeCopyModal = () => {
    if (copying) return;
    setShowCopyModal(false);
    setCopyRolOrigen("");
    setCopyRolDestino("");
    setCopyPreview(null);
    setCopySelected(new Set());
  };

  // ── Modal Copiar: calcular preview cuando ambos roles están seleccionados
  useEffect(() => {
    if (!copyRolOrigen || !copyRolDestino) {
      setCopyPreview(null);
      return;
    }
    if (copyRolOrigen === copyRolDestino) {
      setCopyPreview(null);
      return;
    }

    const calcPreview = async () => {
      setLoadingPreview(true);
      try {
        const [origenRes, destinoRes] = await Promise.all([
          listRolEstadosNovedad({ rol_id: copyRolOrigen, limit: 200 }),
          listRolEstadosNovedad({ rol_id: copyRolDestino, limit: 200 }),
        ]);

        const origenItems = Array.isArray(origenRes.data) ? origenRes.data : [];
        const destinoItems = Array.isArray(destinoRes.data) ? destinoRes.data : [];

        const destinoIds = new Set(destinoItems.map((r) => r.estado_novedad_id));

        const toCopy = origenItems.filter((r) => !destinoIds.has(r.estado_novedad_id));
        const alreadyExist = origenItems.filter((r) => destinoIds.has(r.estado_novedad_id));

        setCopyPreview({ toCopy, alreadyExist });
        // Auto-seleccionar todos los estados disponibles para copiar
        setCopySelected(new Set(toCopy.map((r) => r.estado_novedad_id)));
      } catch {
        toast.error("Error al calcular el preview");
        setCopyPreview(null);
      } finally {
        setLoadingPreview(false);
      }
    };

    calcPreview();
  }, [copyRolOrigen, copyRolDestino]);

  // ── Helpers checkboxes ────────────────────────────────────────
  const toggleCopyItem = (estadoId) => {
    setCopySelected((prev) => {
      const next = new Set(prev);
      if (next.has(estadoId)) next.delete(estadoId);
      else next.add(estadoId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!copyPreview?.toCopy?.length) return;
    const allIds = copyPreview.toCopy.map((r) => r.estado_novedad_id);
    const allSelected = allIds.every((id) => copySelected.has(id));
    setCopySelected(allSelected ? new Set() : new Set(allIds));
  };

  // ── Modal Copiar: ejecutar copia ──────────────────────────────
  const handleCopy = async () => {
    if (!copyPreview?.toCopy?.length || copySelected.size === 0) return;
    const itemsToCopy = copyPreview.toCopy.filter((r) => copySelected.has(r.estado_novedad_id));
    setCopying(true);
    const toastId = toast.loading(`Copiando ${itemsToCopy.length} estado(s)...`);
    let ok = 0;
    let fail = 0;
    try {
      for (const item of itemsToCopy) {
        try {
          await createRolEstadoNovedad({
            rol_id: Number(copyRolDestino),
            estado_novedad_id: item.estado_novedad_id,
            descripcion: item.descripcion || null,
            observaciones: item.observaciones || null,
          });
          ok++;
        } catch {
          fail++;
        }
      }
      toast.dismiss(toastId);
      if (fail === 0) {
        toast.success(`${ok} estado(s) copiado(s) correctamente`);
      } else {
        toast.error(`${ok} copiado(s), ${fail} fallido(s). Revisa duplicados.`);
      }
      closeCopyModal();
      fetchRegistros(page);
    } catch {
      toast.dismiss(toastId);
      toast.error("Error al copiar estados");
    } finally {
      setCopying(false);
    }
  };

  // ── Helpers CSS ───────────────────────────────────────────────
  const clsInput =
    "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500";
  const clsInputError =
    "mt-1 w-full rounded-lg border border-red-400 dark:border-red-600 bg-white dark:bg-slate-950/40 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-red-400";
  const clsReadonly =
    "mt-1 w-full rounded-lg border border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 cursor-not-allowed";
  const clsSelect =
    "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500";

  const rolOrigenNombre = roles.find((r) => String(r.id) === String(copyRolOrigen))?.nombre || "";
  const rolDestinoNombre = roles.find((r) => String(r.id) === String(copyRolDestino))?.nombre || "";

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Shield size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Estados de Novedad por Rol
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Configura qué estados puede gestionar cada rol del sistema
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchRegistros(page)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw size={15} />
            Actualizar
          </button>
          <button
            onClick={openCopyModal}
            className="inline-flex items-center gap-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
          >
            <Copy size={15} />
            Copiar estados
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <Plus size={15} />
            Nueva configuración
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar rol, estado, descripción..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => { setSearchText(""); fetchRegistros(page); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Limpiar búsqueda"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <select
            value={filterRol}
            onChange={(e) => { setFilterRol(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
          >
            <option value="">Todos los roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
          <select
            value={filterEstado}
            onChange={(e) => { setFilterEstado(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
          >
            <option value="">Todos los estados</option>
            {estados.map((e) => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
          <select
            value={filterActivo}
            onChange={(e) => { setFilterActivo(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
          >
            <option value="">Activos e inactivos</option>
            <option value="1">Solo activos</option>
            <option value="0">Solo inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Cargando...
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Shield size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No hay configuraciones que mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado de Novedad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Activo</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {registrosFiltrados.map((item) => {
                  const rol = item.rolRolEstadoNovedad;
                  const est = item.estadoNovedadRolEstadoNovedad;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs">{item.id}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50 text-xs font-medium">
                          <Shield size={11} />
                          {rol?.nombre || `Rol #${item.rol_id}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={est} />
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {item.descripcion || <span className="text-slate-300 dark:text-slate-600 italic">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggle(item)}
                          title={item.estado ? "Desactivar" : "Activar"}
                          className="inline-flex items-center justify-center"
                        >
                          {item.estado ? (
                            <CheckCircle size={18} className="text-emerald-500" />
                          ) : (
                            <XCircle size={18} className="text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-primary-600"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleToggle(item)}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-amber-500"
                            title={item.estado ? "Desactivar" : "Activar"}
                          >
                            {item.estado ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                          </button>
                          <button
                            onClick={() => handleOpenDelete(item)}
                            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación / contador de búsqueda */}
        {searchText ? (
          registrosFiltrados.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {registrosFiltrados.length} resultado(s) para &ldquo;<strong className="text-slate-700 dark:text-slate-200">{searchText}</strong>&rdquo;
              </p>
            </div>
          )
        ) : (
          pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pagination.total} registros · Página {pagination.page} de {pagination.totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* ── Modal Crear / Editar ─────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {editingItem ? "Editar configuración" : "Nueva configuración"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Rol <span className="text-red-500">*</span>
                </label>
                <select
                  ref={rolSelectRef}
                  value={formData.rol_id}
                  onChange={(e) => setFormData({ ...formData, rol_id: e.target.value, estado_novedad_id: "" })}
                  onKeyDown={focusNext(editingItem ? descripcionRef : estadoSelectRef)}
                  disabled={!!editingItem}
                  className={editingItem ? clsReadonly : (formErrors.rol_id ? clsInputError : clsInput)}
                >
                  <option value="">Seleccione un rol...</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
                {formErrors.rol_id && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.rol_id}</p>
                )}
                {editingItem && (
                  <p className="text-xs text-slate-400 mt-1">El rol no puede modificarse. Elimine y cree uno nuevo si necesita cambiar la combinación.</p>
                )}
              </div>

              {/* Estado de Novedad */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Estado de Novedad <span className="text-red-500">*</span>
                </label>
                {!editingItem && !formData.rol_id ? (
                  <p className="mt-1 text-xs text-slate-400 italic">Primero seleccione un rol para ver los estados disponibles.</p>
                ) : (() => {
                  const asignados = estadosAsignados(formData.rol_id);
                  const disponibles = estados.filter((e) => !asignados.has(e.id));
                  return !editingItem && disponibles.length === 0 ? (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Este rol ya tiene asignados todos los estados de novedad disponibles.
                    </p>
                  ) : (
                    <select
                      ref={estadoSelectRef}
                      value={formData.estado_novedad_id}
                      onChange={(e) => setFormData({ ...formData, estado_novedad_id: e.target.value })}
                      onKeyDown={focusNext(descripcionRef)}
                      disabled={!!editingItem}
                      className={editingItem ? clsReadonly : (formErrors.estado_novedad_id ? clsInputError : clsInput)}
                    >
                      <option value="">Seleccione un estado...</option>
                      {editingItem
                        ? estados.map((e) => (
                            <option key={e.id} value={e.id}>{e.nombre}</option>
                          ))
                        : disponibles.map((e) => (
                            <option key={e.id} value={e.id}>{e.nombre}</option>
                          ))
                      }
                    </select>
                  );
                })()}
                {formErrors.estado_novedad_id && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.estado_novedad_id}</p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Descripción <span className="text-slate-400 text-xs">(opcional)</span>
                </label>
                <textarea
                  ref={descripcionRef}
                  rows={2}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Ej: El supervisor puede marcar novedades como despachadas"
                  className={clsInput}
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Observaciones <span className="text-slate-400 text-xs">(opcional)</span>
                </label>
                <textarea
                  ref={observacionesRef}
                  rows={2}
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Notas adicionales..."
                  className={clsInput}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  ref={submitBtnRef}
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
                  title={!editingItem ? "Alt+C" : undefined}
                >
                  {saving ? "Guardando..." : editingItem ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Confirmar Eliminar ──────────────────────────────── */}
      {showDeleteModal && deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-50">Eliminar configuración</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              ¿Deseas eliminar la configuración{" "}
              <strong>{deletingItem.rolRolEstadoNovedad?.nombre}</strong>
              {" → "}
              <strong>{deletingItem.estadoNovedadRolEstadoNovedad?.nombre}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowDeleteModal(false); setDeletingItem(null); }}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Copiar Estados ──────────────────────────────────── */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Copy size={18} className="text-indigo-500" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Copiar estados entre roles
                </h2>
              </div>
              <button
                onClick={closeCopyModal}
                disabled={copying}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Selección de roles */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                {/* Rol origen */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Rol origen
                  </label>
                  <select
                    value={copyRolOrigen}
                    onChange={(e) => setCopyRolOrigen(e.target.value)}
                    disabled={copying}
                    className={clsSelect}
                  >
                    <option value="">Seleccionar...</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Flecha central */}
                <div className="pb-2">
                  <ArrowRight size={20} className="text-slate-400 dark:text-slate-500" />
                </div>

                {/* Rol destino */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Rol destino
                  </label>
                  <select
                    value={copyRolDestino}
                    onChange={(e) => setCopyRolDestino(e.target.value)}
                    disabled={copying}
                    className={clsSelect}
                  >
                    <option value="">Seleccionar...</option>
                    {roles
                      .filter((r) => String(r.id) !== String(copyRolOrigen))
                      .map((r) => (
                        <option key={r.id} value={r.id}>{r.nombre}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Mismo rol seleccionado */}
              {copyRolOrigen && copyRolDestino && copyRolOrigen === copyRolDestino && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-sm">
                  <AlertCircle size={15} className="shrink-0" />
                  El rol origen y destino no pueden ser el mismo.
                </div>
              )}

              {/* Loading preview */}
              {loadingPreview && (
                <div className="flex items-center justify-center py-6 text-slate-400 text-sm gap-2">
                  <RefreshCw size={16} className="animate-spin" />
                  Calculando estados a copiar...
                </div>
              )}

              {/* Preview */}
              {copyPreview && !loadingPreview && (
                <div className="space-y-3">
                  {/* Se copiarán — grid con checkboxes */}
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {/* Header con toggle-all */}
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {copyPreview.toCopy.length > 0 && (
                          <input
                            type="checkbox"
                            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 accent-primary-600 cursor-pointer"
                            checked={copyPreview.toCopy.every((r) => copySelected.has(r.estado_novedad_id))}
                            onChange={toggleSelectAll}
                            title="Seleccionar / deseleccionar todos"
                          />
                        )}
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          Disponibles para copiar
                        </span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        copySelected.size > 0
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                      }`}>
                        {copySelected.size} / {copyPreview.toCopy.length} seleccionado(s)
                      </span>
                    </div>

                    {copyPreview.toCopy.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 italic">
                        El rol destino ya tiene todos los estados del rol origen.
                      </p>
                    ) : (
                      <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                        {copyPreview.toCopy.map((item) => {
                          const isChecked = copySelected.has(item.estado_novedad_id);
                          return (
                            <li
                              key={item.id}
                              onClick={() => toggleCopyItem(item.estado_novedad_id)}
                              className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors ${
                                isChecked
                                  ? "bg-primary-50/60 dark:bg-primary-900/10"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleCopyItem(item.estado_novedad_id)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 accent-primary-600 cursor-pointer shrink-0"
                              />
                              <EstadoBadge estado={item.estadoNovedadRolEstadoNovedad} />
                              {item.descripcion && (
                                <span className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                  {item.descripcion}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Ya existen */}
                  {copyPreview.alreadyExist.length > 0 && (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          Ya existen en destino (se omitirán)
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                          {copyPreview.alreadyExist.length}
                        </span>
                      </div>
                      <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-28 overflow-y-auto">
                        {copyPreview.alreadyExist.map((item) => (
                          <li key={item.id} className="px-4 py-2 flex items-center gap-2 opacity-50">
                            <XCircle size={14} className="text-slate-400 shrink-0" />
                            <EstadoBadge estado={item.estadoNovedadRolEstadoNovedad} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Resumen */}
                  {copyPreview.toCopy.length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Se crearán <strong className="text-slate-700 dark:text-slate-200">{copySelected.size}</strong> configuración(es) seleccionadas
                      en <strong className="text-slate-700 dark:text-slate-200">{rolDestinoNombre}</strong> copiando
                      desde <strong className="text-slate-700 dark:text-slate-200">{rolOrigenNombre}</strong>.
                      {copySelected.size === 0 && (
                        <span className="text-amber-600 dark:text-amber-400"> Selecciona al menos un estado.</span>
                      )}
                    </p>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeCopyModal}
                  disabled={copying}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={copying || !copyPreview || copySelected.size === 0 || loadingPreview}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Copy size={14} />
                  {copying ? "Copiando..." : `Copiar ${copySelected.size} estado(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
