import { useState, useEffect } from 'react'
import { Users, Car, AlertTriangle, CheckCircle, RefreshCw, TrendingUp, Clock, Map } from 'lucide-react'
import { getEstadisticasPersonal } from '../../services/personalService'
import { getEstadisticasVehiculos } from '../../services/vehiculosService'
import { getEstadisticasNovedades, listNovedades } from '../../services/novedadesService'
import MapaIncidentes from '../../components/MapaIncidentes'

/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\pages\\dashboard\\DashboardPage.jsx
 * @version 2.0.0
 * @description Página de Dashboard con estadísticas y mapa de incidentes.
 *
 * @module src/pages/dashboard/DashboardPage.jsx
 */

/**
 * DashboardPage - Vista principal con tarjetas de métricas y mapa
 *
 * @component
 * @category Pages
 * @returns {JSX.Element}
 */

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    personalActivo: 0,
    vehiculosOperativos: 0,
    novedadesAbiertas: 0,
    novedadesResueltasHoy: 0,
    tiempoPromedioRespuesta: 0,
    novedadesPorPrioridad: [],
    novedadesPorEstado: [],
    novedadesPorTipo: []
  })
  const [novedadesParaMapa, setNovedadesParaMapa] = useState([])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [personalStats, vehiculosStats, novedadesStats, novedadesList] = await Promise.all([
        getEstadisticasPersonal(),
        getEstadisticasVehiculos(),
        getEstadisticasNovedades(),
        listNovedades({ limit: 100 }) // Cargar novedades para el mapa
      ])
      
      // Filtrar novedades con coordenadas para el mapa
      const listaNovedades = novedadesList?.novedades || novedadesList?.data || []
      const novedadesConCoordenadas = Array.isArray(listaNovedades) 
        ? listaNovedades.filter(n => n.latitud && n.longitud)
        : []
      setNovedadesParaMapa(novedadesConCoordenadas)

      console.log('📊 Stats recibidas:', { personalStats, vehiculosStats, novedadesStats })

      // Personal activo - buscar en diferentes estructuras posibles
      const personalActivo = personalStats?.resumen?.activos 
        || personalStats?.activos 
        || personalStats?.data?.resumen?.activos 
        || personalStats?.data?.activos 
        || 0

      // Vehículos operativos (disponibles + en servicio)
      const vehiculosPorEstado = vehiculosStats?.vehiculosPorEstado || []
      const estadosOperativos = ['DISPONIBLE', 'EN_SERVICIO']
      const vehiculosOperativos = vehiculosPorEstado
        .filter(v => estadosOperativos.includes(v.estado_operativo))
        .reduce((sum, v) => sum + parseInt(v.cantidad || 0), 0)
        || vehiculosStats?.vehiculosDisponibles || 0

      // Novedades - usar totalNovedades del día
      const totalNovedadesHoy = novedadesStats?.totalNovedades || 0
      const novedadesPorEstado = novedadesStats?.novedadesPorEstado || []
      
      // Estados finales (cerrados/resueltos/derivados)
      const estadosFinales = ['cerrado', 'cancelado', 'derivado', 'resuelto', 'archivado']
      let novedadesAbiertas = 0
      let novedadesResueltasHoy = 0
      
      if (novedadesPorEstado.length > 0) {
        novedadesPorEstado.forEach(e => {
          const nombreEstado = (e.novedadEstado?.nombre || '').toLowerCase().replace(/\s+/g, ' ').trim()
          const cantidad = parseInt(e.dataValues?.cantidad || e.cantidad || 0)
          
          // Verificar si es un estado final
          const esEstadoFinal = estadosFinales.some(ef => nombreEstado.includes(ef))
          
          if (esEstadoFinal) {
            novedadesResueltasHoy += cantidad
          } else {
            // Estados abiertos: Pendiente, Despachado, En Atención, En Ruta, etc.
            novedadesAbiertas += cantidad
          }
        })
      } else {
        // Si no hay desglose por estado, usar el total como abiertas
        novedadesAbiertas = totalNovedadesHoy
      }

      setStats({
        personalActivo,
        vehiculosOperativos,
        novedadesAbiertas,
        novedadesResueltasHoy,
        tiempoPromedioRespuesta: novedadesStats?.tiempoPromedioRespuesta || 0,
        novedadesPorPrioridad: novedadesStats?.novedadesPorPrioridad || [],
        novedadesPorEstado,
        novedadesPorTipo: novedadesStats?.novedadesPorTipo || []
      })
    } catch (err) {
      console.error('Error cargando estadísticas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const cards = [
    { 
      label: 'Personal Activo', 
      value: stats.personalActivo, 
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    { 
      label: 'Vehículos Operativos', 
      value: stats.vehiculosOperativos, 
      icon: Car,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    { 
      label: 'Novedades Abiertas', 
      value: stats.novedadesAbiertas, 
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    },
    { 
      label: 'Resueltas Hoy', 
      value: stats.novedadesResueltasHoy, 
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Dashboard</h1>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon size={18} className={item.color} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-3">
              {loading ? '—' : item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tiempo promedio de respuesta */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-slate-500" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Tiempo Promedio de Respuesta</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {loading ? '—' : `${stats.tiempoPromedioRespuesta} min`}
          </p>
        </div>

        {/* Novedades por prioridad */}
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-slate-500" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Novedades por Prioridad (Hoy)</p>
          </div>
          {loading ? (
            <p className="text-slate-500">Cargando...</p>
          ) : stats.novedadesPorPrioridad.length === 0 ? (
            <p className="text-slate-500 text-sm">Sin novedades hoy</p>
          ) : (
            <div className="flex gap-4">
              {stats.novedadesPorPrioridad.map((p) => (
                <div key={p.prioridad_actual} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    p.prioridad_actual === 'ALTA' ? 'bg-red-500' :
                    p.prioridad_actual === 'MEDIA' ? 'bg-amber-500' : 'bg-green-500'
                  }`}></span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{p.prioridad_actual}:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-50">{p.cantidad}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Novedades por tipo */}
      {stats.novedadesPorTipo.length > 0 && (
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Novedades por Tipo (Hoy)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stats.novedadesPorTipo.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                  {t.novedadTipoNovedad?.nombre || 'Sin tipo'}
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-50 ml-2">
                  {t.dataValues?.cantidad || t.cantidad || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mapa de Incidentes */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Map size={18} className="text-slate-500" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Mapa de Incidentes</p>
          <span className="text-xs text-slate-500 ml-auto">
            {novedadesParaMapa.length} incidentes georeferenciados
          </span>
        </div>
        <MapaIncidentes 
          novedades={novedadesParaMapa} 
          height="450px"
          showFilters={true}
        />
      </div>
    </div>
  )
}
