/**
 * File: c:\Project\city_sec_frontend_v2\src\pages\admin\RolesPermisosPage.jsx
 * @version 2.0.0
 * @description Gestión de roles y permisos — lista, creación, edición, asignación de permisos y visualización de usuarios por rol.
 */

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ChevronRight,
  Check,
  Loader2,
  AlertTriangle,
  Eye,
  User,
  Mail,
  Clock,
  Search,
  Copy,
} from "lucide-react";
import {
  listRoles,
  createRol,
  updateRol,
  deleteRol,
  getPermisosDeRol,
  asignarPermisosARol,
  getUsuariosDeRol,
} from "../../services/rolesService";
import { getPermisosAgrupados } from "../../services/permisosService";

/**
 * RolesPermisosPage - Gestión de roles y permisos (lista, creación, edición y asignación de permisos)
 *
 * @component
 * @category Pages | Admin
 * @version 2.0.0
 * @returns {JSX.Element}
 */

export default function RolesPermisosPage() {
  const queryClient = useQueryClient();
  const [selectedRol, setSelectedRol] = useState(null);
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
  const [showRolModal, setShowRolModal] = useState(false);
  const [editingRol, setEditingRol] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUsuariosModal, setShowUsuariosModal] = useState(false);
  const [usuariosRol, setUsuariosRol] = useState(null);
  const [searchPermisos, setSearchPermisos] = useState("");
  const [showCopiarModal, setShowCopiarModal] = useState(false);
  const [copiarTargetRolId, setCopiarTargetRolId] = useState("");

  // Evita setState en componentes desmontados (protección para operaciones asíncronas)
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Query: Lista de roles
  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => listRoles({ incluirPermisos: false }),
  });

  // Query: Permisos agrupados por módulo
  const { data: permisosAgrupados = {}, isLoading: loadingPermisos } = useQuery(
    {
      queryKey: ["permisos-agrupados"],
      queryFn: getPermisosAgrupados,
    },
  );

  // Query: Permisos del rol seleccionado
  const { data: permisosDelRol, isLoading: loadingPermisosRol } = useQuery({
    queryKey: ["permisos-rol", selectedRol?.id],
    queryFn: () => getPermisosDeRol(selectedRol.id),
    enabled: !!selectedRol?.id,
  });

  // Cargar permisos cuando cambia el rol seleccionado
  useEffect(() => {
    if (permisosDelRol?.permisos) {
      const ids = permisosDelRol.permisos.map((p) => p.id);
      // Deferring setState to avoid synchronous setState within effect (prevents cascading renders)
      setTimeout(() => {
        if (!isMountedRef.current) return;
        setPermisosSeleccionados(ids);
        setHasChanges(false);
      }, 0);
    }
  }, [permisosDelRol]);

  // Mutation: Crear rol
  const createMutation = useMutation({
    mutationFn: createRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol creado exitosamente");
      setShowRolModal(false);
      setEditingRol(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Error al crear rol");
    },
  });

  // Mutation: Actualizar rol
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateRol(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol actualizado exitosamente");
      setShowRolModal(false);
      setEditingRol(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Error al actualizar rol");
    },
  });

  // Mutation: Eliminar rol
  const deleteMutation = useMutation({
    mutationFn: deleteRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Rol eliminado exitosamente");
      if (selectedRol?.id === deleteMutation.variables) {
        setSelectedRol(null);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Error al eliminar rol");
    },
  });

  // Mutation: Asignar permisos
  const asignarPermisosMutation = useMutation({
    mutationFn: ({ rolId, permisoIds }) =>
      asignarPermisosARol(rolId, permisoIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["permisos-rol", selectedRol?.id],
      });
      toast.success("Permisos actualizados exitosamente");
      setHasChanges(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Error al asignar permisos");
    },
  });

  // Mutation: Copiar permisos a otro rol
  const copiarPermisosMutation = useMutation({
    mutationFn: ({ rolId, permisoIds }) => asignarPermisosARol(rolId, permisoIds),
    onSuccess: (_, { rolId }) => {
      queryClient.invalidateQueries({ queryKey: ["permisos-rol", rolId] });
      const targetRol = roles.find((r) => r.id === rolId);
      toast.success(`Permisos copiados a "${targetRol?.nombre || "rol"}" exitosamente`);
      setShowCopiarModal(false);
      setCopiarTargetRolId("");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Error al copiar permisos");
    },
  });

  // Roles elegibles para recibir permisos: nivel_jerarquia mayor al del rol origen (nivel inferior)
  const rolesElegiblesParaCopia = roles.filter(
    (r) =>
      r.id !== selectedRol?.id &&
      r.nivel_jerarquia !== null &&
      r.nivel_jerarquia !== undefined &&
      selectedRol?.nivel_jerarquia !== null &&
      selectedRol?.nivel_jerarquia !== undefined &&
      r.nivel_jerarquia > selectedRol.nivel_jerarquia
  );

  /**
   * Alterna la selección de un permiso para el rol actualmente cargado.
   * @param {number|string} permisoId - ID del permiso a alternar.
   */
  const togglePermiso = (permisoId) => {
    setPermisosSeleccionados((prev) => {
      const newPermisos = prev.includes(permisoId)
        ? prev.filter((id) => id !== permisoId)
        : [...prev, permisoId];
      setHasChanges(true);
      return newPermisos;
    });
  };

  /**
   * Alterna todos los permisos de un grupo (módulo.recurso).
   * Si todos los permisos del grupo están seleccionados los quita, en caso contrario los añade.
   * @param {string} key - Clave del grupo en `permisosAgrupados` (ej. "modulo.recurso").
   */
  const toggleModulo = (key) => {
    const grupo = permisosAgrupados[key];
    if (!grupo) return;

    const idsGrupo = grupo.permisos.map((p) => p.id);
    const todosSeleccionados = idsGrupo.every((id) =>
      permisosSeleccionados.includes(id),
    );

    setPermisosSeleccionados((prev) => {
      let newPermisos;
      if (todosSeleccionados) {
        newPermisos = prev.filter((id) => !idsGrupo.includes(id));
      } else {
        newPermisos = [...new Set([...prev, ...idsGrupo])];
      }
      setHasChanges(true);
      return newPermisos;
    });
  };

  /**
   * Envía al backend la lista de permisos seleccionados para el rol activo.
   * Evita la operación si no hay rol seleccionado.
   */
  const handleGuardarPermisos = () => {
    if (!selectedRol) return;
    asignarPermisosMutation.mutate({
      rolId: selectedRol.id,
      permisoIds: permisosSeleccionados,
    });
  };

  /**
   * Abre el modal para crear un nuevo rol o editar uno existente.
   * @param {Object|null} rol - Rol a editar, o null para crear uno nuevo.
   */
  const handleOpenRolModal = (rol = null) => {
    setEditingRol(rol);
    setShowRolModal(true);
  };

  /**
   * Guarda el rol: crea uno nuevo o actualiza el existente en edición.
   * @param {Object} formData - Datos del formulario del rol (nombre, slug, descripción, color, nivel).
   */
  const handleSaveRol = (formData) => {
    if (editingRol) {
      updateMutation.mutate({ id: editingRol.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  /**
   * Intenta eliminar un rol.
   * No permite eliminar roles de sistema y pide confirmación al usuario.
   * @param {Object} rol - Rol a eliminar.
   */
  const handleDeleteRol = (rol) => {
    if (rol.es_sistema) {
      toast.error("No se puede eliminar un rol del sistema");
      return;
    }
    if (window.confirm(`¿Eliminar el rol "${rol.nombre}"?`)) {
      deleteMutation.mutate(rol.id);
    }
  };

  /**
   * Carga los usuarios asociados a un rol y abre el modal correspondiente.
   * Realiza la llamada al servicio `getUsuariosDeRol`.
   * @param {Object} rol - Rol del que se solicitan los usuarios.
   */
  const handleVerUsuarios = async (rol) => {
    try {
      setUsuariosRol({ loading: true, rol });
      setShowUsuariosModal(true);
      const data = await getUsuariosDeRol(rol.id);
      if (!isMountedRef.current) return;
      setUsuariosRol({ ...data, loading: false });
    } catch (error) {
      console.error(error);
      if (!isMountedRef.current) return;
      toast.error("Error al cargar usuarios del rol");
      setShowUsuariosModal(false);
      setUsuariosRol(null);
    }
  };

  /**
   * Devuelve el color asociado a un rol o un color por defecto.
   * @param {Object} rol - Objeto rol que puede contener el atributo `color`.
   * @returns {string} Color en formato HEX.
   */
  const getRolColor = (rol) => {
    return rol.color || "#6B7280";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-indigo-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Roles y Permisos
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Administra los roles del sistema y sus permisos
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenRolModal()}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Rol
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: Lista de Roles */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Roles
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {loadingRoles ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                </div>
              ) : roles.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No hay roles configurados
                </div>
              ) : (
                roles.map((rol) => (
                  <div
                    key={rol.id}
                    onClick={() => setSelectedRol(rol)}
                    className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                      selectedRol?.id === rol.id
                        ? "bg-indigo-50 dark:bg-indigo-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: getRolColor(rol) }}
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {rol.nombre}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {rol.slug}
                        </p>
                      </div>
                      {rol.es_sistema && (
                        <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                          Sistema
                        </span>
                      )}
                      {rol.nivel_jerarquia !== undefined &&
                        rol.nivel_jerarquia !== null && (
                          <span
                            className="px-1.5 py-0.5 text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded"
                            title="Nivel de jerarquía"
                          >
                            N{rol.nivel_jerarquia}
                          </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVerUsuarios(rol);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Ver usuarios"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!rol.es_sistema && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRolModal(rol);
                            }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Editar rol"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRol(rol);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Eliminar rol"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <ChevronRight
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          selectedRol?.id === rol.id ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel derecho: Permisos del Rol */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {selectedRol
                    ? `Permisos de "${selectedRol.nombre}"`
                    : "Selecciona un rol"}
                </h2>
                {selectedRol && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {permisosSeleccionados.length} permisos asignados
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedRol && !loadingPermisosRol && !loadingPermisos && rolesElegiblesParaCopia.length > 0 && (
                  <button
                    onClick={() => {
                      setCopiarTargetRolId("");
                      setShowCopiarModal(true);
                    }}
                    className="flex items-center gap-2 rounded-lg border border-indigo-300 dark:border-indigo-600 px-3 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    title="Copiar permisos a un rol de nivel inferior"
                  >
                    <Copy className="h-4 w-4" />
                    Copiar a...
                  </button>
                )}
                {selectedRol && hasChanges && (
                  <button
                    onClick={handleGuardarPermisos}
                    disabled={asignarPermisosMutation.isPending}
                    className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {asignarPermisosMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Guardar Cambios
                  </button>
                )}
              </div>
            </div>

            <div className="p-4">
              {!selectedRol ? (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Selecciona un rol para ver y editar sus permisos</p>
                </div>
              ) : loadingPermisosRol || loadingPermisos ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                </div>
              ) : (
                <>
                  {/* Filtro de búsqueda de módulos */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchPermisos}
                      onChange={(e) => setSearchPermisos(e.target.value)}
                      placeholder="Buscar módulo o recurso..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {searchPermisos && (
                      <button
                        onClick={() => setSearchPermisos("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-4 max-h-[560px] overflow-y-auto">
                    {Object.entries(permisosAgrupados)
                      .filter(([key, grupo]) => {
                        if (!searchPermisos) return true;
                        const q = searchPermisos.toLowerCase();
                        return (
                          grupo.modulo.toLowerCase().includes(q) ||
                          grupo.recurso.toLowerCase().includes(q) ||
                          key.toLowerCase().includes(q)
                        );
                      })
                      .map(([key, grupo]) => {
                        const { modulo, recurso, permisos } = grupo;
                        const idsGrupo = permisos.map((p) => p.id);
                        const seleccionadosGrupo = idsGrupo.filter((id) =>
                          permisosSeleccionados.includes(id),
                        );
                        const todosSeleccionados =
                          seleccionadosGrupo.length === idsGrupo.length;
                        const algunosSeleccionados =
                          seleccionadosGrupo.length > 0 && !todosSeleccionados;

                        return (
                          <div
                            key={key}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                          >
                            {/* Header del grupo */}
                            <div
                              onClick={() => toggleModulo(key)}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    todosSeleccionados
                                      ? "bg-indigo-600 border-indigo-600"
                                      : algunosSeleccionados
                                        ? "bg-indigo-300 border-indigo-300"
                                        : "border-gray-300 dark:border-gray-600"
                                  }`}
                                >
                                  {(todosSeleccionados ||
                                    algunosSeleccionados) && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white capitalize">
                                  {modulo}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
                                  {recurso}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ({seleccionadosGrupo.length}/{idsGrupo.length}
                                  )
                                </span>
                              </div>
                            </div>

                            {/* Permisos del grupo */}
                            <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {permisos.map((permiso) => {
                                const isSelected =
                                  permisosSeleccionados.includes(permiso.id);
                                return (
                                  <label
                                    key={permiso.id}
                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                      isSelected
                                        ? "bg-indigo-50 dark:bg-indigo-900/20"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => togglePermiso(permiso.id)}
                                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {permiso.accion}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Crear/Editar Rol */}
      {showRolModal && (
        <RolModal
          rol={editingRol}
          onClose={() => {
            setShowRolModal(false);
            setEditingRol(null);
          }}
          onSave={handleSaveRol}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {/* Modal Usuarios del Rol */}
      {showUsuariosModal && (
        <UsuariosRolModal
          data={usuariosRol}
          onClose={() => {
            setShowUsuariosModal(false);
            setUsuariosRol(null);
          }}
        />
      )}

      {/* Modal Copiar Permisos */}
      {showCopiarModal && (
        <CopiarPermisosModal
          rolOrigen={selectedRol}
          rolesElegibles={rolesElegiblesParaCopia}
          targetRolId={copiarTargetRolId}
          onTargetChange={setCopiarTargetRolId}
          permisosCount={permisosSeleccionados.length}
          hasUnsavedChanges={hasChanges}
          isLoading={copiarPermisosMutation.isPending}
          onConfirm={() =>
            copiarPermisosMutation.mutate({
              rolId: Number(copiarTargetRolId),
              permisoIds: permisosSeleccionados,
            })
          }
          onClose={() => {
            setShowCopiarModal(false);
            setCopiarTargetRolId("");
          }}
        />
      )}
    </div>
  );
}

// Modal para copiar permisos a un rol de nivel inferior
function CopiarPermisosModal({
  rolOrigen,
  rolesElegibles,
  targetRolId,
  onTargetChange,
  permisosCount,
  hasUnsavedChanges,
  isLoading,
  onConfirm,
  onClose,
}) {
  const targetRol = rolesElegibles.find((r) => r.id === Number(targetRolId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Copiar Permisos
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Info origen */}
          <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: rolOrigen?.color || "#6B7280" }}
            />
            <div>
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                Origen: {rolOrigen?.nombre}
              </p>
              <p className="text-xs text-indigo-600 dark:text-indigo-300">
                {permisosCount} permiso{permisosCount !== 1 ? "s" : ""} a copiar
                {hasUnsavedChanges && (
                  <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                    (incluye cambios sin guardar)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Aviso de restricción */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Solo se puede copiar a roles de <strong>nivel inferior</strong>{" "}
              (N &gt; {rolOrigen?.nivel_jerarquia}). Los permisos del rol destino
              serán <strong>reemplazados</strong> por los del rol origen.
            </p>
          </div>

          {/* Selector de rol destino */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rol destino *
            </label>
            <select
              value={targetRolId}
              onChange={(e) => onTargetChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Seleccione un rol...</option>
              {rolesElegibles.map((r) => (
                <option key={r.id} value={r.id}>
                  N{r.nivel_jerarquia} — {r.nombre} ({r.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Preview del destino */}
          {targetRol && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: targetRol.color || "#6B7280" }}
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Destino: {targetRol.nombre}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nivel {targetRol.nivel_jerarquia} · {targetRol.slug}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!targetRolId || isLoading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copiar Permisos
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal para crear/editar rol
/**
 * * COMPONENTE: RolModal
 *
 * @component
 * @category General
 * @version 2.0.0
 * @example
 * <RolModal />
 *
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

function RolModal({ rol, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    nombre: rol?.nombre || "",
    slug: rol?.slug || "",
    descripcion: rol?.descripcion || "",
    nivel_jerarquia: rol?.nivel_jerarquia || 5,
    color: rol?.color || "#6B7280",
  });

  // Maneja cambios en los inputs del formulario y auto-genera el slug para nuevos roles
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Auto-generar slug desde nombre si es un rol nuevo
    if (name === "nombre" && !rol) {
      const slug = value
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  /**
   * Valida y envía el formulario del rol al handler `onSave`.
   * Evita el envío si faltan campos obligatorios.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.slug) {
      toast.error("Nombre y slug son requeridos");
      return;
    }
    onSave(formData);
  };

  const coloresPreset = [
    "#DC2626", // Rojo
    "#EA580C", // Naranja
    "#CA8A04", // Amarillo
    "#16A34A", // Verde
    "#0891B2", // Cyan
    "#2563EB", // Azul
    "#7C3AED", // Violeta
    "#DB2777", // Rosa
    "#6B7280", // Gris
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {rol ? "Editar Rol" : "Nuevo Rol"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Supervisor de Campo"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Slug (identificador único) *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="Ej: supervisor_campo"
              disabled={!!rol}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              required
            />
            {rol && (
              <p className="text-xs text-gray-500 mt-1">
                El slug no se puede modificar
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={2}
              placeholder="Descripción del rol..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Nivel Jerarquía */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nivel de Jerarquía (0 = más alto)
            </label>
            <input
              type="number"
              name="nivel_jerarquia"
              value={formData.nivel_jerarquia}
              onChange={handleChange}
              min={0}
              max={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {coloresPreset.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      formData.color === color
                        ? "border-gray-900 dark:border-white scale-110"
                        : "border-transparent hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {rol ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para ver usuarios de un rol
/**
 * * COMPONENTE: UsuariosRolModal
 *
 * @component
 * @category General
 * @version 2.0.0
 * @example
 * <UsuariosRolModal />
 *
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

function UsuariosRolModal({ data, onClose }) {
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [usuarioDetalle, setUsuarioDetalle] = useState(null);

  // Evita setState después de desmontar (peticiones asíncronas)
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        if (selectedUsuario) {
          setSelectedUsuario(null);
          setUsuarioDetalle(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose, selectedUsuario]);

  /**
   * Formatea una fecha en una representación legible (es-ES). Devuelve "Nunca" si no hay valor.
   * @param {string|null|undefined} dateStr - Cadena ISO de fecha.
   * @returns {string} Fecha formateada o "Nunca".
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return "Nunca";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /** Carga detalle completo de un usuario y lo muestra en el modal. @param {Object} usuario */
  const handleVerUsuario = async (usuario) => {
    setSelectedUsuario(usuario);
    setUsuarioDetalle({ loading: true });
    try {
      const { getUserById } = await import("../../services/usersService");
      const detalle = await getUserById(usuario.id);
      if (!mountedRef.current) return;
      setUsuarioDetalle(detalle);
    } catch (error) {
      console.error(error);
      if (!mountedRef.current) return;
      toast.error("Error al cargar detalle del usuario");
      setSelectedUsuario(null);
      setUsuarioDetalle(null);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {data?.rol && (
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: data.rol.color || "#6B7280" }}
                />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Usuarios con rol "{data?.rol?.nombre || "..."}"
                </h3>
                {!data?.loading && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {data?.total || 0} usuario{data?.total !== 1 ? "s" : ""}{" "}
                    encontrado{data?.total !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {data?.loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : !data?.usuarios || data.usuarios.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No hay usuarios con este rol</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.usuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {usuario.nombres
                            ? `${usuario.nombres} ${
                                usuario.apellidos || ""
                              }`.trim()
                            : usuario.username}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Mail className="h-3 w-3" />
                          <span>{usuario.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                            usuario.estado
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {usuario.estado ? "Activo" : "Inactivo"}
                        </span>
                        {usuario.last_login_at && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1 justify-end">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(usuario.last_login_at)}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleVerUsuario(usuario)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de detalle de usuario */}
      {selectedUsuario && (
        <UsuarioDetalleModal
          usuario={usuarioDetalle}
          onClose={() => {
            setSelectedUsuario(null);
            setUsuarioDetalle(null);
          }}
        />
      )}
    </>
  );
}

// Modal de detalle de usuario independiente
/**
 * * COMPONENTE: UsuarioDetalleModal
 *
 * @component
 * @category General
 * @version 2.0.0
 * @example
 * <UsuarioDetalleModal />
 *
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

function UsuarioDetalleModal({ usuario, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  /**
   * Formatea una fecha (es-ES). Devuelve "N/A" si no hay valor.
   * @param {string|null|undefined} dateStr - Fecha en formato ISO.
   * @returns {string} Fecha formateada o "N/A".
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isLoading = usuario?.loading;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Detalle de Usuario
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : !usuario ? (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No se pudo cargar el usuario</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Avatar y nombre */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <User className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {usuario.nombres
                      ? `${usuario.nombres} ${usuario.apellidos || ""}`.trim()
                      : usuario.username}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{usuario.username}
                  </p>
                  <span
                    className={`inline-flex mt-1 px-2 py-0.5 text-xs rounded-full ${
                      usuario.estado
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {usuario.estado ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contacto
                </h5>
                <div className="grid gap-2">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {usuario.email}
                    </span>
                  </div>
                  {usuario.telefono && (
                    <div className="flex items-center gap-3 text-sm">
                      <span className="h-4 w-4 text-gray-400 text-center">
                        📱
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {usuario.telefono}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Roles */}
              {usuario.Roles && usuario.Roles.length > 0 && (
                <div className="space-y-3">
                  <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Roles
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {usuario.Roles.map((rol) => (
                      <span
                        key={rol.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: rol.color || "#6366f1" }}
                        />
                        {rol.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Fechas */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actividad
                </h5>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Último acceso:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatDate(usuario.last_login_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Creado:
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {formatDate(usuario.created_at)}
                    </span>
                  </div>
                  {usuario.email_verified_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">
                        Email verificado:
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {formatDate(usuario.email_verified_at)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
