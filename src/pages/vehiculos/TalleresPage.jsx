import { useState, useEffect, useCallback } from "react";
import {
  Wrench,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { ConfirmModal } from "../../components/common";
import { useAuthStore } from "../../store/useAuthStore";
import { canPerformAction } from "../../rbac/rbac.js";
import { toast } from "react-hot-toast";
import { extractValidationErrors } from "../../utils/errorUtils.js";
import {
  getTalleres,
  createTaller,
  updateTaller,
  deleteTaller,
} from "../../services/talleresService.js";

const EMPTY_FORM = {
  nombre: "",
  ruc: "",
  direccion: "",
  telefono: "",
  email: "",
  contacto_nombre: "",
};

function TallerFormModal({ taller, onClose, onSaved }) {
  const [form, setForm] = useState(taller ? { ...taller } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const isEdit = !!taller;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateTaller(taller.id, form);
        toast.success("Taller actualizado");
      } else {
        await createTaller(form);
        toast.success("Taller registrado");
      }
      onSaved();
    } catch (err) {
      toast.error(extractValidationErrors(err) || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {isEdit ? "Editar Taller" : "Nuevo Taller"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className={inputCls}
                placeholder="Nombre del taller"
                maxLength={150}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                RUC
              </label>
              <input
                name="ruc"
                value={form.ruc || ""}
                onChange={handleChange}
                className={inputCls}
                placeholder="20123456789"
                maxLength={11}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              <input
                name="telefono"
                value={form.telefono || ""}
                onChange={handleChange}
                className={inputCls}
                placeholder="01-234-5678"
                maxLength={30}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dirección
              </label>
              <input
                name="direccion"
                value={form.direccion || ""}
                onChange={handleChange}
                className={inputCls}
                placeholder="Av. Ejemplo 123, Lima"
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email || ""}
                onChange={handleChange}
                className={inputCls}
                placeholder="taller@ejemplo.com"
                maxLength={150}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre de contacto
              </label>
              <input
                name="contacto_nombre"
                value={form.contacto_nombre || ""}
                onChange={handleChange}
                className={inputCls}
                placeholder="Juan Pérez"
                maxLength={150}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-md bg-primary-700 hover:bg-primary-800 text-white disabled:opacity-60"
            >
              {saving ? "Guardando..." : isEdit ? "Actualizar" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TalleresPage() {
  const [talleres, setTalleres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [formModal, setFormModal] = useState({ isOpen: false, taller: null });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    item: null,
    loading: false,
  });

  const { user } = useAuthStore();
  const canCreate = canPerformAction(user, "vehiculos.talleres.create");
  const canUpdate = canPerformAction(user, "vehiculos.talleres.update");
  const canDelete = canPerformAction(user, "vehiculos.talleres.delete");

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (!showInactive) params.estado = "true";
      if (search.trim()) params.search = search.trim();
      const res = await getTalleres(params);
      setTalleres(res.data?.talleres || res.data || []);
    } catch {
      toast.error("Error al cargar talleres");
    } finally {
      setLoading(false);
    }
  }, [search, showInactive]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleEliminar = (item) =>
    setConfirmModal({ isOpen: true, item, loading: false });

  const handleConfirmEliminar = async () => {
    setConfirmModal((s) => ({ ...s, loading: true }));
    try {
      await deleteTaller(confirmModal.item.id);
      toast.success("Taller eliminado");
      cargar();
    } catch (err) {
      toast.error(extractValidationErrors(err) || "Error al eliminar");
    } finally {
      setConfirmModal({ isOpen: false, item: null, loading: false });
    }
  };

  const filtered = talleres.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.nombre?.toLowerCase().includes(q) ||
      t.ruc?.toLowerCase().includes(q) ||
      t.contacto_nombre?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Wrench className="text-primary-700 dark:text-primary-400" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Talleres
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Talleres mecánicos asociados al mantenimiento de vehículos
            </p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => setFormModal({ isOpen: true, taller: null })}
            className="flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white text-sm rounded-lg"
          >
            <Plus size={16} />
            Nuevo taller
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, RUC o contacto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Mostrar inactivos
        </label>

        <button
          onClick={cargar}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            Cargando talleres...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">
            No se encontraron talleres
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">RUC</th>
                  <th className="px-4 py-3 text-left">Contacto</th>
                  <th className="px-4 py-3 text-left">Datos de contacto</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  {(canUpdate || canDelete) && (
                    <th className="px-4 py-3 text-center">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {t.nombre}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-mono">
                      {t.ruc || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {t.contacto_nombre || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {t.telefono && (
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Phone size={12} />
                            <span>{t.telefono}</span>
                          </div>
                        )}
                        {t.email && (
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Mail size={12} />
                            <span>{t.email}</span>
                          </div>
                        )}
                        {t.direccion && (
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <MapPin size={12} />
                            <span className="truncate max-w-xs">{t.direccion}</span>
                          </div>
                        )}
                        {!t.telefono && !t.email && !t.direccion && "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.estado ? (
                        <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400">
                          <CheckCircle size={14} />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                          <XCircle size={14} />
                          Inactivo
                        </span>
                      )}
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {canUpdate && (
                            <button
                              onClick={() =>
                                setFormModal({ isOpen: true, taller: t })
                              }
                              className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                              title="Editar"
                            >
                              <Edit2 size={15} />
                            </button>
                          )}
                          {canDelete && t.estado ? (
                            <button
                              onClick={() => handleEliminar(t)}
                              className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                              title="Eliminar"
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {formModal.isOpen && (
        <TallerFormModal
          taller={formModal.taller}
          onClose={() => setFormModal({ isOpen: false, taller: null })}
          onSaved={() => {
            setFormModal({ isOpen: false, taller: null });
            cargar();
          }}
        />
      )}

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Eliminar taller"
        message={`¿Seguro de eliminar el taller "${confirmModal.item?.nombre}"?`}
        confirmText="Eliminar"
        type="danger"
        loading={confirmModal.loading}
        onClose={() =>
          setConfirmModal({ isOpen: false, item: null, loading: false })
        }
        onConfirm={handleConfirmEliminar}
      />
    </div>
  );
}
