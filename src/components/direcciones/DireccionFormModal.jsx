import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { validarDireccion, createDireccion, updateDireccion } from "../../services/direccionesService";
import { listCallesActivas } from "../../services/callesService";
import { listSectores } from "../../services/sectoresService";
import { listCuadrantes, getCuadranteById } from "../../services/cuadrantesService";
import { listUbigeos, getUbigeoByCode } from "../../services/novedadesService";
import { toast } from "react-hot-toast";

/**
 * File: src/components/direcciones/DireccionFormModal.jsx
 * @version 1.0.0
 * @description Modal para crear/editar direcciones con sistema dual
 *
 * FEATURES:
 * - Sistema dual: Numeración municipal Y/O Manzana+Lote
 * - Auto-asignación de cuadrante y sector al seleccionar calle+número
 * - Validación en tiempo real
 * - Geocodificación opcional (coordenadas GPS)
 * - Shortcuts: ESC para cerrar, ALT+G para guardar
 *
 * @module src/components/direcciones/DireccionFormModal
 */

export default function DireccionFormModal({ isOpen, onClose, direccion = null }) {
  const TIPOS_COMPLEMENTO = [
    { value: "DEPTO", label: "Departamento" },
    { value: "OFICINA", label: "Oficina" },
    { value: "PISO", label: "Piso" },
    { value: "INTERIOR", label: "Interior" },
    { value: "LOTE", label: "Lote" },
    { value: "MZ", label: "Manzana" },
    { value: "BLOCK", label: "Block" },
    { value: "TORRE", label: "Torre" },
    { value: "CASA", label: "Casa" },
  ];
  const [loading, setLoading] = useState(false);
  const [cuadrantes, setCuadrantes] = useState([]);
  const [calles, setCalles] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [ubigeoSearch, setUbigeoSearch] = useState("");
  const [ubigeoOptions, setUbigeoOptions] = useState([]);
  const [showUbigeoDropdown, setShowUbigeoDropdown] = useState(false);
  const [formData, setFormData] = useState({
    calle_id: "",
    numero_municipal: "",
    manzana: "",
    lote: "",
    urbanizacion: "",
    tipo_complemento: "",
    numero_complemento: "",
    referencia: "",
    sector_id: "",
    cuadrante_id: "",
    ubigeo_code: "",
    latitud: "",
    longitud: "",
    observaciones: "",
  });

  // --- Declarar funciones antes de los useEffect que las usan ---

  const loadCalles = async () => {
    try {
      const res = await listCallesActivas();
      setCalles(res?.items || res || []);
    } catch (error) {}
  };

  const loadSectores = async () => {
    try {
      const res = await listSectores({ page: 1, limit: 100 });
      setSectores(res?.items || res || []);
    } catch (err) {}
  };

  const loadCuadrantesForSector = async (sectorId) => {
    try {
      if (!sectorId) {
        setCuadrantes([]);
        return;
      }
      const res = await listCuadrantes({ sector_id: sectorId, limit: 100 });
      setCuadrantes(res?.items || res || []);
    } catch (err) {}
  };

  const loadUbigeoByCode = async (code) => {
    try {
      const ubigeo = await getUbigeoByCode(code);
      if (ubigeo) {
        setUbigeoSearch(`${ubigeo.distrito} - ${ubigeo.provincia}, ${ubigeo.departamento}`);
      } else {
        setUbigeoSearch("");
      }
    } catch (err) {
      console.error("Error al buscar ubigeo:", err);
      setUbigeoSearch("");
    }
  };

  const handleAutoValidate = async () => {
    try {
      const payload = {
        calle_id: formData.calle_id,
        numero_municipal: formData.numero_municipal || null,
        manzana: formData.manzana || null,
        lote: formData.lote || null,
      };
      const result = await validarDireccion(payload);
      if (result?.auto_asignado) {
        if (result.sector?.id && !formData.sector_id) {
          setFormData((prev) => ({
            ...prev,
            sector_id: String(result.sector.id),
          }));
          await loadCuadrantesForSector(result.sector.id);
        } else if (result.sector?.id) {
          await loadCuadrantesForSector(result.sector.id);
        }
        if (result.cuadrante?.id && !formData.cuadrante_id) {
          setFormData((prev) => ({
            ...prev,
            cuadrante_id: String(result.cuadrante.id),
          }));
          try {
            const cq = await getCuadranteById(result.cuadrante.id);
            if (cq) {
              setFormData((prev) => ({
                ...prev,
                latitud: cq.latitud ?? prev.latitud,
                longitud: cq.longitud ?? prev.longitud,
                ubigeo_code: cq.ubigeo_code ?? prev.ubigeo_code,
              }));
            }
          } catch (err) {}
        }
      }
    } catch (error) {}
  };

  // Cargar calles activas
  useEffect(() => {
    if (isOpen) {
      loadCalles();
      loadSectores();
    }
  }, [isOpen]);

  // Cargar datos de dirección al editar
  useEffect(() => {
    if (isOpen && direccion) {
      setFormData({
        calle_id: direccion.calle_id ? String(direccion.calle_id) : "",
        numero_municipal: direccion.numero_municipal || "",
        manzana: direccion.manzana || "",
        lote: direccion.lote || "",
        urbanizacion: direccion.urbanizacion || "",
        tipo_complemento: direccion.tipo_complemento || "",
        numero_complemento: direccion.numero_complemento || "",
        referencia: direccion.referencia || "",
        sector_id: direccion.sector_id ? String(direccion.sector_id) : "",
        cuadrante_id: direccion.cuadrante_id ? String(direccion.cuadrante_id) : "",
        ubigeo_code: direccion.ubigeo_code || direccion.calle?.ubigeo_code || "",
        latitud: direccion.latitud || "",
        longitud: direccion.longitud || "",
        observaciones: direccion.observaciones || "",
      });
      // Cargar cuadrantes si hay sector
      if (direccion.sector_id) {
        loadCuadrantesForSector(direccion.sector_id);
      }
      // Mostrar ubigeo si existe
      if (direccion.ubigeo_code || direccion.calle?.ubigeo_code) {
        const code = direccion.ubigeo_code || direccion.calle?.ubigeo_code;
        if (direccion.ubigeo) {
          // Si viene la relación ubigeo en la dirección
          const u = direccion.ubigeo;
          setUbigeoSearch(`${u.distrito} - ${u.provincia}, ${u.departamento}`);
        } else if (direccion.calle?.Ubigeo) {
          // Si viene la relación ubigeo en la calle
          const u = direccion.calle.Ubigeo;
          setUbigeoSearch(`${u.distrito} - ${u.provincia}, ${u.departamento}`);
        } else {
          // Si no hay relación, buscar el ubigeo por código
          loadUbigeoByCode(code);
        }
      }
    }
  }, [isOpen, direccion]);


  // Funciones auxiliares declaradas antes de los hooks
  function handleClose() {
    setFormData({
      calle_id: "",
      numero_municipal: "",
      manzana: "",
      lote: "",
      urbanizacion: "",
      tipo_complemento: "",
      numero_complemento: "",
      referencia: "",
      sector_id: "",
      cuadrante_id: "",
      ubigeo_code: "",
      latitud: "",
      longitud: "",
      observaciones: "",
    });
    setCuadrantes([]);
    if (onClose) onClose();
  }

  useEffect(() => {
    const hasNumero = formData.numero_municipal && formData.numero_municipal.trim();
    const hasManzanaLote = formData.manzana && formData.lote && formData.manzana.trim() && formData.lote.trim();
    if (formData.calle_id && (hasNumero || hasManzanaLote)) {
      if (!formData.cuadrante_id) {
        handleAutoValidate();
      }
    }

  }, [formData.calle_id, formData.numero_municipal, formData.manzana, formData.lote]);


  // Keyboard shortcuts: ESC y ALT+G
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        e.preventDefault();
        handleClose();
      }
      if (e.altKey && e.key === "g" && isOpen && !loading) {
        e.preventDefault();
        document.getElementById("direccion-form")?.requestSubmit();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, loading, handleClose]);

  // Handler para cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler para submit del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Preparar payload con todos los campos
      const payload = {
        calle_id: parseInt(formData.calle_id),
        numero_municipal: formData.numero_municipal || null,
        manzana: formData.manzana || null,
        lote: formData.lote || null,
        urbanizacion: formData.urbanizacion || null,
        tipo_complemento: formData.tipo_complemento || null,
        numero_complemento: formData.numero_complemento || null,
        referencia: formData.referencia || null,
        sector_id: formData.sector_id ? parseInt(formData.sector_id) : null,
        cuadrante_id: formData.cuadrante_id ? parseInt(formData.cuadrante_id) : null,
        ubigeo_code: formData.ubigeo_code || null,
        latitud: formData.latitud || null,
        longitud: formData.longitud || null,
        observaciones: formData.observaciones || null,
      };

      if (direccion) {
        // Actualizar dirección existente
        await updateDireccion(direccion.id, payload);
        toast.success("Dirección actualizada correctamente");
      } else {
        // Crear nueva dirección
        await createDireccion(payload);
        toast.success("Dirección creada correctamente");
      }

      handleClose();
    } catch (error) {
      console.error("Error al guardar dirección:", error);

      const errorMsg = error.response?.data?.message || error.message || "Error al guardar la dirección";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {direccion ? "Editar Dirección" : "Nueva Dirección"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              ESC para cerrar • ALT+G para guardar
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form id="direccion-form" onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Calle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Calle <span className="text-red-500">*</span>
            </label>
            <select
              name="calle_id"
              value={formData.calle_id}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              <option value="">Seleccione una calle</option>
              {calles.map((calle) => (
                <option key={calle.id} value={calle.id}>
                  {calle.nombre_completo || `${calle.tipo_via?.abreviatura || ''} ${calle.nombre_via}`.trim()}
                </option>
              ))}
            </select>
          </div>

          {/* Sistema Dual: Número Municipal O Manzana+Lote */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Número Municipal
              </label>
              <input
                type="text"
                name="numero_municipal"
                value={formData.numero_municipal}
                onChange={handleChange}
                placeholder="Ej: 123"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Manzana
              </label>
              <input
                type="text"
                name="manzana"
                value={formData.manzana}
                onChange={handleChange}
                placeholder="Ej: A"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Lote
              </label>
              <input
                type="text"
                name="lote"
                value={formData.lote}
                onChange={handleChange}
                placeholder="Ej: 15"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              />
            </div>
          </div>

          {/* Urbanización */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Urbanización / AAHH
            </label>
            <input
              type="text"
              name="urbanizacion"
              value={formData.urbanizacion}
              onChange={handleChange}
              placeholder="Nombre de urbanización o asentamiento"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>

          {/* Complementos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Complemento
              </label>
              <select
                name="tipo_complemento"
                value={formData.tipo_complemento}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              >
                <option value="">Sin complemento</option>
                {TIPOS_COMPLEMENTO.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Número de Complemento
              </label>
              <input
                type="text"
                name="numero_complemento"
                value={formData.numero_complemento}
                onChange={handleChange}
                placeholder="Ej: 201"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              />
            </div>
          </div>

          {/* Sector y Cuadrante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sector
              </label>
              <select
                name="sector_id"
                value={formData.sector_id}
                onChange={(e) => {
                  handleChange(e);
                  loadCuadrantesForSector(e.target.value);
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              >
                <option value="">Seleccione sector</option>
                {sectores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre || s.sector_code}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Cuadrante
              </label>
              <select
                name="cuadrante_id"
                value={formData.cuadrante_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              >
                <option value="">Seleccione cuadrante</option>
                {cuadrantes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre || c.cuadrante_code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* UBIGEO */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              UBIGEO
            </label>
            {formData.ubigeo_code && direccion ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex flex-col">
                  <span className="font-mono text-sm text-primary-700 dark:text-primary-400">{formData.ubigeo_code}</span>
                  {ubigeoSearch && <span className="text-xs text-slate-600 dark:text-slate-400 mt-1">{ubigeoSearch}</span>}
                </div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={ubigeoSearch}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setUbigeoSearch(value);
                    if (value.length >= 3) {
                      try {
                        const results = await listUbigeos(value);
                        setUbigeoOptions(results || []);
                        setShowUbigeoDropdown(true);
                      } catch (err) {
                        setUbigeoOptions([]);
                      }
                    } else {
                      setUbigeoOptions([]);
                      setShowUbigeoDropdown(false);
                    }
                  }}
                  onFocus={() => ubigeoOptions.length > 0 && setShowUbigeoDropdown(true)}
                  placeholder="Buscar distrito..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                />
                {showUbigeoDropdown && ubigeoOptions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {ubigeoOptions.map((u) => (
                      <button
                        key={u.ubigeo_code}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, ubigeo_code: u.ubigeo_code }));
                          setUbigeoSearch(`${u.distrito} - ${u.provincia}, ${u.departamento}`);
                          setShowUbigeoDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex justify-between"
                      >
                        <span>{u.distrito}<span className="text-slate-500 ml-2">{u.provincia} - {u.departamento}</span></span>
                        <span className="text-xs font-mono text-primary-600">{u.ubigeo_code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Coordenadas GPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Latitud
              </label>
              <input
                type="text"
                name="latitud"
                value={formData.latitud}
                onChange={handleChange}
                placeholder="Ej: -13.5226"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Longitud
              </label>
              <input
                type="text"
                name="longitud"
                value={formData.longitud}
                onChange={handleChange}
                placeholder="Ej: -71.9675"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              />
            </div>
          </div>

          {/* Referencia */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Referencia
            </label>
            <textarea
              name="referencia"
              value={formData.referencia}
              onChange={handleChange}
              rows={2}
              placeholder="Referencias adicionales para ubicar la dirección"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={2}
              placeholder="Notas adicionales"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="direccion-form"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Guardando..." : direccion ? "Actualizar" : "Crear Dirección"}
          </button>
        </div>
      </div>
    </div>
  );
}





