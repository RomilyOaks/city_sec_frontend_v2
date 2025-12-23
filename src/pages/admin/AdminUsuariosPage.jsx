import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Pencil, Plus, RefreshCw, Trash2, UserPlus, X } from 'lucide-react'

import { listRoles } from '../../services/rolesService.js'
import { createUser, deleteUser, listUsers, restoreUser, updateUser } from '../../services/usersService.js'
import { listPersonal } from '../../services/personalService.js'
import { useAuthStore } from '../../store/useAuthStore.js'
import { canPerformAction } from '../../rbac/rbac.js'

const schema = z
  .object({
    username: z.string().min(3, 'Mínimo 3 caracteres').max(50, 'Máximo 50 caracteres'),
    email: z.string().email('Email inválido'),
    nombres: z.string().min(1, 'Requerido').max(100, 'Máximo 100 caracteres'),
    apellidos: z.string().min(1, 'Requerido').max(100, 'Máximo 100 caracteres'),
    telefono: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((v) => !v || /^[0-9]{7,15}$/.test(v), 'Teléfono inválido'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe incluir mayúsculas, minúsculas y números'),
    confirmPassword: z.string().min(1, 'Requerido'),
    rolId: z.string().min(1, 'Seleccione un rol'),
    personal_seguridad_id: z.string().optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

/**
 * * COMPONENTE: AdminUsuariosPage
 * 
 * @component
 * @category General
 * @description Componente de CitySecure para administración de usuarios
 * 
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Elemento React renderizado
 * 
 * @example
 * <AdminUsuariosPage />
 * 
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

export default function AdminUsuariosPage() {
  const [roles, setRoles] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(true)

  const user = useAuthStore((s) => s.user)
  
  // Permisos basados en RBAC real
  const canCreate = canPerformAction(user, 'usuarios_create')
  const canEdit = canPerformAction(user, 'usuarios_update')
  const canSoftDelete = canPerformAction(user, 'usuarios_delete')

  const [showPassword, setShowPassword] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [userExistsError, setUserExistsError] = useState('')
  const hidePasswordTimeoutRef = useRef(null)

  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersPagination, setUsersPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterDeleted, setFilterDeleted] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [editingUser, setEditingUser] = useState(null)
  const [editDraft, setEditDraft] = useState({ estado: 'ACTIVO', nombres: '', apellidos: '', telefono: '', roles: [], personal_seguridad_id: '' })
  const [editSaving, setEditSaving] = useState(false)
  
  // Lista de personal para asignar
  const [personalList, setPersonalList] = useState([])
  const [loadingPersonal, setLoadingPersonal] = useState(false)
  const [showAllPersonal, setShowAllPersonal] = useState(false)

  const estadoOptions = useMemo(() => ['ACTIVO', 'INACTIVO', 'BLOQUEADO', 'PENDIENTE'], [])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      email: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      password: '',
      confirmPassword: '',
      rolId: '',
      personal_seguridad_id: '',
    },
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoadingRoles(true)
        const data = await listRoles()
        if (!mounted) return
        setRoles(data)
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'No se pudieron cargar roles')
      } finally {
        if (mounted) setLoadingRoles(false)
      }
    }
    load()
    return () => {
      mounted = false
      if (hidePasswordTimeoutRef.current) {
        clearTimeout(hidePasswordTimeoutRef.current)
      }
    }
  }, [])

  // Cargar lista de personal para asignar
  useEffect(() => {
    const loadPersonal = async () => {
      try {
        setLoadingPersonal(true)
        // Límite máximo del backend es 100
        const result = await listPersonal({ limit: 100 })
        // El backend devuelve { data: [...], pagination: {...} } o directamente el array
        const list = Array.isArray(result) ? result : (result?.data || result?.personal || [])
        setPersonalList(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('Error cargando personal:', err)
      } finally {
        setLoadingPersonal(false)
      }
    }
    loadPersonal()
  }, [])

  // Helpers para capitalizar
  const capitalize = (str) => {
    if (!str) return ''
    return str.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase())
  }

  // Verificar si username o email ya existen (incluyendo INACTIVOS)
  const checkUserExists = async (username, email) => {
    if (!username && !email) {
      setUserExistsError('')
      return
    }
    try {
      // Buscar en todos los usuarios (incluyendo eliminados)
      const result = await listUsers({ search: username || email, deleted: 'all', limit: 50 })
      const usuarios = result?.usuarios || result?.data || []
      const existe = usuarios.find(u => 
        (username && u.username?.toLowerCase() === username.toLowerCase()) ||
        (email && u.email?.toLowerCase() === email.toLowerCase())
      )
      if (existe) {
        setUserExistsError('El username o email ya fueron utilizados anteriormente. Por favor use otros datos.')
      } else {
        setUserExistsError('')
      }
    } catch (err) {
      console.error('Error verificando usuario:', err)
    }
  }

  // Hotkeys: Alt+G = Guardar, Alt+N = Nuevo, Escape = Cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+G = Guardar (submit form de creación o edición)
      if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (showCreateForm) {
          // Disparar submit del form
          const form = document.getElementById('form-crear-usuario')
          if (form) form.requestSubmit()
        } else if (editingUser) {
          document.getElementById('btn-guardar-usuario')?.click()
        }
      }
      // Alt+N = Nuevo usuario
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        if (canCreate && !showCreateForm && !editingUser) {
          setShowCreateForm(true)
          // Autofocus en el campo usuario después de que se renderice
          setTimeout(() => {
            document.getElementById('input-username')?.focus()
          }, 100)
        }
      }
      // Escape = Cerrar modal/form
      if (e.key === 'Escape') {
        if (editingUser) {
          setEditingUser(null)
        } else if (showCreateForm) {
          setShowCreateForm(false)
          setUserExistsError('')
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCreateForm, editingUser, canCreate])
  
  // Autofocus cuando se abre el formulario de creación
  useEffect(() => {
    if (showCreateForm) {
      setTimeout(() => {
        document.getElementById('input-username')?.focus()
      }, 100)
    }
  }, [showCreateForm])

  const fetchUsers = async ({ nextPage = page, nextSearch = search, nextRole = filterRole, nextDeleted = filterDeleted } = {}) => {
    try {
      setUsersLoading(true)
      // Determinar si es filtro por estado ENUM o por deleted
      const isEstadoFilter = ['ACTIVO', 'PENDIENTE', 'BLOQUEADO', 'INACTIVO'].includes(nextDeleted)
      const { usuarios, pagination } = await listUsers({
        page: nextPage,
        limit: 10,
        search: (nextSearch || '').trim(),
        rol: nextRole || '',
        estado: isEstadoFilter ? nextDeleted : '',
        deleted: isEstadoFilter ? '' : nextDeleted,
      })
      setUsers(Array.isArray(usuarios) ? usuarios : [])
      setUsersPagination(pagination)
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'No se pudieron cargar usuarios')
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers({ nextPage: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTogglePassword = () => {
    setShowPassword((prev) => {
      const next = !prev
      if (hidePasswordTimeoutRef.current) {
        clearTimeout(hidePasswordTimeoutRef.current)
      }
      if (next) {
        hidePasswordTimeoutRef.current = setTimeout(() => {
          setShowPassword(false)
        }, 3000)
      }
      return next
    })
  }

  const rolesOptions = useMemo(() => {
    return (roles || [])
      .map((r) => ({
        id: String(r?.id ?? ''),
        nombre: r?.nombre || r?.name || r?.slug || String(r?.id ?? ''),
        slug: r?.slug,
      }))
      .filter((r) => r.id)
  }, [roles])

  const usersForTable = useMemo(() => {
    return (users || []).map((u) => {
      const roles = u?.roles || []
      const roleSlugs = Array.isArray(roles) ? roles.map((r) => r?.slug).filter(Boolean) : []
      const roleIds = Array.isArray(roles) ? roles.map((r) => r?.id).filter(Boolean) : []
      return {
        id: u?.id,
        username: u?.username,
        email: u?.email,
        nombres: u?.nombres,
        apellidos: u?.apellidos,
        telefono: u?.telefono || '',
        estado: u?.estado,
        deletedAt: u?.deleted_at,
        personal_seguridad_id: u?.personal_seguridad_id || '',
        roleSlugs,
        roleIds,
      }
    })
  }, [users])

  const onSubmit = async (form) => {
    try {
      const rolIdNum = Number(form.rolId)
      if (!rolIdNum || Number.isNaN(rolIdNum)) {
        toast.error('Rol inválido')
        return
      }

      // Determinar estado según si tiene personal_seguridad_id asignado
      const personalIdRaw = form.personal_seguridad_id
      const personalId = personalIdRaw && personalIdRaw !== '' ? Number(personalIdRaw) : null
      const estadoInicial = personalId && !Number.isNaN(personalId) ? 'ACTIVO' : 'PENDIENTE'

      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        nombres: capitalize(form.nombres), // Capitalizar nombres
        apellidos: form.apellidos.toUpperCase(), // MAYÚSCULAS en apellidos
        telefono: form.telefono || undefined,
        roles: [rolIdNum],
        personal_seguridad_id: personalId,
        estado: estadoInicial,
      }
      console.log('[Crear Usuario] Payload enviado:', payload)
      await createUser(payload)

      toast.success('Usuario creado')
      setShowCreateForm(false) // Cerrar form inmediatamente
      setUserExistsError('') // Limpiar error de usuario existente
      reset({
        username: '',
        email: '',
        nombres: '',
        apellidos: '',
        telefono: '',
        password: '',
        confirmPassword: '',
        rolId: '',
        personal_seguridad_id: '',
      })

      setPage(1)
      fetchUsers({ nextPage: 1 }) // Sin await para no bloquear
    } catch (err) {
      const backendMsg = err?.response?.data?.message
      toast.error(backendMsg || err?.message || 'No se pudo crear el usuario')
    }
  }

  const handleApplyFilters = async () => {
    setPage(1)
    await fetchUsers({ nextPage: 1, nextSearch: search, nextRole: filterRole, nextDeleted: filterDeleted })
  }

  const handlePrev = async () => {
    const next = Math.max(1, page - 1)
    setPage(next)
    await fetchUsers({ nextPage: next })
  }

  const handleNext = async () => {
    const totalPages = usersPagination?.totalPages || 1
    const next = Math.min(totalPages, page + 1)
    setPage(next)
    await fetchUsers({ nextPage: next })
  }

  const handleToggleEstado = async (u) => {
    try {
      const nextEstado = u.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
      await changeUserEstado(u.id, nextEstado)
      toast.success(`Usuario ${nextEstado === 'ACTIVO' ? 'activado' : 'inactivado'}`)
      await fetchUsers({ nextPage: page })
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'No se pudo cambiar estado')
    }
  }

  const handleSoftDelete = async (u) => {
    const confirmed = window.confirm(`¿Estás seguro de eliminar al usuario "${u.username}"?\n\nEsta acción marcará al usuario como eliminado (soft delete).`)
    if (!confirmed) return

    try {
      await deleteUser(u.id)
      toast.success('Usuario eliminado')
      setPage(1)
      await fetchUsers({ nextPage: 1 })
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'No se pudo eliminar')
    }
  }

  const handleRestore = async (u) => {
    try {
      await restoreUser(u.id)
      toast.success('Usuario reactivado')
      setPage(1)
      await fetchUsers({ nextPage: 1 })
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'No se pudo reactivar')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Usuarios</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
            Gestiona usuarios, estados y roles.
          </p>
        </div>
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
          <UserPlus size={18} />
        </div>
      </div>

      {!showCreateForm ? (
        <div className="mt-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Listado</h2>
              <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
                Busca y valida antes de crear. Puedes activar/inactivar y (si eres super admin) eliminar.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => fetchUsers({ nextPage: page })}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RefreshCw size={16} />
                Refrescar
              </button>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-700 text-white px-4 py-2 text-sm font-medium hover:bg-primary-800"
                >
                  <Plus size={16} />
                  Nuevo
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_240px_220px_auto] gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Buscar</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyFilters(); } }}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                placeholder="username, email, nombres o apellidos"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Rol</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
              >
                <option value="">Todos</option>
                {rolesOptions.map((r) => (
                  <option key={r.id} value={r.slug || ''}>
                    {r.nombre}{r.slug ? ` (${r.slug})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Estado</label>
              <select
                value={filterDeleted}
                onChange={(e) => setFilterDeleted(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
              >
                <option value="all">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="BLOQUEADO">Bloqueados</option>
                <option value="INACTIVO">Inactivos</option>
                <option value="deleted">Eliminados (soft-delete)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="rounded-lg bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 text-sm font-medium hover:bg-slate-900 dark:hover:bg-slate-600"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setSearch('')
                  setFilterRole('')
                  setFilterDeleted('all')
                  setPage(1)
                  await fetchUsers({ nextPage: 1, nextSearch: '', nextRole: '', nextDeleted: 'all' })
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/30">
                <tr className="text-left text-slate-600 dark:text-slate-300">
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Nombres</th>
                  <th className="px-4 py-3 font-medium">Apellidos</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Roles</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usersLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-slate-500 dark:text-slate-300">
                      Cargando…
                    </td>
                  </tr>
                ) : usersForTable.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-slate-500 dark:text-slate-300">
                      No hay usuarios para mostrar.
                    </td>
                  </tr>
                ) : (
                  usersForTable.map((u) => (
                    <tr key={u.id} className="border-t border-slate-200/70 dark:border-slate-800">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-50">{u.username}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{u.email}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{u.nombres}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{u.apellidos}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            u.estado === 'ACTIVO'
                              ? 'inline-flex rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 px-2 py-0.5 text-xs font-medium'
                              : u.estado === 'PENDIENTE'
                              ? 'inline-flex rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 px-2 py-0.5 text-xs font-medium'
                              : u.estado === 'BLOQUEADO'
                              ? 'inline-flex rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 px-2 py-0.5 text-xs font-medium'
                              : 'inline-flex rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 px-2 py-0.5 text-xs font-medium'
                          }
                        >
                          {u.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {u.roleSlugs.join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser(u)
                                setShowAllPersonal(false) // Reset filtro de personal
                                setEditDraft({
                                  estado: u.estado || 'ACTIVO',
                                  nombres: u.nombres || '',
                                  apellidos: u.apellidos || '',
                                  telefono: u.telefono || '',
                                  roles: u.roleIds || [],
                                  personal_seguridad_id: u.personal_seguridad_id ? String(u.personal_seguridad_id) : '',
                                })
                              }}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          {u.deletedAt ? (
                            <button
                              type="button"
                              onClick={() => handleRestore(u)}
                              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-emerald-700"
                            >
                              Reactivar
                            </button>
                          ) : canSoftDelete ? (
                            <button
                              type="button"
                              onClick={() => handleSoftDelete(u)}
                              className="inline-flex items-center justify-center rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-900 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Página {usersPagination?.page ?? page} de {usersPagination?.totalPages ?? 1} ({usersPagination?.total ?? 0} registros)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={usersLoading || (usersPagination?.page ?? page) <= 1}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  usersLoading ||
                  (usersPagination?.page ?? page) >= (usersPagination?.totalPages ?? 1)
                }
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 relative">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Nuevo usuario</h2>
              <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">Completa el formulario y asigna un rol.</p>
            </div>
            <button
              type="button"
              onClick={() => { setShowCreateForm(false); setUserExistsError('') }}
              className="absolute top-0 right-0 p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
              title="Cerrar (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          <form id="form-crear-usuario" className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Usuario</label>
                <input
                  id="input-username"
                  className={`mt-1 w-full rounded-lg border ${userExistsError ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25`}
                  placeholder="username (sin espacios)"
                  autoComplete="off"
                  {...register('username', {
                    onBlur: (e) => checkUserExists(e.target.value, null)
                  })}
                />
                {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                <input
                  className={`mt-1 w-full rounded-lg border ${userExistsError ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25`}
                  placeholder="correo@dominio.com"
                  autoComplete="off"
                  {...register('email', {
                    onBlur: (e) => checkUserExists(null, e.target.value)
                  })}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                {userExistsError && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <span className="inline-block w-4 h-4 bg-red-500 text-white rounded-full text-center leading-4 text-xs">✕</span>
                    {userExistsError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Nombres</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                  placeholder="Nombres"
                  autoComplete="off"
                  {...register('nombres')}
                />
                {errors.nombres && <p className="mt-1 text-xs text-red-600">{errors.nombres.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Apellidos</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                  placeholder="Apellidos"
                  autoComplete="off"
                  {...register('apellidos')}
                />
                {errors.apellidos && <p className="mt-1 text-xs text-red-600">{errors.apellidos.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Teléfono (opcional)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                  placeholder="999999999"
                  autoComplete="off"
                  {...register('telefono')}
                />
                {errors.telefono && <p className="mt-1 text-xs text-red-600">{errors.telefono.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Rol</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                  disabled={loadingRoles}
                  {...register('rolId')}
                >
                  <option value="">{loadingRoles ? 'Cargando…' : 'Seleccione un rol'}</option>
                  {rolesOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}{r.slug ? ` (${r.slug})` : ''}
                    </option>
                  ))}
                </select>
                {errors.rolId && <p className="mt-1 text-xs text-red-600">{errors.rolId.message}</p>}
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Personal de Seguridad Asociado
              </label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                disabled={loadingPersonal}
                {...register('personal_seguridad_id')}
              >
                <option value="">{loadingPersonal ? 'Cargando…' : '— Sin asignar (estado PENDIENTE) —'}</option>
                {personalList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.apellido_paterno} {p.apellido_materno}, {p.nombres} - {p.doc_numero || 'Sin Doc'}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                <strong>Importante:</strong> Si asigna un personal, el usuario se creará como <strong>ACTIVO</strong>. 
                Si no asigna, se creará como <strong>PENDIENTE</strong> y no podrá iniciar sesión hasta que se le asigne.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Contraseña</label>
                <div className="mt-1 relative">
                  <input
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 pr-10 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Debe incluir mayúsculas, minúsculas y números"
                    autoComplete="new-password"
                    onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                    onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={handleTogglePassword}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={showPassword ? 'Ocultar (auto en 3s)' : 'Mostrar (auto en 3s)'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                {capsLockOn && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="font-semibold">⚠ MAYÚSCULAS ACTIVADAS</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Confirmar contraseña</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repita la contraseña"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Limpiar
              </button>
              <button
                id="btn-crear-usuario"
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-primary-700 text-white px-4 py-2 text-sm font-medium hover:bg-primary-800 disabled:opacity-60"
              >
                {isSubmitting ? 'Creando…' : 'Crear usuario'}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400 text-right">Alt+G = Guardar | Esc = Cancelar</p>
          </form>
        </div>
      )}

      {/* Modal de edición */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Editar usuario: {editingUser.username}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
              Modifica los campos y guarda los cambios.
            </p>

            <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Nombres</label>
                  <input
                    value={editDraft.nombres}
                    onChange={(e) => setEditDraft((d) => ({ ...d, nombres: capitalize(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Apellidos</label>
                  <input
                    value={editDraft.apellidos}
                    onChange={(e) => setEditDraft((d) => ({ ...d, apellidos: e.target.value.toUpperCase() }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Teléfono</label>
                <input
                  value={editDraft.telefono}
                  onChange={(e) => setEditDraft((d) => ({ ...d, telefono: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Rol</label>
                <select
                  value={editDraft.roles[0] || ''}
                  onChange={(e) => {
                    const newRolId = e.target.value ? Number(e.target.value) : null
                    setEditDraft((d) => ({ ...d, roles: newRolId ? [newRolId] : [] }))
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                >
                  <option value="">— Sin cambio —</option>
                  {rolesOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre} {r.slug ? `(${r.slug})` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Rol actual: {editingUser?.roleSlugs?.join(', ') || '—'}
                </p>
              </div>

              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Personal de Seguridad Asociado
                  </label>
                  <label className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAllPersonal}
                      onChange={(e) => setShowAllPersonal(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Ver todos
                  </label>
                </div>
                <select
                  value={editDraft.personal_seguridad_id || ''}
                  onChange={(e) => {
                    const newPersonalId = e.target.value || ''
                    // Si se asigna personal y estado es PENDIENTE, cambiar a ACTIVO
                    const newEstado = newPersonalId && editDraft.estado === 'PENDIENTE' ? 'ACTIVO' : editDraft.estado
                    setEditDraft((d) => ({ ...d, personal_seguridad_id: newPersonalId, estado: newEstado }))
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                  disabled={loadingPersonal}
                >
                  <option value="">{loadingPersonal ? 'Cargando…' : '— Sin asignar —'}</option>
                  {personalList
                    .filter((p) => {
                      // Si showAllPersonal está activo, mostrar todos
                      if (showAllPersonal) return true
                      // Siempre incluir el personal actualmente asignado
                      if (editDraft.personal_seguridad_id && String(p.id) === String(editDraft.personal_seguridad_id)) return true
                      // Filtrar por apellidos del usuario para sugerencias más relevantes
                      if (!editingUser?.apellidos) return true
                      const userApellidos = (editingUser.apellidos || '').toUpperCase().split(' ')
                      const personalApellidos = `${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.toUpperCase()
                      return userApellidos.some(ap => ap && personalApellidos.includes(ap))
                    })
                    .map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.apellido_paterno} {p.apellido_materno}, {p.nombres} - {p.doc_numero || 'Sin DNI'}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {!showAllPersonal && editingUser?.apellidos 
                    ? `Filtrando por apellidos "${editingUser.apellidos}". Marque "Ver todos" para más opciones.`
                    : 'Al asignar personal, el estado cambiará automáticamente a ACTIVO si está PENDIENTE.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Estado</label>
                <select
                  value={editDraft.estado}
                  onChange={(e) => setEditDraft((d) => ({ ...d, estado: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                >
                  {estadoOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs text-slate-400">Alt+G = Guardar | Esc = Cancelar</span>
              <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                id="btn-guardar-usuario"
                type="button"
                disabled={editSaving}
                onClick={async () => {
                  try {
                    setEditSaving(true)
                    const payload = {
                      estado: editDraft.estado,
                      nombres: capitalize(editDraft.nombres),
                      apellidos: editDraft.apellidos.toUpperCase(),
                      telefono: editDraft.telefono || undefined,
                      personal_seguridad_id: editDraft.personal_seguridad_id ? Number(editDraft.personal_seguridad_id) : null,
                    }
                    // Solo enviar roles si se seleccionó uno nuevo
                    if (editDraft.roles.length > 0) {
                      payload.roles = editDraft.roles
                    }
                    await updateUser(editingUser.id, payload)
                    toast.success('Usuario actualizado')
                    setEditingUser(null)
                    await fetchUsers({ nextPage: page })
                  } catch (err) {
                    toast.error(err?.response?.data?.message || err?.message || 'No se pudo actualizar')
                  } finally {
                    setEditSaving(false)
                  }
                }}
                className="rounded-lg bg-primary-700 text-white px-4 py-2 text-sm font-medium hover:bg-primary-800 disabled:opacity-60"
              >
                {editSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
