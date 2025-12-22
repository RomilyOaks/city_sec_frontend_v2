import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
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
} from 'lucide-react'
import {
  listRoles,
  createRol,
  updateRol,
  deleteRol,
  getPermisosDeRol,
  asignarPermisosARol,
} from '../../services/rolesService'
import { getPermisosAgrupados } from '../../services/permisosService'

export default function RolesPermisosPage() {
  const queryClient = useQueryClient()
  const [selectedRol, setSelectedRol] = useState(null)
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([])
  const [showRolModal, setShowRolModal] = useState(false)
  const [editingRol, setEditingRol] = useState(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Query: Lista de roles
  const {
    data: roles = [],
    isLoading: loadingRoles,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: () => listRoles({ incluirPermisos: false }),
  })

  // Query: Permisos agrupados por módulo
  const {
    data: permisosAgrupados = {},
    isLoading: loadingPermisos,
  } = useQuery({
    queryKey: ['permisos-agrupados'],
    queryFn: getPermisosAgrupados,
  })

  // Query: Permisos del rol seleccionado
  const {
    data: permisosDelRol,
    isLoading: loadingPermisosRol,
  } = useQuery({
    queryKey: ['permisos-rol', selectedRol?.id],
    queryFn: () => getPermisosDeRol(selectedRol.id),
    enabled: !!selectedRol?.id,
  })

  // Cargar permisos cuando cambia el rol seleccionado
  useEffect(() => {
    if (permisosDelRol?.permisos) {
      const ids = permisosDelRol.permisos.map((p) => p.id)
      setPermisosSeleccionados(ids)
      setHasChanges(false)
    }
  }, [permisosDelRol])

  // Mutation: Crear rol
  const createMutation = useMutation({
    mutationFn: createRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Rol creado exitosamente')
      setShowRolModal(false)
      setEditingRol(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al crear rol')
    },
  })

  // Mutation: Actualizar rol
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateRol(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Rol actualizado exitosamente')
      setShowRolModal(false)
      setEditingRol(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al actualizar rol')
    },
  })

  // Mutation: Eliminar rol
  const deleteMutation = useMutation({
    mutationFn: deleteRol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Rol eliminado exitosamente')
      if (selectedRol?.id === deleteMutation.variables) {
        setSelectedRol(null)
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al eliminar rol')
    },
  })

  // Mutation: Asignar permisos
  const asignarPermisosMutation = useMutation({
    mutationFn: ({ rolId, permisoIds }) => asignarPermisosARol(rolId, permisoIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permisos-rol', selectedRol?.id] })
      toast.success('Permisos actualizados exitosamente')
      setHasChanges(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error al asignar permisos')
    },
  })

  // Toggle permiso
  const togglePermiso = (permisoId) => {
    setPermisosSeleccionados((prev) => {
      const newPermisos = prev.includes(permisoId)
        ? prev.filter((id) => id !== permisoId)
        : [...prev, permisoId]
      setHasChanges(true)
      return newPermisos
    })
  }

  // Toggle todos los permisos de un grupo (módulo.recurso)
  const toggleModulo = (key) => {
    const grupo = permisosAgrupados[key]
    if (!grupo) return
    
    const idsGrupo = grupo.permisos.map((p) => p.id)
    const todosSeleccionados = idsGrupo.every((id) => permisosSeleccionados.includes(id))

    setPermisosSeleccionados((prev) => {
      let newPermisos
      if (todosSeleccionados) {
        newPermisos = prev.filter((id) => !idsGrupo.includes(id))
      } else {
        newPermisos = [...new Set([...prev, ...idsGrupo])]
      }
      setHasChanges(true)
      return newPermisos
    })
  }

  // Guardar permisos
  const handleGuardarPermisos = () => {
    if (!selectedRol) return
    asignarPermisosMutation.mutate({
      rolId: selectedRol.id,
      permisoIds: permisosSeleccionados,
    })
  }

  // Abrir modal para crear/editar rol
  const handleOpenRolModal = (rol = null) => {
    setEditingRol(rol)
    setShowRolModal(true)
  }

  // Guardar rol (crear o actualizar)
  const handleSaveRol = (formData) => {
    if (editingRol) {
      updateMutation.mutate({ id: editingRol.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  // Eliminar rol
  const handleDeleteRol = (rol) => {
    if (rol.es_sistema) {
      toast.error('No se puede eliminar un rol del sistema')
      return
    }
    if (window.confirm(`¿Eliminar el rol "${rol.nombre}"?`)) {
      deleteMutation.mutate(rol.id)
    }
  }

  // Colores para roles
  const getRolColor = (rol) => {
    return rol.color || '#6B7280'
  }

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
              <h2 className="font-semibold text-gray-900 dark:text-white">Roles</h2>
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
                        ? 'bg-indigo-50 dark:bg-indigo-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
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
                    </div>
                    <div className="flex items-center gap-2">
                      {!rol.es_sistema && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenRolModal(rol)
                            }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteRol(rol)
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <ChevronRight
                        className={`h-4 w-4 text-gray-400 transition-transform ${
                          selectedRol?.id === rol.id ? 'rotate-90' : ''
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
                  {selectedRol ? `Permisos de "${selectedRol.nombre}"` : 'Selecciona un rol'}
                </h2>
                {selectedRol && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {permisosSeleccionados.length} permisos asignados
                  </p>
                )}
              </div>
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
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {Object.entries(permisosAgrupados).map(([key, grupo]) => {
                    const { modulo, recurso, permisos } = grupo
                    const idsGrupo = permisos.map((p) => p.id)
                    const seleccionadosGrupo = idsGrupo.filter((id) =>
                      permisosSeleccionados.includes(id)
                    )
                    const todosSeleccionados = seleccionadosGrupo.length === idsGrupo.length
                    const algunosSeleccionados =
                      seleccionadosGrupo.length > 0 && !todosSeleccionados

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
                                  ? 'bg-indigo-600 border-indigo-600'
                                  : algunosSeleccionados
                                  ? 'bg-indigo-300 border-indigo-300'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            >
                              {(todosSeleccionados || algunosSeleccionados) && (
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
                              ({seleccionadosGrupo.length}/{idsGrupo.length})
                            </span>
                          </div>
                        </div>

                        {/* Permisos del grupo */}
                        <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {permisos.map((permiso) => {
                            const isSelected = permisosSeleccionados.includes(permiso.id)
                            return (
                              <label
                                key={permiso.id}
                                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
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
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
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
            setShowRolModal(false)
            setEditingRol(null)
          }}
          onSave={handleSaveRol}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}

// Modal para crear/editar rol
function RolModal({ rol, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    nombre: rol?.nombre || '',
    slug: rol?.slug || '',
    descripcion: rol?.descripcion || '',
    nivel_jerarquia: rol?.nivel_jerarquia || 5,
    color: rol?.color || '#6B7280',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Auto-generar slug desde nombre
    if (name === 'nombre' && !rol) {
      const slug = value
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
      setFormData((prev) => ({ ...prev, slug }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.nombre || !formData.slug) {
      toast.error('Nombre y slug son requeridos')
      return
    }
    onSave(formData)
  }

  const coloresPreset = [
    '#DC2626', // Rojo
    '#EA580C', // Naranja
    '#CA8A04', // Amarillo
    '#16A34A', // Verde
    '#0891B2', // Cyan
    '#2563EB', // Azul
    '#7C3AED', // Violeta
    '#DB2777', // Rosa
    '#6B7280', // Gris
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {rol ? 'Editar Rol' : 'Nuevo Rol'}
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
                        ? 'border-gray-900 dark:border-white scale-110'
                        : 'border-transparent hover:scale-110'
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
              {rol ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
