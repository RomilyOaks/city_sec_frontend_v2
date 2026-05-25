import { useState, useCallback, useEffect, useRef } from "react";
import { MapPin, Search, X, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";
import { getUbigeos } from "../../services/ubigeoService.js";

const CATEGORIA_COLORS = {
  departamento: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  provincia: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  distrito: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

export default function UbigeoPage() {
  const [ubigeos, setUbigeos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef(null);

  const buscar = useCallback(async (termino) => {
    if (!termino.trim() || termino.trim().length < 2) {
      setUbigeos([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await getUbigeos({ search: termino.trim(), limit: 100 });
      const items = res.data?.data;
      setUbigeos(Array.isArray(items) ? items : []);
    } catch {
      toast.error("Error al buscar ubigeo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => buscar(search), 350);
    return () => clearTimeout(debounceRef.current);
  }, [search, buscar]);

  const limpiar = () => {
    setSearch("");
    setUbigeos([]);
    setHasSearched(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <MapPin className="text-primary-700 dark:text-primary-400" size={22} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Ubigeo
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Consulta de departamentos, provincias y distritos del Perú
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="relative max-w-lg">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            autoFocus
            placeholder="Buscar por departamento, provincia, distrito o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {loading && (
            <RefreshCw
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
            />
          )}
          {!loading && search && (
            <button
              onClick={limpiar}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
          Escribe al menos 2 caracteres para buscar
        </p>
      </div>

      {/* Resultados */}
      {hasSearched && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500 dark:text-gray-400">
              Buscando...
            </div>
          ) : ubigeos.length === 0 ? (
            <div className="p-10 text-center text-gray-500 dark:text-gray-400">
              No se encontraron resultados para "{search}"
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                {ubigeos.length} resultado{ubigeos.length !== 1 ? "s" : ""}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">Código</th>
                      <th className="px-4 py-3 text-left">Departamento</th>
                      <th className="px-4 py-3 text-left">Provincia</th>
                      <th className="px-4 py-3 text-left">Distrito</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {ubigeos.map((u) => (
                      <tr
                        key={u.ubigeo_code}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                          {u.ubigeo_code}
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {u.departamento}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {u.provincia}
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {u.distrito}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Estado inicial */}
      {!hasSearched && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-600">
          <MapPin size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Ingresa un término para buscar en los 1,875 registros de ubigeo</p>
        </div>
      )}
    </div>
  );
}
