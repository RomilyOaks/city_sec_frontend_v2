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

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  createDireccion,
  updateDireccion,
  validarDireccion,
} from "../../services/direccionesService";
import { listCallesActivas } from "../../services/callesService";
import { listSectores } from "../../services/sectoresService";
import {
  listCuadrantes,
  getCuadranteById,
} from "../../services/cuadrantesService";
import { toast } from "react-hot-toast";

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

/**
 * DireccionFormModal - Modal de formulario para direcciones
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.direccion - Dirección a editar (null para crear)
 */
export default function DireccionFormModal({
  isOpen,
  onClose,
  direccion = null,
}) {
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [calles, setCalles] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [cuadrantes, setCuadrantes] = useState([]);
  const [autoAssignInfo, setAutoAssignInfo] = useState(null);

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
        calle_id: direccion.calle_id || "",
        numero_municipal: direccion.numero_municipal || "",
        manzana: direccion.manzana || "",
        lote: direccion.lote || "",
        urbanizacion: direccion.urbanizacion || "",
        tipo_complemento: direccion.tipo_complemento || "",
        numero_complemento: direccion.numero_complemento || "",
        referencia: direccion.referencia || "",
        sector_id: direccion.sector_id ? String(direccion.sector_id) : "",
        cuadrante_id: direccion.cuadrante_id
          ? String(direccion.cuadrante_id)
          : "",
        ubigeo_code: direccion.ubigeo_code || "",
        latitud: direccion.latitud || "",
        longitud: direccion.longitud || "",
        observaciones: direccion.observaciones || "",
      });

      // Si la dirección tiene sector, cargar sus cuadrantes
      if (direccion.sector_id) {
        loadCuadrantesForSector(direccion.sector_id);
      }
    } else if (isOpen) {
      // Reset al crear nueva
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
      setAutoAssignInfo(null);
      setCuadrantes([]);
    }
  }, [isOpen, direccion]);

  // Validar auto-asignación cuando cambia calle o número/AAHH
  useEffect(() => {
    const hasNumero =
      formData.numero_municipal && formData.numero_municipal.trim();
    const hasManzanaLote =
      formData.manzana &&
      formData.lote &&
      formData.manzana.trim() &&
      formData.lote.trim();

    if (formData.calle_id && (hasNumero || hasManzanaLote)) {
      // Only auto-assign if cuadrante_id is empty (not manually selected)
      if (!formData.cuadrante_id) {
        handleAutoValidate();
      }
    } else {
      setAutoAssignInfo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.calle_id,
    formData.numero_municipal,
    formData.manzana,
    formData.lote,
  ]);

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
  }, [isOpen, loading]);

  const loadCalles = async () => {
    try {
      const result = await listCallesActivas();
      setCalles(result || []);
    } catch (error) {
      console.error("Error al cargar calles:", error);
      toast.error("Error al cargar calles");
    }
  };

  const loadSectores = async () => {
    try {
      const res = await listSectores({ page: 1, limit: 100 });
      // API puede devolver { items: [...] } o un array
      setSectores(res?.items || res || []);
    } catch (err) {
      console.error("Error al cargar sectores:", err);
    }
  };

  const loadCuadrantesForSector = async (sectorId) => {
    try {
      if (!sectorId) {
        setCuadrantes([]);
        return;
      }
      const res = await listCuadrantes({ sector_id: sectorId, limit: 200 });
      setCuadrantes(res?.items || res || []);
    } catch (err) {
      console.error("Error al cargar cuadrantes:", err);
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
      setAutoAssignInfo(result);

      // Si la API determinó un sector/cuadrante, rellenarlos
      if (result?.auto_asignado) {
        if (result.sector?.id && !formData.sector_id) {
          setFormData((prev) => ({
            ...prev,
            sector_id: String(result.sector.id),
          }));
          // Cargar cuadrantes pertenecientes al sector
          loadCuadrantesForSector(result.sector.id);
        }

        if (result.cuadrante?.id && !formData.cuadrante_id) {
          setFormData((prev) => ({
            ...prev,
            cuadrante_id: String(result.cuadrante.id),
          }));
          // Obtener detalles del cuadrante para lat/lng/ubigeo
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
          } catch (err) {
            console.error("Error al obtener cuadrante:", err);
          }
        }
      }
    } catch (error) {
      console.error("Error en auto-validación:", error);
      setAutoAssignInfo(null);
    }
  };

  const handleClose = () => {
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
    setValidationError("");
    setAutoAssignInfo(null);
    setCuadrantes([]);
    onClose();
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError("");

    // Si se selecciona sector, cargar cuadrantes del sector
    if (name === "sector_id") {
      setFormData((prev) => ({ ...prev, cuadrante_id: "" }));
      loadCuadrantesForSector(value);
      return;
    }

    // Si se selecciona cuadrante, intentar rellenar lat/lng y ubigeo
    if (name === "cuadrante_id") {
      if (!value) return;
      const found = cuadrantes.find((c) => String(c.id) === String(value));
      if (found) {
        setFormData((prev) => ({
          ...prev,
          latitud: found.latitud ?? prev.latitud,
          longitud: found.longitud ?? prev.longitud,
          ubigeo_code: found.ubigeo_code ?? prev.ubigeo_code,
        }));
      } else {
        try {
          const cq = await getCuadranteById(value);
          if (cq) {
            setFormData((prev) => ({
              ...prev,
              latitud: cq.latitud ?? prev.latitud,
              longitud: cq.longitud ?? prev.longitud,
              ubigeo_code: cq.ubigeo_code ?? prev.ubigeo_code,
            }));
          }
        } catch (err) {
          console.error("Error al obtener cuadrante:", err);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setValidationError("");

    // Validar sistema dual
    const tieneNumeroMunicipal = formData.numero_municipal?.trim();
    const tieneManzanaLote = formData.manzana?.trim() && formData.lote?.trim();

    if (!tieneNumeroMunicipal && !tieneManzanaLote) {
      setValidationError(
        "Debe proporcionar al menos uno: Número Municipal O (Manzana + Lote)"
      );
      setLoading(false);
      return;
    }

    try {
      // Preparar datos
      const dataToSend = {
        calle_id: parseInt(formData.calle_id),
        numero_municipal: formData.numero_municipal?.trim() || null,
        manzana: formData.manzana?.trim() || null,
        lote: formData.lote?.trim() || null,
        urbanizacion: formData.urbanizacion?.trim() || null,
        tipo_complemento: formData.tipo_complemento || null,
        numero_complemento: formData.numero_complemento?.trim() || null,
        referencia: formData.referencia?.trim() || null,
        sector_id: formData.sector_id ? parseInt(formData.sector_id) : null,
        cuadrante_id: formData.cuadrante_id
          ? parseInt(formData.cuadrante_id)
          : null,
        ubigeo_code: formData.ubigeo_code || null,
        latitud: formData.latitud ? parseFloat(formData.latitud) : null,
        longitud: formData.longitud ? parseFloat(formData.longitud) : null,
        observaciones: formData.observaciones?.trim() || null,
      };

      if (direccion) {
        // Actualizar
        await updateDireccion(direccion.id, dataToSend);
        toast.success("Dirección actualizada exitosamente");
      } else {
        // Crear
        await createDireccion(dataToSend);
        toast.success("Dirección creada exitosamente");
      }

      handleClose();
    } catch (error) {
      console.error("Error al guardar dirección:", error);

      const backendData = error.response?.data;
      let errorMessage = "Error al guardar la dirección";

      if (backendData?.message) {
        errorMessage = backendData.message;
      } else if (backendData?.errors) {
        if (typeof backendData.errors === "object") {
          errorMessage = Object.values(backendData.errors).join(", ");
        }
      } else if (typeof backendData === "string") {
        errorMessage = backendData;
      }

      setValidationError(errorMessage);
      toast.error(errorMessage);
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
              {direccion ? "Editar" : "Nueva"} Dirección
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Sistema dual: Número municipal O Manzana+Lote
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error de validación */}
        {validationError && (
          <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              {validationError}
            </p>
          </div>
        )}

        {/* Auto-asignación info */}
        {autoAssignInfo && autoAssignInfo.auto_asignado && (
          <div className="mx-6 mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ✓ Auto-asignado:{" "}
              <strong>
                Cuadrante {autoAssignInfo.cuadrante?.codigo} • Sector{" "}
                {autoAssignInfo.sector?.codigo}
              </strong>
            </p>
          </div>
        )}

        {/* Form */}
        <form
          id="direccion-form"
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
        >
          {/* Código - Solo visible al editar (read-only) */}
          {direccion && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Código de Dirección
              </label>
              <input
                type="text"
                value={direccion.direccion_code}
                readOnly
                disabled
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Código único generado automáticamente
              </p>
            </div>
          )}

          {/* Calle - Campo obligatorio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Calle <span className="text-red-500">*</span>
            </label>
            <select
              name="calle_id"
              value={formData.calle_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Seleccione una calle</option>
              {calles.map((calle) => (
                <option key={calle.id} value={calle.id}>
                  {calle.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          {/* Tip de ayuda */}
          <div className="flex justify-end">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Tip:
              </span>{" "}
              ESC para cerrar • ALT+G para guardar
            </p>
          </div>

          {/* SISTEMA 1: Numeración Municipal */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Sistema 1: Numeración Municipal
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Número Municipal
              </label>
              <input
                type="text"
                name="numero_municipal"
                value={formData.numero_municipal}
                onChange={handleChange}
                placeholder="Ej: 450, 250-A, S/N"
                maxLength={10}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Número de puerta o numeración oficial de la calle
              </p>
            </div>
          </div>

          {/* SISTEMA 2: Manzana/Lote */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Sistema 2: Manzana y Lote (AAHH)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Manzana
                </label>
                <input
                  type="text"
                  name="manzana"
                  value={formData.manzana}
                  onChange={handleChange}
                  placeholder="Ej: A, B, 01"
                  maxLength={10}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
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
                  placeholder="Ej: 1, 15, A"
                  maxLength={10}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Para urbanizaciones informales o AAHH sin numeración municipal
            </p>
          </div>

          {/* Complementos */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Complementos Adicionales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Urbanización / AAHH
                </label>
                <input
                  type="text"
                  name="urbanizacion"
                  value={formData.urbanizacion}
                  onChange={handleChange}
                  placeholder="Ej: AAHH Villa El Salvador"
                  maxLength={150}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tipo de Complemento
                </label>
                <select
                  name="tipo_complemento"
                  value={formData.tipo_complemento}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Ninguno</option>
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
                  placeholder="Ej: 201, 5B"
                  maxLength={20}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Referencia
                </label>
                <input
                  type="text"
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  placeholder="Ej: Frente al parque"
                  maxLength={255}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Ubicación administrativa: Sector y Cuadrante (se colocan encima de Geocodificación) */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Ubicación Administrativa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sector
                </label>
                <select
                  name="sector_id"
                  value={formData.sector_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Seleccione un sector</option>
                  {(sectores || []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre || s.codigo || s.id}
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
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Seleccione un cuadrante</option>
                  {(cuadrantes || []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo || c.nombre || c.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Geocodificación */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Geocodificación (Opcional)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Latitud
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitud"
                  value={formData.latitud}
                  onChange={handleChange}
                  placeholder="-12.04637800"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Longitud
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitud"
                  value={formData.longitud}
                  onChange={handleChange}
                  placeholder="-77.03066400"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
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
              rows={3}
              placeholder="Observaciones adicionales sobre la dirección"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Guardando..." : direccion ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
