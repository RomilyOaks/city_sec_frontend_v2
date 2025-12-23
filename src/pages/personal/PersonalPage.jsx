import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, RefreshCw, Search, Trash2, UserCheck, Car, IdCard, Check, Info } from 'lucide-react'

import { listPersonal, deletePersonal, restorePersonal, createPersonal, updatePersonal } from '../../services/personalService.js'
import { listCargos, buscarUbigeo } from '../../services/catalogosService.js'
import { listVehiculosDisponibles } from '../../services/vehiculosService.js'
import { useAuthStore } from '../../store/useAuthStore.js'
import { canPerformAction, canAccessRoute } from '../../rbac/rbac.js'

const STATUS_OPTIONS = ['Activo', 'Inactivo', 'Suspendido', 'Retirado']
const DOC_TIPOS = ['DNI', 'Carnet Extranjeria', 'Pasaporte', 'PTP']
const REGIMEN_OPTIONS = ['256', '276', '728', '1057 CAS', 'Orden Servicio', 'Practicante']
const CATEGORIA_LICENCIA = ['A-I', 'A-IIA', 'A-IIB', 'A-IIIA', 'A-IIIB', 'A-IIIC', 'B-I', 'B-IIA', 'B-IIB', 'B-IIC']

const DOC_VALIDATION_RULES = {
  DNI: { pattern: /^\d{8}$/, msg: 'El DNI debe tener exactamente 8 dígitos numéricos' },
  'Carnet Extranjeria': { pattern: /^[A-Z0-9]{9}$/i, msg: 'El Carnet de Extranjería debe tener 9 caracteres alfanuméricos' },
  Pasaporte: { pattern: /^[A-Z0-9]{6,12}$/i, msg: 'El Pasaporte debe tener entre 6 y 12 caracteres alfanuméricos' },
  PTP: { pattern: /^[A-Z0-9]{6,15}$/i, msg: 'El PTP debe tener entre 6 y 15 caracteres' },
}

function extractErrorMessage(err) {
  const data = err?.response?.data
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors[0].message || data.message || 'Error de validación'
  }
  return data?.message || 'Error al procesar la solicitud'
}

const initialFormData = {
  doc_tipo: 'DNI',
  doc_numero: '',
  apellido_paterno: '',
  apellido_materno: '',
  nombres: '',
  sexo: '',
  fecha_nacimiento: '',
  nacionalidad: 'Peruana',
  direccion: '',
  ubigeo_code: '',
  cargo_id: '',
  fecha_ingreso: '',
  status: 'Activo',
  regimen: '',
  licencia: '',
  categoria: '',
  vigencia: '',
  vehiculo_id: '',
}

/**
 * * COMPONENTE: PersonalPage
 * 
 * @component
 * @category General
 * @description Componente de CitySecure para gestión de personal de seguridad
 * 
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Elemento React renderizado
 * 
 * @example
 * <PersonalPage />
 * 
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

export default function PersonalPage() {
  const user = useAuthStore((s) => s.user)
  const canRead = canAccessRoute(user, 'personal')
  const canCreate = canPerformAction(user, 'personal_create')
  const canEdit = canPerformAction(user, 'personal_update')
  const canDelete = canPerformAction(user, 'personal_delete')
  
  // Estado para controlar si ya se mostró el error de permisos
  const [permissionErrorShown, setPermissionErrorShown] = useState(false)

  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPersonal, setEditingPersonal] = useState(null)
  const [viewingPersonal, setViewingPersonal] = useState(null)
  const [formData, setFormData] = useState(initialFormData)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basicos')
  const [docDuplicadoError, setDocDuplicadoError] = useState('')

  // Hotkeys: Alt+G = Guardar, Alt+N = Nuevo, Escape = Cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+G = Guardar
      if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        if (showCreateModal) {
          document.getElementById('btn-crear-personal')?.click()
        } else if (editingPersonal) {
          document.getElementById('btn-guardar-personal')?.click()
        }
      }
      // Alt+N = Nuevo personal
      if (e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        if (canCreate && !showCreateModal && !editingPersonal && !viewingPersonal) {
          resetForm()
          setShowCreateModal(true)
          // Autofocus en Nro. Documento
          setTimeout(() => {
            document.getElementById('input-doc-numero')?.focus()
          }, 100)
        }
      }
      // Escape = Cerrar modal
      if (e.key === 'Escape') {
        if (showCreateModal) {
          setShowCreateModal(false)
          resetForm()
        } else if (editingPersonal) {
          setEditingPersonal(null)
          resetForm()
        } else if (viewingPersonal) {
          setViewingPersonal(null)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCreateModal, editingPersonal, viewingPersonal, canCreate])

  // Autofocus cuando se abre el modal de creación
  useEffect(() => {
    if (showCreateModal) {
      setTimeout(() => {
        document.getElementById('input-doc-numero')?.focus()
      }, 100)
    }
  }, [showCreateModal])

  // Catálogos
  const [cargos, setCargos] = useState([])
  const [ubigeos, setUbigeos] = useState([])
  const [ubigeoSearch, setUbigeoSearch] = useState('')
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState([])

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [cargosRes, vehiculosRes] = await Promise.all([
          listCargos(),
          listVehiculosDisponibles(),
        ])
        setCargos(Array.isArray(cargosRes) ? cargosRes : [])
        setVehiculosDisponibles(Array.isArray(vehiculosRes) ? vehiculosRes : [])
      } catch (err) {
        console.error('Error cargando catálogos:', err)
      }
    }
    loadCatalogos()
  }, [])

  // Buscar ubigeos cuando cambia el texto
  useEffect(() => {
    if (ubigeoSearch.length < 3) {
      setUbigeos([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const res = await buscarUbigeo({ search: ubigeoSearch })
        setUbigeos(Array.isArray(res) ? res : [])
      } catch (err) {
        console.error('Error buscando ubigeo:', err)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [ubigeoSearch])

  const fetchPersonal = async ({ nextPage = 1, searchOverride, statusOverride } = {}) => {
    // Si no tiene permisos, no hacer la llamada
    if (!canRead) {
      if (!permissionErrorShown) {
        toast.error('No tienes los permisos necesarios para realizar esta acción')
        setPermissionErrorShown(true)
      }
      return
    }
    
    setLoading(true)
    try {
      const searchValue = searchOverride !== undefined ? searchOverride : search
      const statusValue = statusOverride !== undefined ? statusOverride : filterStatus
      const result = await listPersonal({
        page: nextPage,
        limit: 15,
        status: statusValue || undefined,
        search: searchValue || undefined,
      })
      const items = result?.personal || result?.data || result || []
      setPersonal(Array.isArray(items) ? items : [])
      setPagination(result?.pagination || null)
    } catch (err) {
      // Solo mostrar error si no es de permisos o si no se ha mostrado antes
      const msg = err?.response?.data?.message || 'Error al cargar personal'
      if (!permissionErrorShown) {
        toast.error(msg)
        if (err?.response?.status === 403) {
          setPermissionErrorShown(true)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPersonal({ nextPage: page })
  }, [page, filterStatus, canRead])

  const handleSearch = () => {
    setPage(1)
    fetchPersonal({ nextPage: 1 })
  }

  const handleDelete = async (p) => {
    const confirmed = window.confirm(`¿Eliminar a ${p.nombres} ${p.apellido_paterno}?`)
    if (!confirmed) return
    try {
      await deletePersonal(p.id)
      toast.success('Personal eliminado')
      fetchPersonal({ nextPage: page })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al eliminar')
    }
  }

  const handleRestore = async (p) => {
    try {
      await restorePersonal(p.id)
      toast.success('Personal restaurado')
      fetchPersonal({ nextPage: page })
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al restaurar')
    }
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setActiveTab('basicos')
    setUbigeoSearch('')
  }

  const validateDocumento = () => {
    const rule = DOC_VALIDATION_RULES[formData.doc_tipo]
    if (!rule) return null
    const doc = formData.doc_numero.trim().toUpperCase()
    if (!rule.pattern.test(doc)) return rule.msg
    return null
  }

  // Verificar si el documento ya existe al salir del campo
  const checkDocumentoDuplicado = async () => {
    if (!formData.doc_numero || formData.doc_numero.length < 6) {
      setDocDuplicadoError('')
      return
    }
    try {
      const result = await listPersonal({ search: formData.doc_numero, limit: 10 })
      const list = result?.personal || result || []
      const existe = list.find(p => p.doc_numero === formData.doc_numero && p.doc_tipo === formData.doc_tipo)
      if (existe) {
        setDocDuplicadoError(`Ya existe un personal con ${formData.doc_tipo}: ${formData.doc_numero}`)
      } else {
        setDocDuplicadoError('')
      }
    } catch (err) {
      console.error('Error verificando documento:', err)
    }
  }

  const handleCreate = async () => {
    if (!formData.doc_numero || !formData.apellido_paterno || !formData.apellido_materno || !formData.nombres) {
      toast.error('Complete los campos requeridos (documento, nombres y apellidos)')
      return
    }
    if (docDuplicadoError) {
      toast.error(docDuplicadoError)
      return
    }
    const docError = validateDocumento()
    if (docError) {
      toast.error(docError)
      return
    }
    setSaving(true)
    try {
      const payload = { ...formData }
      if (payload.cargo_id) payload.cargo_id = Number(payload.cargo_id)
      if (payload.vehiculo_id) payload.vehiculo_id = Number(payload.vehiculo_id)
      // Limpiar campos vacíos
      Object.keys(payload).forEach(k => {
        if (payload[k] === '') delete payload[k]
      })
      await createPersonal(payload)
      toast.success('Personal creado')
      setShowCreateModal(false)
      resetForm()
      fetchPersonal({ nextPage: 1 })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingPersonal) return
    setSaving(true)
    try {
      const { doc_tipo: _docTipo, doc_numero: _docNum, ...updateData } = formData
      if (updateData.cargo_id) updateData.cargo_id = Number(updateData.cargo_id)
      if (updateData.vehiculo_id) updateData.vehiculo_id = Number(updateData.vehiculo_id)
      Object.keys(updateData).forEach(k => {
        if (updateData[k] === '') delete updateData[k]
      })
      await updatePersonal(editingPersonal.id, updateData)
      toast.success('Personal actualizado')
      setEditingPersonal(null)
      resetForm()
      fetchPersonal({ nextPage: page })
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const openEditModal = (p) => {
    setEditingPersonal(p)
    setFormData({
      doc_tipo: p.doc_tipo || 'DNI',
      doc_numero: p.doc_numero || '',
      apellido_paterno: p.apellido_paterno || '',
      apellido_materno: p.apellido_materno || '',
      nombres: p.nombres || '',
      sexo: p.sexo || '',
      fecha_nacimiento: p.fecha_nacimiento || '',
      nacionalidad: p.nacionalidad || 'Peruana',
      direccion: p.direccion || '',
      ubigeo_code: p.ubigeo_code || '',
      cargo_id: p.cargo_id || '',
      fecha_ingreso: p.fecha_ingreso || '',
      status: p.status || 'Activo',
      regimen: p.regimen || '',
      licencia: p.licencia || '',
      categoria: p.categoria || '',
      vigencia: p.vigencia || '',
      vehiculo_id: p.vehiculo_id || '',
    })
    setActiveTab('basicos')
    if (p.ubigeo_code && p.PersonalSeguridadUbigeo) {
      const ub = p.PersonalSeguridadUbigeo
      setUbigeoSearch(`${ub.departamento} - ${ub.provincia} - ${ub.distrito}`)
    }
  }

  const statusColor = (status) => {
    switch (status) {
      case 'Activo': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'Inactivo': return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
      case 'Suspendido': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      case 'Retirado': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  // Verificar si la pestaña de datos básicos está completa
  const isBasicosComplete = () => {
    return formData.doc_numero && formData.nombres && formData.apellido_paterno && formData.apellido_materno
  }

  // Verificar si la pestaña de licencia/vehículo tiene datos
  const isLicenciaComplete = () => {
    return formData.licencia || formData.vehiculo_id
  }

  const renderFormTabs = (isEdit = false) => {
    const tabs = [
      { id: 'basicos', label: 'Datos Básicos', num: 1, isComplete: isBasicosComplete },
      { id: 'adicionales', label: 'Licencia / Vehículo', num: 2, isComplete: isLicenciaComplete },
    ]

    return (
    <>
      {/* Tabs con números y checks */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const completed = tab.isComplete()
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {completed ? (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white">
                  <Check size={12} />
                </span>
              ) : (
                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-primary-600 text-white' : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                }`}>
                  {tab.num}
                </span>
              )}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab: Datos Básicos */}
      {activeTab === 'basicos' && (
        <div className="grid grid-cols-2 gap-4">
          {!isEdit ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Tipo Documento *</label>
                <select
                  value={formData.doc_tipo}
                  onChange={(e) => setFormData({ ...formData, doc_tipo: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                >
                  {DOC_TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Nro. Documento *</label>
                <input
                  id="input-doc-numero"
                  value={formData.doc_numero}
                  onChange={(e) => {
                    setFormData({ ...formData, doc_numero: e.target.value })
                    setDocDuplicadoError('') // Limpiar error al escribir
                  }}
                  onBlur={checkDocumentoDuplicado}
                  className={`mt-1 w-full rounded-lg border ${docDuplicadoError ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'} bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50`}
                />
                {docDuplicadoError && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <span className="inline-block w-4 h-4 bg-red-500 text-white rounded-full text-center leading-4 text-xs">✕</span>
                    {docDuplicadoError}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Documento</label>
              <p className="mt-1 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
                {formData.doc_tipo} - {formData.doc_numero}
              </p>
            </div>
          )}

          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Nombres *</label>
            <input
              value={formData.nombres}
              onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Apellido Paterno *</label>
            <input
              value={formData.apellido_paterno}
              onChange={(e) => setFormData({ ...formData, apellido_paterno: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Apellido Materno *</label>
            <input
              value={formData.apellido_materno}
              onChange={(e) => setFormData({ ...formData, apellido_materno: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Sexo</label>
            <select
              value={formData.sexo}
              onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              <option value="">— Seleccione —</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Fecha Nacimiento</label>
            <input
              type="date"
              value={formData.fecha_nacimiento}
              onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Nacionalidad</label>
            <input
              value={formData.nacionalidad}
              onChange={(e) => setFormData({ ...formData, nacionalidad: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Cargo</label>
            <select
              value={formData.cargo_id}
              onChange={(e) => setFormData({ ...formData, cargo_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              <option value="">— Seleccione —</option>
              {cargos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Ubigeo (Distrito)</label>
            <div className="relative">
              <input
                value={ubigeoSearch}
                onChange={(e) => {
                  setUbigeoSearch(e.target.value)
                  if (formData.ubigeo_code) {
                    setFormData({ ...formData, ubigeo_code: '' })
                  }
                }}
                placeholder="Escriba 3+ caracteres para buscar distrito..."
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 ${
                  formData.ubigeo_code 
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 focus:ring-emerald-500/25' 
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 focus:ring-primary-600/25 focus:border-primary-500'
                }`}
              />
              {formData.ubigeo_code && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {formData.ubigeo_code}
                </span>
              )}
            </div>
            {ubigeos.length > 0 && (
              <div className="mt-1 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 shadow-lg z-10 relative">
                {ubigeos.map((u) => (
                  <button
                    key={u.ubigeo_code}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, ubigeo_code: u.ubigeo_code })
                      setUbigeoSearch(`${u.departamento} - ${u.provincia} - ${u.distrito}`)
                      setUbigeos([])
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-primary-100 dark:hover:bg-primary-900/30 border-b border-slate-100 dark:border-slate-800 last:border-0"
                  >
                    <span className="font-medium">{u.distrito}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs ml-2">({u.provincia}, {u.departamento})</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold float-right">{u.ubigeo_code}</span>
                  </button>
                ))}
              </div>
            )}
            {ubigeoSearch.length >= 3 && ubigeos.length === 0 && !formData.ubigeo_code && (
              <p className="mt-1 text-xs text-slate-500">Buscando distritos...</p>
            )}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Dirección</label>
            <input
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Fecha Ingreso</label>
            <input
              type="date"
              value={formData.fecha_ingreso}
              onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Régimen Laboral</label>
            <select
              value={formData.regimen}
              onChange={(e) => setFormData({ ...formData, regimen: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              <option value="">— Seleccione —</option>
              {REGIMEN_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Tip message */}
          <div className="col-span-2 mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <Info size={16} className="mt-0.5 flex-shrink-0" />
              <span>
                <strong>Tip:</strong> Puede agregar información de licencia y vehículo usando la pestaña 
                <button 
                  type="button" 
                  onClick={() => setActiveTab('adicionales')}
                  className="font-semibold text-blue-800 dark:text-blue-200 underline hover:no-underline mx-1"
                >
                  Licencia / Vehículo
                </button>
                (solo para conductores).
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Tab: Licencia / Vehículo */}
      {activeTab === 'adicionales' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Nota:</strong> Los datos de licencia y vehículo solo aplican para personal que conduce vehículos (conductores).
              Policías, serenos y otro personal que participa en operativos pero no conduce, no requieren estos datos.
            </p>
          </div>
          
          <h4 className="font-medium text-slate-900 dark:text-slate-50 border-b border-slate-200 dark:border-slate-700 pb-2">
            Licencia de Conducir
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Nro. Licencia</label>
              <input
                value={formData.licencia}
                onChange={(e) => setFormData({ ...formData, licencia: e.target.value.toUpperCase() })}
                placeholder="Ej: Q12345678"
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              />
              <p className="mt-1 text-xs text-slate-500">Formato: Letra + 8 dígitos</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Categoría</label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              >
                <option value="">— Seleccione —</option>
                <optgroup label="Clase A - Motocicletas">
                  <option value="A-I">A-I (Hasta 125cc)</option>
                  <option value="A-IIA">A-IIA (Hasta 400cc)</option>
                  <option value="A-IIB">A-IIB (Sin límite)</option>
                  <option value="A-IIIA">A-IIIA (Mototaxis)</option>
                  <option value="A-IIIB">A-IIIB (Trimotos carga)</option>
                  <option value="A-IIIC">A-IIIC (Especiales)</option>
                </optgroup>
                <optgroup label="Clase B - Automóviles">
                  <option value="B-I">B-I (Particulares)</option>
                  <option value="B-IIA">B-IIA (Taxis/Colectivos)</option>
                  <option value="B-IIB">B-IIB (Camiones/Buses)</option>
                  <option value="B-IIC">B-IIC (Pesados especiales)</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Vigencia</label>
              <input
                type="date"
                value={formData.vigencia}
                onChange={(e) => setFormData({ ...formData, vigencia: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              />
            </div>
          </div>

          <h4 className="font-medium text-slate-900 dark:text-slate-50 border-b border-slate-200 dark:border-slate-700 pb-2 mt-6">
            Vehículo Asignado
          </h4>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Vehículo</label>
            <select
              value={formData.vehiculo_id}
              onChange={(e) => setFormData({ ...formData, vehiculo_id: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              <option value="">— Sin vehículo asignado —</option>
              {vehiculosDisponibles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.placa} - {v.marca} {v.modelo} ({v.codigo_vehiculo || 'Sin código'})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Solo se muestran vehículos disponibles (sin conductor asignado)
            </p>
          </div>
        </div>
      )}
    </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Personal</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gestión del personal de seguridad ciudadana</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchPersonal({ nextPage: page })}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Refrescar
          </button>
          {canCreate && (
            <button
              onClick={() => { resetForm(); setShowCreateModal(true) }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-700 text-white px-4 py-2 text-sm font-medium hover:bg-primary-800"
            >
              <Plus size={16} />
              Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar por nombre, documento..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={handleSearch}
            className="rounded-lg bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 text-sm font-medium hover:bg-slate-900 dark:hover:bg-slate-600"
          >
            Buscar
          </button>
          <button
            onClick={() => { setSearch(''); setFilterStatus(''); setPage(1); fetchPersonal({ nextPage: 1, searchOverride: '', statusOverride: '' }) }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Documento</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Nombre Completo</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Cargo</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Licencia</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Cargando...</td></tr>
              ) : personal.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No hay registros</td></tr>
              ) : (
                personal.map((p) => (
                  <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${p.deleted_at ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      <span className="text-xs text-slate-500">{p.doc_tipo}</span><br />
                      {p.doc_numero}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-50 font-medium">
                      {p.apellido_paterno} {p.apellido_materno}, {p.nombres}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {p.PersonalSeguridadCargo?.nombre || p.cargo?.nombre || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {p.licencia ? (
                        <span title={`Cat: ${p.categoria || '?'} | Vig: ${p.vigencia || '?'}`}>
                          {p.licencia}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingPersonal(p)}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Ver detalle"
                        >
                          <Eye size={14} />
                        </button>
                        {canEdit && !p.deleted_at && (
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {p.deleted_at ? (
                          <button
                            onClick={() => handleRestore(p)}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            title="Restaurar"
                          >
                            <UserCheck size={14} />
                          </button>
                        ) : canDelete && (
                          <button
                            onClick={() => handleDelete(p)}
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
        {pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-500">
              Mostrando {personal.length} de {pagination.total || 0}
            </span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-2 text-sm">{page} / {pagination.totalPages || 1}</span>
              <button
                disabled={page >= (pagination.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
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
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-8 h-8" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="shieldGradPersonalCreate" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#4F7942',stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#2D4A22',stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <path d="M16 2 L28 6 L28 14 C28 22 22 28 16 30 C10 28 4 22 4 14 L4 6 Z" 
                      fill="url(#shieldGradPersonalCreate)" stroke="#1a2e14" strokeWidth="1"/>
                <text x="16" y="20" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" 
                      fill="#FFFFFF" textAnchor="middle">C</text>
              </svg>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Nuevo Personal</h3>
            </div>
            {renderFormTabs(false)}
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
              <span className="text-xs text-slate-400">Alt+G = Guardar | Esc = Cancelar</span>
              <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                id="btn-crear-personal"
                disabled={saving}
                onClick={handleCreate}
                className="rounded-lg bg-primary-700 text-white px-4 py-2 text-sm font-medium hover:bg-primary-800 disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Crear Personal'}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editingPersonal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
              Editar: {editingPersonal.nombres} {editingPersonal.apellido_paterno}
            </h3>
            {renderFormTabs(true)}
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
              <span className="text-xs text-slate-400">Alt+G = Guardar | Esc = Cancelar</span>
              <div className="flex gap-2">
              <button
                onClick={() => { setEditingPersonal(null); resetForm() }}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                id="btn-guardar-personal"
                disabled={saving}
                onClick={handleUpdate}
                className="rounded-lg bg-primary-700 text-white px-4 py-2 text-sm font-medium hover:bg-primary-800 disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalle */}
      {viewingPersonal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {viewingPersonal.nombres} {viewingPersonal.apellido_paterno} {viewingPersonal.apellido_materno}
            </h3>
            
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-2">Datos Personales</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-500">Documento:</span> <span className="text-slate-900 dark:text-slate-50">{viewingPersonal.doc_tipo} - {viewingPersonal.doc_numero}</span></div>
                  <div><span className="text-slate-500">Sexo:</span> <span className="text-slate-900 dark:text-slate-50">{viewingPersonal.sexo || '—'}</span></div>
                  <div><span className="text-slate-500">Nacionalidad:</span> <span className="text-slate-900 dark:text-slate-50">{viewingPersonal.nacionalidad || '—'}</span></div>
                  <div><span className="text-slate-500">F. Nacimiento:</span> <span className="text-slate-900 dark:text-slate-50">{viewingPersonal.fecha_nacimiento || '—'}</span></div>
                </div>
              </div>

              <div className="col-span-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-2">Datos Laborales</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-slate-500">Cargo:</span> <span className="text-slate-900 dark:text-slate-50">{viewingPersonal.PersonalSeguridadCargo?.nombre || '—'}</span></div>
                  <div><span className="text-slate-500">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(viewingPersonal.status)}`}>{viewingPersonal.status}</span></div>
                  <div><span className="text-slate-500">Régimen:</span> <span className="text-slate-900 dark:text-slate-50">{viewingPersonal.regimen || '—'}</span></div>
                  <div><span className="text-slate-500">F. Ingreso:</span> <span className="text-slate-900 dark:text-slate-50">{viewingPersonal.fecha_ingreso || '—'}</span></div>
                </div>
              </div>

              <div className="col-span-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h4 className="font-medium text-slate-700 dark:text-slate-200 mb-2">Ubicación</h4>
                <div className="space-y-1">
                  <div><span className="text-slate-500">Dirección:</span> <span className="text-slate-900 dark:text-slate-50">{viewingPersonal.direccion || '—'}</span></div>
                  <div><span className="text-slate-500">Ubigeo:</span> <span className="text-slate-900 dark:text-slate-50">
                    {viewingPersonal.PersonalSeguridadUbigeo 
                      ? `${viewingPersonal.PersonalSeguridadUbigeo.departamento} - ${viewingPersonal.PersonalSeguridadUbigeo.provincia} - ${viewingPersonal.PersonalSeguridadUbigeo.distrito}`
                      : '—'}
                  </span></div>
                </div>
              </div>

              {(viewingPersonal.licencia || viewingPersonal.vehiculo_id) && (
                <div className="col-span-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Licencia / Vehículo</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-blue-600 dark:text-blue-400">Licencia:</span> <span className="text-slate-900 dark:text-slate-50">{viewingPersonal.licencia || '—'}</span></div>
                    <div><span className="text-blue-600 dark:text-blue-400">Categoría:</span> <span className="text-slate-900 dark:text-slate-50">{viewingPersonal.categoria || '—'}</span></div>
                    <div><span className="text-blue-600 dark:text-blue-400">Vigencia:</span> <span className="text-slate-900 dark:text-slate-50">{viewingPersonal.vigencia || '—'}</span></div>
                    <div><span className="text-blue-600 dark:text-blue-400">Vehículo:</span> <span className="text-slate-900 dark:text-slate-50">
                      {viewingPersonal.PersonalSeguridadVehiculo 
                        ? `${viewingPersonal.PersonalSeguridadVehiculo.placa} (${viewingPersonal.PersonalSeguridadVehiculo.codigo_vehiculo || 'Sin código'})`
                        : '—'}
                    </span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingPersonal(null)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
