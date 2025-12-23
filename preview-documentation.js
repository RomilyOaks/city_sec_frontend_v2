#!/usr/bin/env node

/**
 * Script de VISTA PREVIA - Documentación CitySecure Frontend
 *
 * Este script muestra qué archivos serían documentados SIN modificar nada.
 * Útil para revisar antes de ejecutar la documentación real.
 *
 * Uso: node preview-documentation.js
 *
 * @author Generado para Romily - CitySecure Project
 * @version 1.0.0
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = process.cwd();
const SRC_PATH = path.join(PROJECT_ROOT, "src");

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

const FILE_EXTENSIONS = [".js", ".jsx"];

const stats = {
  filesScanned: 0,
  filesToModify: 0,
  componentsToDocument: [],
  servicesToDocument: [],
  storesToDocument: [],
  othersToDocument: [],
};

const PATTERNS = {
  reactComponent:
    /(?:export\s+(?:default\s+)?)?(?:function|const)\s+([A-Z][a-zA-Z0-9]*)\s*=?\s*(?:\([^)]*\))?\s*(?:=>)?\s*{/,
  serviceFunction:
    /export\s+(?:async\s+)?(?:function|const)\s+([a-z][a-zA-Z0-9]*)\s*(?:=\s*(?:async\s*)?)?\([^)]*\)\s*(?:=>)?\s*{/,
  zustandStore: /export\s+const\s+(use[A-Z][a-zA-Z0-9]*Store)\s*=\s*create/,
};

function hasDocumentation(content, functionName) {
  const regex = new RegExp(
    `/\\*\\*[\\s\\S]*?\\*/\\s*(?:export\\s+)?(?:const|function|class)\\s+${functionName}`,
    "g"
  );
  return regex.test(content);
}

async function previewFile(filePath) {
  try {
    stats.filesScanned++;

    let content = fs.readFileSync(filePath, "utf8");
    const relativePath = path.relative(PROJECT_ROOT, filePath);

    if (!content.includes("import") && !content.includes("export")) {
      return;
    }

    let foundItems = [];
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const componentMatch = line.match(PATTERNS.reactComponent);
      if (componentMatch && !hasDocumentation(content, componentMatch[1])) {
        foundItems.push({ type: "component", name: componentMatch[1] });
      }

      const serviceMatch = line.match(PATTERNS.serviceFunction);
      if (
        serviceMatch &&
        filePath.includes("/services/") &&
        !hasDocumentation(content, serviceMatch[1])
      ) {
        foundItems.push({ type: "service", name: serviceMatch[1] });
      }

      const storeMatch = line.match(PATTERNS.zustandStore);
      if (storeMatch && !hasDocumentation(content, storeMatch[1])) {
        foundItems.push({ type: "store", name: storeMatch[1] });
      }
    }

    if (foundItems.length > 0) {
      stats.filesToModify++;

      foundItems.forEach((item) => {
        const entry = {
          file: relativePath,
          name: item.name,
        };

        if (item.type === "component") {
          stats.componentsToDocument.push(entry);
        } else if (item.type === "service") {
          stats.servicesToDocument.push(entry);
        } else if (item.type === "store") {
          stats.storesToDocument.push(entry);
        } else {
          stats.othersToDocument.push(entry);
        }
      });
    }
  } catch (error) {
    console.error(`❌ Error: ${filePath}`);
  }
}

async function scanDirectory(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (FILE_EXTENSIONS.includes(ext)) {
          await previewFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error escaneando: ${dir}`);
  }
}

function generatePreviewReport() {
  console.log("\n" + "=".repeat(70));
  console.log("👁️  VISTA PREVIA - DOCUMENTACIÓN CITYSECURE FRONTEND");
  console.log("=".repeat(70));

  console.log(`\n📊 RESUMEN:`);
  console.log(`   📁 Archivos escaneados: ${stats.filesScanned}`);
  console.log(`   📝 Archivos que serían modificados: ${stats.filesToModify}`);
  console.log(
    `   🎨 Componentes a documentar: ${stats.componentsToDocument.length}`
  );
  console.log(
    `   ⚙️  Servicios a documentar: ${stats.servicesToDocument.length}`
  );
  console.log(`   📦 Stores a documentar: ${stats.storesToDocument.length}`);

  if (stats.componentsToDocument.length > 0) {
    console.log(`\n🎨 COMPONENTES SIN DOCUMENTAR:`);
    stats.componentsToDocument.forEach((item) => {
      console.log(`   ✓ ${item.name} - ${item.file}`);
    });
  }

  if (stats.servicesToDocument.length > 0) {
    console.log(`\n⚙️  SERVICIOS SIN DOCUMENTAR:`);
    stats.servicesToDocument.forEach((item) => {
      console.log(`   ✓ ${item.name} - ${item.file}`);
    });
  }

  if (stats.storesToDocument.length > 0) {
    console.log(`\n📦 STORES SIN DOCUMENTAR:`);
    stats.storesToDocument.forEach((item) => {
      console.log(`   ✓ ${item.name} - ${item.file}`);
    });
  }

  console.log("\n" + "=".repeat(70));

  if (stats.filesToModify > 0) {
    console.log(
      "✅ Para documentar estos archivos, ejecuta: node auto-document.js"
    );
  } else {
    console.log("✨ ¡Todos los archivos ya están documentados!");
  }

  console.log("=".repeat(70) + "\n");
}

async function main() {
  console.log("\n🔍 Analizando proyecto (sin modificar archivos)...\n");

  if (!fs.existsSync(SRC_PATH)) {
    console.error("❌ Error: No se encuentra el directorio src/");
    process.exit(1);
  }

  for (const dir of DIRECTORIES_TO_SCAN) {
    const fullPath = path.join(SRC_PATH, dir);
    if (fs.existsSync(fullPath)) {
      await scanDirectory(fullPath);
    }
  }

  generatePreviewReport();
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
