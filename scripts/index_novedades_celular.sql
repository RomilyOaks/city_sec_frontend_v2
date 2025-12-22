-- Script para agregar índice de búsqueda por celular en novedades
-- Ejecutar en la base de datos railway

USE railway;

-- Índice para búsqueda por documento de identidad del reportante (ya existe según imagen)
-- CREATE INDEX idx_novedad_reportante_doc ON novedades_incidentes (reportante_doc_identidad);

-- Índice para búsqueda por teléfono/celular del reportante
CREATE INDEX idx_novedad_reportante_telefono ON novedades_incidentes (reportante_telefono);

-- Verificar índices creados
SHOW INDEX FROM novedades_incidentes;
