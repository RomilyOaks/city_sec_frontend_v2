/**
 * File: src/pages/admin/AuditoriaPage.jsx
 * @description Panel de consulta del registro de auditoría del sistema.
 * Filtros: fecha, usuario, acción, módulo, severidad, resultado.
 * Funcionalidades: listado paginado, detalle en modal, exportación CSV.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  Search,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  CheckCircle,
  XCircle,
} from "lucide-react";

import { getAuditoria, getAuditoriaById, buildCsvUrl } from "../../services/auditoriaService.js";
import { listUsers } from "../../services/usersService.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import useBodyScrollLock from "../../hooks/useBodyScrollLock.js";

// ─── Constantes de dominio ────────────────────────────────────────────────────

const ACCIONES = [
  { value: "", label: "Todas las acciones" },
  { value: "CREATE", label: "Crear" },
  { value: "UPDATE", label: "Actualizar" },
  { value: "DELETE", label: "Eliminar" },
  { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" },
  { value: "LOGIN_FAILED", label: "Login fallido" },
  { value: "PASSWORD_CHANGE", label: "Cambio contraseña" },
  { value: "EXPORT", label: "Exportación" },
  { value: "IMPORT", label: "Importación" },
  { value: "VIEW", label: "Vista" },
];

const SEVERIDADES = [
  { value: "", label: "Todas las severidades" },
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "CRITICA", label: "Crítica" },
];

const RESULTADOS = [
  { value: "", label: "Todos los resultados" },
  { value: "EXITO", label: "Éxito" },
  { value: "FALLO", label: "Fallo" },
  { value: "DENEGADO", label: "Denegado" },
];

const LIMITES = [25, 50, 100];

const FILTROS_INICIAL = {
  fecha_inicio: "",
  fecha_fin: "",
  usuario_id: "",
  accion: "",
  modulo: "",
  severidad: "",
  resultado: "",
  page: 1,
  limit: 50,
};

// ─── Helpers de presentación ──────────────────────────────────────────────────

function SeveridadBadge({ severidad }) {
  const map = {
    BAJA: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    MEDIA: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    ALTA: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    CRITICA: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[severidad] ?? map.BAJA}`}>
      {severidad}
    </span>
  );
}

function ResultadoBadge({ resultado }) {
  if (resultado === "EXITO" || resultado === "EXITOSO") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
        <CheckCircle size={13} /> Éxito
      </span>
    );
  }
  if (resultado === "DENEGADO") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
        <Shield size={13} /> Denegado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
      <XCircle size={13} /> Fallo
    </span>
  );
}

function AccionBadge({ accion }) {
  const colorMap = {
    CREATE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    DELETE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    LOGIN: "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
    LOGOUT: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    LOGIN_FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    PASSWORD_CHANGE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    EXPORT: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    IMPORT: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
    VIEW: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorMap[accion] ?? colorMap.VIEW}`}>
      {accion}
    </span>
  );
}

function formatFecha(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function JsonBlock({ data }) {
  if (!data) return <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>;
  let parsed = data;
  if (typeof data === "string") {
    try { parsed = JSON.parse(data); } catch { return <pre className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{data}</pre>; }
  }
  return (
    <pre className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap overflow-auto max-h-64 bg-slate-50 dark:bg-slate-900/50 rounded p-2">
      {JSON.stringify(parsed, null, 2)}
    </pre>
  );
}

// ─── Modal de detalle ─────────────────────────────────────────────────────────

function DetalleModal({ registroId, onClose }) {
  const [registro, setRegistro] = useState(null);
  const [cargando, setCargando] = useState(true); // true: espera la petición inicial

  useBodyScrollLock(true);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    let cancelado = false;
    // No llamamos setCargando(true) aquí porque ya empieza en true
    getAuditoriaById(registroId)
      .then((res) => { if (!cancelado) setRegistro(res.data?.data ?? null); })
      .catch(() => { if (!cancelado) toast.error("No se pudo cargar el detalle"); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [registroId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col max-h-[90vh]">
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Shield size={18} className="text-primary-700 dark:text-primary-400" />
            Detalle del registro #{registroId}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 text-sm">
          {cargando ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">Cargando...</p>
          ) : !registro ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">Sin datos</p>
          ) : (
            <>
              {/* Información principal */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <Field label="Fecha" value={formatFecha(registro.created_at)} />
                <Field label="Usuario" value={registro.usuario?.username ?? `ID ${registro.usuario_id}`} />
                <Field label="Acción">
                  <AccionBadge accion={registro.accion} />
                </Field>
                <Field label="Severidad">
                  <SeveridadBadge severidad={registro.severidad} />
                </Field>
                <Field label="Módulo" value={registro.modulo ?? "—"} />
                <Field label="Resultado">
                  <ResultadoBadge resultado={registro.resultado} />
                </Field>
                <Field label="Entidad" value={registro.entidad_tipo ?? "—"} />
                <Field label="ID Entidad" value={registro.entidad_id ?? "—"} />
                <Field label="IP" value={registro.ip_address ?? "—"} />
                {registro.duracion_ms != null && (
                  <Field label="Duración" value={`${registro.duracion_ms} ms`} />
                )}
              </div>

              <Field label="Descripción" value={registro.descripcion ?? "—"} />

              {registro.mensaje_error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Mensaje de error</p>
                  <p className="text-xs text-red-600 dark:text-red-300">{registro.mensaje_error}</p>
                </div>
              )}

              {(registro.datos_anteriores || registro.datos_nuevos) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Datos anteriores</p>
                    <JsonBlock data={registro.datos_anteriores} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Datos nuevos</p>
                    <JsonBlock data={registro.datos_nuevos} />
                  </div>
                </div>
              )}

              {registro.metadata && (
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Metadata</p>
                  <JsonBlock data={registro.metadata} />
                </div>
              )}

              {registro.user_agent && (
                <Field label="User-Agent">
                  <span className="text-xs text-slate-500 dark:text-slate-400 break-all">{registro.user_agent}</span>
                </Field>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      {children ?? <p className="text-sm text-slate-800 dark:text-slate-100">{value}</p>}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AuditoriaPage() {
  const token = useAuthStore((s) => s.token);

  const [filtros, setFiltros] = useState(FILTROS_INICIAL);
  const [registros, setRegistros] = useState([]);
  const [paginacion, setPaginacion] = useState({ total: 0, page: 1, totalPages: 1 });
  const [cargando, setCargando] = useState(false);
  const [detalleId, setDetalleId] = useState(null);
  const [usuarios, setUsuarios] = useState([]);

  // Ref para cancelar peticiones anteriores si llegan después de una nueva
  const reqId = useRef(0);

  // Cargar lista de usuarios para el dropdown
  useEffect(() => {
    listUsers({ limit: 200, estado: "ACTIVO" })
      .then(({ usuarios: lista }) => setUsuarios(lista))
      .catch(() => {}); // silencioso — el filtro queda sin opciones
  }, []);

  const cargar = useCallback(async (params) => {
    setCargando(true);
    const id = ++reqId.current;
    try {
      const res = await getAuditoria(params);
      if (reqId.current !== id) return;
      setRegistros(res.data?.data ?? []);
      setPaginacion(res.data?.pagination ?? { total: 0, page: 1, totalPages: 1 });
    } catch {
      if (reqId.current === id) toast.error("Error al cargar registros de auditoría");
    } finally {
      if (reqId.current === id) setCargando(false);
    }
  }, []);

  // Cargar al montar y cuando cambian los filtros
  useEffect(() => {
    cargar(filtros);
  }, [filtros, cargar]);

  const handleFiltroChange = (campo, valor) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor, page: 1 }));
  };

  const handleLimpiar = () => setFiltros(FILTROS_INICIAL);

  const handlePagina = (nueva) => {
    setFiltros((prev) => ({ ...prev, page: nueva }));
  };

  const handleExportarCsv = () => {
    const { page: _p, limit: _l, ...filtrosSinPagina } = filtros;
    const url = buildCsvUrl({ ...filtrosSinPagina, limit: 10000 });
    // Añadir token manualmente porque la descarga es via <a> href
    const fullUrl = `${url}${url.includes("?") ? "&" : "?"}token=${token}`;
    const a = document.createElement("a");
    a.href = fullUrl;
    a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const hayFiltrosActivos = Object.entries(filtros).some(
    ([k, v]) => !["page", "limit"].includes(k) && v !== ""
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Shield size={20} className="text-primary-700 dark:text-primary-400" />
            Auditoría del sistema
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Registro de todas las acciones realizadas por los usuarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cargar(filtros)}
            disabled={cargando}
            title="Actualizar"
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw size={16} className={cargando ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleExportarCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-700 text-white text-sm font-medium hover:bg-primary-800"
          >
            <Download size={15} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Fecha inicio */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filtros.fecha_inicio}
              onChange={(e) => handleFiltroChange("fecha_inicio", e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 [&::-webkit-calendar-picker-indicator]:dark:invert"
            />
          </div>

          {/* Fecha fin */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filtros.fecha_fin}
              onChange={(e) => handleFiltroChange("fecha_fin", e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 [&::-webkit-calendar-picker-indicator]:dark:invert"
            />
          </div>

          {/* Acción */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Acción
            </label>
            <select
              value={filtros.accion}
              onChange={(e) => handleFiltroChange("accion", e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            >
              {ACCIONES.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          {/* Módulo */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Módulo
            </label>
            <input
              type="text"
              placeholder="ej: Novedades"
              value={filtros.modulo}
              onChange={(e) => handleFiltroChange("modulo", e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            />
          </div>

          {/* Severidad */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Severidad
            </label>
            <select
              value={filtros.severidad}
              onChange={(e) => handleFiltroChange("severidad", e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            >
              {SEVERIDADES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Resultado */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Resultado
            </label>
            <select
              value={filtros.resultado}
              onChange={(e) => handleFiltroChange("resultado", e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            >
              {RESULTADOS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Usuario — dropdown */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Usuario
            </label>
            <select
              value={filtros.usuario_id}
              onChange={(e) => handleFiltroChange("usuario_id", e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}{u.nombres ? ` — ${u.nombres} ${u.apellidos ?? ""}`.trimEnd() : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Filas por página */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Filas por página
            </label>
            <select
              value={filtros.limit}
              onChange={(e) => setFiltros((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            >
              {LIMITES.map((l) => (
                <option key={l} value={l}>{l} registros</option>
              ))}
            </select>
          </div>
        </div>

        {hayFiltrosActivos && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleLimpiar}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary-700 dark:hover:text-primary-400 flex items-center gap-1"
            >
              <X size={13} /> Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Contador */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {cargando ? "Cargando..." : `${paginacion.total.toLocaleString("es-PE")} registros encontrados`}
          </span>
          {paginacion.totalPages > 1 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Página {paginacion.page} de {paginacion.totalPages}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Fecha</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Usuario</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Acción</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Módulo</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Entidad</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xs">Descripción</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Severidad</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Resultado</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cargando && registros.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    Cargando registros...
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                      <Search size={28} className="opacity-40" />
                      <span className="text-sm">No se encontraron registros con los filtros aplicados</span>
                    </div>
                  </td>
                </tr>
              ) : (
                registros.map((reg) => (
                  <tr
                    key={reg.id}
                    onClick={() => setDetalleId(reg.id)}
                    className={`cursor-pointer hover:bg-primary-50 dark:hover:bg-slate-800/60 transition-colors ${cargando ? "opacity-60" : ""}`}
                    title="Clic para ver detalle"
                  >
                    <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono">
                      {formatFecha(reg.created_at)}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 whitespace-nowrap">
                      {reg.usuario?.username ?? `#${reg.usuario_id}`}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <AccionBadge accion={reg.accion} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300">
                      {reg.modulo ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400">
                      {reg.entidad_tipo ? `${reg.entidad_tipo}${reg.entidad_id ? ` #${reg.entidad_id}` : ""}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-300 max-w-xs">
                      <span className="line-clamp-2" title={reg.descripcion}>{reg.descripcion ?? "—"}</span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <SeveridadBadge severidad={reg.severidad} />
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <ResultadoBadge resultado={reg.resultado} />
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                      {reg.ip_address ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {paginacion.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Mostrando {((paginacion.page - 1) * filtros.limit) + 1}–{Math.min(paginacion.page * filtros.limit, paginacion.total)} de {paginacion.total.toLocaleString("es-PE")}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePagina(paginacion.page - 1)}
                disabled={paginacion.page <= 1 || cargando}
                className="p-1.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Páginas visibles */}
              {Array.from({ length: Math.min(5, paginacion.totalPages) }, (_, i) => {
                let p;
                if (paginacion.totalPages <= 5) {
                  p = i + 1;
                } else if (paginacion.page <= 3) {
                  p = i + 1;
                } else if (paginacion.page >= paginacion.totalPages - 2) {
                  p = paginacion.totalPages - 4 + i;
                } else {
                  p = paginacion.page - 2 + i;
                }
                return (
                  <button
                    key={p}
                    onClick={() => handlePagina(p)}
                    disabled={cargando}
                    className={`w-8 h-8 rounded border text-xs font-medium disabled:opacity-40 ${
                      p === paginacion.page
                        ? "bg-primary-700 text-white border-primary-700"
                        : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                onClick={() => handlePagina(paginacion.page + 1)}
                disabled={paginacion.page >= paginacion.totalPages || cargando}
                className="p-1.5 rounded border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {detalleId !== null && (
        <DetalleModal registroId={detalleId} onClose={() => setDetalleId(null)} />
      )}
    </div>
  );
}
