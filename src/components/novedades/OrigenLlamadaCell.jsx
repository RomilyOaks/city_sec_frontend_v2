import React, { useState } from 'react';

// Importar iconos necesarios
import {
  Phone,
  Radio,
  Share2,
  AlertTriangle,
  Home,
  BarChart3,
  Scale,
  Video,
} from 'lucide-react';

// Constante con configuración de orígenes
const ORIGEN_LLAMADA_CONFIG = [
  { 
    value: "TELEFONO_107", 
    label: "Llamada Telefónica (107)", 
    icon: Phone,
    color: "text-blue-600"
  },
  { 
    value: "RADIO_TETRA", 
    label: "Llamada Radio TETRA", 
    icon: Radio,
    color: "text-green-600"
  },
  { 
    value: "REDES_SOCIALES", 
    label: "Redes Sociales", 
    icon: Share2,
    color: "text-purple-600"
  },
  {
    value: "BOTON_EMERGENCIA_ALERTA_SURCO",
    label: "Botón Emergencia (App ALERTA SURCO)",
    icon: AlertTriangle,
    color: "text-red-600"
  },
  {
    value: "BOTON_DENUNCIA_VECINO_ALERTA",
    label: "Botón Denuncia (App VECINO ALERTA)",
    icon: Home,
    color: "text-orange-600"
  },
  { 
    value: "ANALITICA", 
    label: "Analítica", 
    icon: BarChart3,
    color: "text-indigo-600"
  },
  { 
    value: "APP_PODER_JUDICIAL", 
    label: "APP Poder Judicial", 
    icon: Scale,
    color: "text-gray-700"
  },
  { 
    value: "VIDEO_CCO", 
    label: "Video CCO", 
    icon: Video,
    color: "text-cyan-600"
  }
];

/**
 * Componente para mostrar el origen de llamada con icono, color y tooltip
 * @param {Object} props - Props del componente
 * @param {string} props.origen - Valor del origen de llamada
 * @param {boolean} props.showLabel - Si muestra el label además del icono
 * @param {string} props.size - Tamaño del icono ('sm', 'md', 'lg')
 * @param {string} props.className - Clases adicionales
 */
const OrigenLlamadaCell = ({ 
  origen, 
  showLabel = true, 
  size = 'sm',
  className = '' 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const origenConfig = ORIGEN_LLAMADA_CONFIG.find(opt => opt.value === origen);
  
  if (!origenConfig) {
    return (
      <span className={`text-gray-500 text-sm ${className}`}>
        No especificado
      </span>
    );
  }

  const Icon = origenConfig.icon;
  
  // Tamaños de icono
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative inline-block">
        <Icon 
          className={`${sizeClasses[size]} ${origenConfig.color} flex-shrink-0 cursor-help transition-transform hover:scale-110`} 
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        />
        
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
            <div className="font-medium">{origenConfig.label}</div>
            {/* Flecha del tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
      
      {showLabel && (
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
          {origenConfig.label}
        </span>
      )}
    </div>
  );
};

export default OrigenLlamadaCell;
