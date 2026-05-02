/**
 * 📊 Componente Tabla Operativos - Reportes Operativos v2.0
 * 
 * Tabla genérica reutilizable para mostrar operativos con
 * paginación, ordenamiento y responsive design
 * 
 * @version 2.0.0
 * @author CitySec Frontend Team
 */

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowUp, 
  ArrowDown,
  ChevronUp,
  ChevronDown,
  SkipBack,
  SkipForward
} from 'lucide-react';

const TablaOperativos = ({ 
  data, 
  columns, 
  loading, 
  pagination, 
  onPageChange, 
  onSort,
  currentSort,
  currentOrder 
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [keyCounter, setKeyCounter] = useState(0);

  /**
   * 🔢 Calcular páginas a mostrar
   */
  const getVisiblePages = () => {
    const { page, totalPages } = pagination;
    const delta = 2; // páginas antes y después de la actual
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  /**
   * 🔄 Manejar ordenamiento
   */
  const handleSort = (column) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  /**
   * 📄 Cambiar de página
   */
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && onPageChange) {
      onPageChange(newPage);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300"
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && (
                        <div className="w-4 h-4 opacity-50">
                          <ChevronUp className="w-3 h-3" />
                          <ChevronDown className="w-3 h-3 -mt-1" />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, index) => (
                <tr key={index} className="border-b border-slate-100 dark:border-slate-800">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 ${
                    column.sortable ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        {currentSort === column.key ? (
                          currentOrder === 'ASC' ? (
                            <ArrowUp className="w-3 h-3 text-primary-600" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-primary-600" />
                          )
                        ) : (
                          <div className="w-4 h-4 flex flex-col opacity-30">
                            <ChevronUp className="w-3 h-3" />
                            <ChevronDown className="w-3 h-3 -mt-1" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="text-slate-500 dark:text-slate-400">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-lg font-medium mb-2">No se encontraron operativos</p>
                    <p className="text-sm">
                      No hay operativos vehiculares que coincidan con los filtros seleccionados.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={`row-${row.id || 'no-id'}-${index}-${crypto.randomUUID()}`}
                  className={`border-b border-slate-100 dark:border-slate-800 transition-colors ${
                    hoveredRow === index ? 'bg-slate-50 dark:bg-slate-900/50' : ''
                  }`}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-sm text-slate-900 dark:text-slate-50"
                    >
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Información de paginación */}
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Mostrando{' '}
              <span className="font-medium text-slate-900 dark:text-slate-50">
                {((pagination.page - 1) * pagination.limit) + 1}
              </span>
              {' '}a{' '}
              <span className="font-medium text-slate-900 dark:text-slate-50">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>
              {' '}de{' '}
              <span className="font-medium text-slate-900 dark:text-slate-50">
                {pagination.total.toLocaleString('es-PE')}
              </span>
              {' '}resultados
            </div>

            {/* Controles de paginación */}
            <div className="flex items-center gap-1">
              {/* Primera página */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Primera página"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Página anterior */}
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Números de página */}
              <div className="flex items-center gap-1">
                {getVisiblePages().map((page, index) => (
                  <div key={`${page}-${index}`}>
                    {page === '...' ? (
                      <span className="px-2 py-1 text-slate-500">...</span>
                    ) : (
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === page
                            ? 'bg-primary-600 text-white'
                            : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Página siguiente */}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Última página */}
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Última página"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaOperativos;
