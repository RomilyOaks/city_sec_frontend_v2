#!/usr/bin/env node

/* global process */

/**
 * Script de Documentación Automática para CitySecure Frontend
 *
 * Este script analiza el proyecto React y agrega documentación JSDoc
 * automáticamente a componentes, servicios, stores y configuraciones.
 *
 * Uso: node auto-document.js
 *
 * @author Generado para Romily - CitySecure Project
 * @version 1.0.0
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// * CONFIGURACIÓN: Rutas del proyecto
const PROJECT_ROOT = process.cwd();
const SRC_PATH = path.join(PROJECT_ROOT, "src");

// * CONFIGURACIÓN: Directorios a analizar
const DIRECTORIES_TO_SCAN = [
  "components",
  "pages",
  "services",
  "store",
  "layouts",
  "routes",
  "config",
  "rbac",
];

// * CONFIGURACIÓN: Extensiones de archivo a procesar
const FILE_EXTENSIONS = [".js", ".jsx"];

// ! IMPORTANTE: Patrones para identificar diferentes tipos de código
const PATTERNS = {
  // Componentes React
  reactComponent:
    /(?:export\s+(?:default\s+)?)?(?:function|const)\s+([A-Z][a-zA-Z0-9]*)\s*=?\s*(?:\([^)]*\))?\s*(?:=>)?\s*{/,

  // Funciones de servicio (ambos estilos: const y function)
  serviceFunction:
    /export\s+(?:async\s+)?(?:function|const)\s+([a-z][a-zA-Z0-9]*)\s*(?:=\s*(?:async\s*)?)?\([^)]*\)\s*(?:=>)?\s*{/,

  // Stores Zustand
  zustandStore: /export\s+const\s+(use[A-Z][a-zA-Z0-9]*Store)\s*=\s*create/,

  // Funciones exportadas
  exportedFunction: /export\s+(?:const|function)\s+([a-z][a-zA-Z0-9]*)/,

  // Ya tiene JSDoc
  hasJSDoc: /\/\*\*[\s\S]*?\*\/\s*(?:export|const|function|class)/,
};

// * ESTADÍSTICAS: Contador de documentación generada
const stats = {
  filesScanned: 0,
  filesModified: 0,
  componentsDocumented: 0,
  functionsDocumented: 0,
  storesDocumented: 0,
  errors: [],
};

/**
 * Genera documentación JSDoc para componentes React
 *
 * @param {string} componentName - Nombre del componente
 * @param {string} filePath - Ruta del archivo
 * @returns {string} - Bloque JSDoc generado
 */
function generateComponentDoc(componentName, filePath) {
  const _fileName = path.basename(filePath);
  const category = getFileCategory(filePath);

  return `/**
 * * COMPONENTE: ${componentName}
 * 
 * @component
 * @category ${category}
 * @description Componente de CitySecure para ${getComponentDescription(
   componentName,
   category
 )}
 * 
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Elemento React renderizado
 * 
 * @example
 * <${componentName} />
 * 
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */
`;
}

/**
 * Genera documentación JSDoc para funciones de servicio
 *
 * @param {string} functionName - Nombre de la función
 * @param {string} filePath - Ruta del archivo
 * @returns {string} - Bloque JSDoc generado
 */
function generateServiceDoc(functionName, filePath) {
  const fileName = path.basename(filePath, ".js");

  return `/**
 * * SERVICIO: ${functionName}
 * 
 * @async
 * @function
 * @description Servicio API de CitySecure - ${fileName}
 * 
 * @param {Object} params - Parámetros de la petición
 * @returns {Promise<Object>} Respuesta de la API
 * @throws {Error} Error en la petición HTTP
 * 
 * ! IMPORTANTE: Requiere autenticación JWT
 * TODO: Documentar parámetros específicos
 * TODO: Documentar estructura de respuesta
 */
`;
}

/**
 * Genera documentación JSDoc para stores de Zustand
 *
 * @param {string} storeName - Nombre del store
 * @param {string} filePath - Ruta del archivo
 * @returns {string} - Bloque JSDoc generado
 */
function generateStoreDoc(storeName, filePath) {
  const fileName = path.basename(filePath, ".js");

  return `/**
 * * STORE ZUSTAND: ${storeName}
 * 
 * @module ${fileName}
 * @description Store de estado global para ${getStoreDescription(storeName)}
 * 
 * @property {Object} state - Estado del store
 * @property {Function} actions - Acciones para modificar el estado
 * 
 * ! NO modificar el estado directamente - usar las acciones provistas
 * TODO: Documentar propiedades específicas del estado
 * TODO: Documentar todas las acciones disponibles
 * 
 * @example
 * const { state, action } = ${storeName}();
 */
`;
}

/**
 * Genera documentación para archivos de configuración
 *
 * @param {string} filePath - Ruta del archivo
 * @returns {string} - Bloque JSDoc generado
 */
function generateConfigDoc(filePath) {
  const fileName = path.basename(filePath, ".js");

  return `/**
 * * CONFIGURACIÓN: ${fileName}
 * 
 * @module config/${fileName}
 * @description Archivo de configuración de CitySecure
 * 
 * ! IMPORTANTE: No commitear valores sensibles
 * TODO: Validar todas las variables de entorno requeridas
 */
`;
}

/**
 * Obtiene la categoría del archivo basado en su ruta
 *
 * @param {string} filePath - Ruta del archivo
 * @returns {string} - Categoría del archivo
 */
function getFileCategory(filePath) {
  if (filePath.includes("/components/common/")) return "Common Components";
  if (filePath.includes("/components/")) return "Components";
  if (filePath.includes("/pages/auth/")) return "Authentication Pages";
  if (filePath.includes("/pages/admin/")) return "Admin Pages";
  if (filePath.includes("/pages/")) return "Pages";
  if (filePath.includes("/services/")) return "API Services";
  if (filePath.includes("/store/")) return "State Management";
  if (filePath.includes("/layouts/")) return "Layouts";
  if (filePath.includes("/routes/")) return "Routing";
  if (filePath.includes("/config/")) return "Configuration";
  if (filePath.includes("/rbac/")) return "RBAC";
  return "General";
}

/**
 * Genera descripción contextual para componentes
 *
 * @param {string} componentName - Nombre del componente
 * @param {string} category - Categoría del componente
 * @returns {string} - Descripción generada
 */
function getComponentDescription(componentName, category) {
  const descriptions = {
    LoginPage: "autenticación de usuarios del sistema",
    SignupPage: "registro de nuevos usuarios",
    DashboardPage: "visualización del dashboard principal",
    PersonalPage: "gestión de personal de seguridad",
    VehiculosPage: "gestión de vehículos",
    NovedadesPage: "gestión de incidentes y novedades",
    AdminUsuariosPage: "administración de usuarios",
    RolesPermisosPage: "gestión de roles y permisos",
    ThemeToggle: "cambio de tema claro/oscuro",
    ThemeApplier: "aplicación del tema global",
    MapaIncidentes: "visualización de incidentes en mapa",
    AppShell: "estructura principal de la aplicación",
    ProtectedRoute: "protección de rutas según permisos",
  };

  return descriptions[componentName] || `${category.toLowerCase()}`;
}

/**
 * Genera descripción contextual para stores
 *
 * @param {string} storeName - Nombre del store
 * @returns {string} - Descripción generada
 */
function getStoreDescription(storeName) {
  const descriptions = {
    useAuthStore: "gestión de autenticación y sesión de usuario",
    useThemeStore: "gestión del tema visual de la aplicación",
  };

  return descriptions[storeName] || "gestión de estado";
}

/**
 * Verifica si el archivo ya tiene documentación JSDoc
 *
 * @param {string} content - Contenido del archivo
 * @param {string} functionName - Nombre de la función/componente
 * @returns {boolean} - True si ya tiene documentación
 */
function hasDocumentation(content, functionName) {
  // Buscar JSDoc antes de la declaración
  const regex = new RegExp(
    `/\\*\\*[\\s\\S]*?\\*/\\s*(?:export\\s+)?(?:const|function|class)\\s+${functionName}`,
    "g"
  );
  return regex.test(content);
}

/**
 * Procesa un archivo y agrega documentación donde sea necesario
 *
 * @param {string} filePath - Ruta del archivo a procesar
 * @returns {Promise<boolean>} - True si el archivo fue modificado
 */
async function processFile(filePath) {
  try {
    stats.filesScanned++;

    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;
    const lines = content.split("\n");
    const newLines = [];

    // ? ¿El archivo tiene al menos un import o export?
    if (!content.includes("import") && !content.includes("export")) {
      return false;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // * Detectar componentes React
      const componentMatch = line.match(PATTERNS.reactComponent);
      if (componentMatch && !hasDocumentation(content, componentMatch[1])) {
        newLines.push(generateComponentDoc(componentMatch[1], filePath));
        stats.componentsDocumented++;
        modified = true;
      }

      // * Detectar funciones de servicio
      const serviceMatch = line.match(PATTERNS.serviceFunction);
      if (
        serviceMatch &&
        filePath.includes("/services/") &&
        !hasDocumentation(content, serviceMatch[1])
      ) {
        newLines.push(generateServiceDoc(serviceMatch[1], filePath));
        stats.functionsDocumented++;
        modified = true;
      }

      // * Detectar stores Zustand
      const storeMatch = line.match(PATTERNS.zustandStore);
      if (storeMatch && !hasDocumentation(content, storeMatch[1])) {
        newLines.push(generateStoreDoc(storeMatch[1], filePath));
        stats.storesDocumented++;
        modified = true;
      }

      newLines.push(line);
    }

    // * Si hubo modificaciones, escribir el archivo
    if (modified) {
      // Agregar header si es archivo de configuración sin documentación
      if (filePath.includes("/config/") && !content.startsWith("/**")) {
        newLines.unshift(generateConfigDoc(filePath));
      }

      fs.writeFileSync(filePath, newLines.join("\n"), "utf8");
      stats.filesModified++;
      console.log(`✅ Documentado: ${path.relative(PROJECT_ROOT, filePath)}`);
      return true;
    }

    return false;
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`❌ Error procesando ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Recorre recursivamente un directorio y procesa archivos
 *
 * @param {string} dir - Directorio a escanear
 * @returns {Promise<void>}
 */
async function scanDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const safeName = path.basename(entry.name);
      const fullPath = path.join(dir, safeName);

      if (entry.isDirectory()) {
        // Recursión en subdirectorios
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);

        // Procesar solo archivos JS/JSX
        if (FILE_EXTENSIONS.includes(ext)) {
          await processFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error escaneando directorio ${dir}: ${error.message}`);
  }
}

/**
 * Genera reporte final de documentación
 *
 * @returns {void}
 */
function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("📊 REPORTE DE DOCUMENTACIÓN - CITYSECURE FRONTEND");
  console.log("=".repeat(60));
  console.log(`\n📁 Archivos escaneados: ${stats.filesScanned}`);
  console.log(`✏️  Archivos modificados: ${stats.filesModified}`);
  console.log(`🎨 Componentes documentados: ${stats.componentsDocumented}`);
  console.log(`⚙️  Funciones documentadas: ${stats.functionsDocumented}`);
  console.log(`📦 Stores documentados: ${stats.storesDocumented}`);

  if (stats.errors.length > 0) {
    console.log(`\n❌ Errores encontrados: ${stats.errors.length}`);
    stats.errors.forEach((err) => {
      console.log(
        `   - ${path.relative(PROJECT_ROOT, err.file)}: ${err.error}`
      );
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ Documentación completada!");
  console.log("=".repeat(60) + "\n");

  // Guardar reporte en archivo
  const reportPath = path.join(PROJECT_ROOT, "documentation-report.txt");
  const reportContent = `
REPORTE DE DOCUMENTACIÓN AUTOMÁTICA
Proyecto: CitySecure Frontend
Fecha: ${new Date().toLocaleString("es-PE")}

ESTADÍSTICAS:
- Archivos escaneados: ${stats.filesScanned}
- Archivos modificados: ${stats.filesModified}
- Componentes documentados: ${stats.componentsDocumented}
- Funciones documentadas: ${stats.functionsDocumented}
- Stores documentados: ${stats.storesDocumented}
- Errores: ${stats.errors.length}

${
  stats.errors.length > 0
    ? "ERRORES:\n" +
      stats.errors.map((e) => `- ${e.file}: ${e.error}`).join("\n")
    : ""
}
`;

  fs.writeFileSync(reportPath, reportContent, "utf8");
  console.log(`📄 Reporte guardado en: ${reportPath}\n`);
}

/**
 * * FUNCIÓN PRINCIPAL: Ejecuta el proceso de documentación
 *
 * @async
 * @returns {Promise<void>}
 */
async function main() {
  console.log(
    "\n🚀 Iniciando documentación automática de CitySecure Frontend...\n"
  );

  // ! Verificar que estamos en el directorio correcto
  if (!fs.existsSync(SRC_PATH)) {
    console.error("❌ Error: No se encuentra el directorio src/");
    console.error(
      "   Asegúrate de ejecutar este script desde la raíz del proyecto."
    );
    process.exit(1);
  }

  // * Escanear cada directorio configurado
  for (const dir of DIRECTORIES_TO_SCAN) {
    const fullPath = path.join(SRC_PATH, dir);

    if (fs.existsSync(fullPath)) {
      console.log(`\n📂 Escaneando: src/${dir}/`);
      await scanDirectory(fullPath);
    } else {
      console.log(`⚠️  Directorio no encontrado: src/${dir}/`);
    }
  }

  // * Generar reporte final
  generateReport();
}

// * EJECUCIÓN: Iniciar el proceso
main().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});
