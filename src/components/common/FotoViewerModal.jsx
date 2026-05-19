import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download, MapPin, Calendar } from "lucide-react";
import { formatForDisplay } from "../../utils/dateHelper";

/** Construye el título abreviado: "HURTO AGRAVADO / A CASA - PUERTA VIOLENTADA" */
function buildTitulo(tipoNombre, subtipoNombre) {
  if (!tipoNombre) return null;
  if (!subtipoNombre) return tipoNombre;
  const slashIdx = tipoNombre.indexOf("/");
  const tipo = slashIdx === -1 ? tipoNombre : tipoNombre.substring(0, slashIdx).trim();
  return `${tipo} / ${subtipoNombre}`;
}

/**
 * Modal de visualización de fotos a pantalla completa.
 * Muestra un header fijo con datos de la novedad asociada.
 *
 * @param {Object[]} fotos          - Array de objetos { url, nombre }
 * @param {number}   currentIndex   - Índice de la foto visible
 * @param {Function} onChangeIndex  - Callback(nuevoIndice)
 * @param {boolean}  isOpen
 * @param {Function} onClose
 * @param {boolean}  puedeDescargar - Controla visibilidad del botón de descarga
 * @param {Object}   novedad        - Objeto novedad completo para mostrar en el header
 */
export default function FotoViewerModal({
  fotos = [],
  currentIndex = 0,
  onChangeIndex,
  isOpen,
  onClose,
  puedeDescargar = false,
  novedad = null,
}) {
  const total = fotos.length;
  const foto  = fotos[currentIndex];

  const handlePrev = useCallback(() => {
    onChangeIndex((currentIndex - 1 + total) % total);
  }, [currentIndex, total, onChangeIndex]);

  const handleNext = useCallback(() => {
    onChangeIndex((currentIndex + 1) % total);
  }, [currentIndex, total, onChangeIndex]);

  useEffect(() => {
    if (isOpen) document.body.setAttribute("data-foto-viewer-open", "true");
    return () => document.body.removeAttribute("data-foto-viewer-open");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft"  && total > 1) handlePrev();
      if (e.key === "ArrowRight" && total > 1) handleNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, handlePrev, handleNext, onClose, total]);

  if (!isOpen || !foto) return null;

  // ── Datos de la novedad para el header ──────────────────────────────────
  const titulo = novedad
    ? buildTitulo(novedad.novedadTipoNovedad?.nombre, novedad.novedadSubtipoNovedad?.nombre)
    : null;

  const direccion = novedad
    ? (novedad.localizacion && novedad.referencia_ubicacion
        ? `${novedad.localizacion} (${novedad.referencia_ubicacion})`
        : novedad.localizacion || novedad.referencia_ubicacion || null)
    : null;

  const fechaOcurrencia = novedad?.fecha_hora_ocurrencia
    ? formatForDisplay(novedad.fecha_hora_ocurrencia)
    : null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-5xl max-h-[90vh] w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header novedad (fijo, no cambia al navegar fotos) ── */}
        {novedad && (
          <div className="w-full mb-2 px-1">
            <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
              {/* Código + título */}
              <div className="flex items-start gap-2 flex-wrap">
                <span className="font-mono text-xs text-white/60 flex-shrink-0 mt-0.5">
                  #{novedad.novedad_code}
                </span>
                {titulo && (
                  <span className="text-white font-semibold text-sm leading-tight">
                    {titulo}
                  </span>
                )}
              </div>
              {/* Dirección + Fecha de ocurrencia */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                {direccion && (
                  <span className="flex items-center gap-1 text-amber-300 text-xs font-medium">
                    <MapPin size={11} className="flex-shrink-0" />
                    {direccion}
                  </span>
                )}
                {fechaOcurrencia && (
                  <span className="flex items-center gap-1 text-white/60 text-xs">
                    <Calendar size={11} className="flex-shrink-0" />
                    {fechaOcurrencia}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Barra superior: nombre foto · contador · descarga · cerrar ── */}
        <div className="flex items-center justify-between w-full px-2 pb-2">
          <span className="text-white/70 text-sm font-medium truncate max-w-[60%]">
            {foto.nombre ?? `Foto ${currentIndex + 1}`}
          </span>
          <div className="flex items-center gap-3">
            {total > 1 && (
              <span className="text-white/60 text-sm">
                {currentIndex + 1} / {total}
              </span>
            )}
            {puedeDescargar && (
              <a
                href={foto.url}
                download={foto.nombre ?? `foto_${currentIndex + 1}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
                title="Descargar foto"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={18} />
              </a>
            )}
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
              title="Cerrar (Esc)"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* ── Imagen ── */}
        <div className="relative flex items-center justify-center w-full">
          {total > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-0 z-10 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
              title="Anterior (←)"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          <img
            key={foto.url}
            src={foto.url}
            alt={foto.nombre ?? `Foto ${currentIndex + 1}`}
            className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23374151'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239CA3AF' font-size='14'%3EImagen no disponible%3C/text%3E%3C/svg%3E";
            }}
          />

          {total > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-0 z-10 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
              title="Siguiente (→)"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>

        {/* ── Miniaturas ── */}
        {total > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {fotos.map((f, i) => (
              <button
                key={i}
                onClick={() => onChangeIndex(i)}
                className={`flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-colors ${
                  i === currentIndex
                    ? "border-blue-400"
                    : "border-transparent hover:border-white/50"
                }`}
              >
                <img
                  src={f.url}
                  alt={f.nombre ?? `Foto ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
