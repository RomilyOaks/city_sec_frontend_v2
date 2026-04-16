/**
 * File: src/forms/AbastecimientoSchema.js
 * @version 1.0.0
 * @description Esquema de validación Zod para abastecimientos
 *
 * @module src/forms/AbastecimientoSchema.js
 */

import { z } from "zod";

/**
 * Esquema de validación para abastecimientos de combustible
 */
export const abastecimientoSchema = z.object({
  vehiculo_id: z
    .number({
      required_error: "El vehículo es requerido",
      invalid_type_error: "El ID del vehículo debe ser un número"
    })
    .positive("El ID del vehículo debe ser positivo"),
    
  fecha_hora: z
    .string({
      required_error: "La fecha y hora son requeridas"
    })
    .min(1, "La fecha es requerida")
    .refine((val) => {
      // Validar formato de fecha YYYY-MM-DD HH:MM
      const fechaRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
      return fechaRegex.test(val);
    }, {
      message: "Formato de fecha inválido. Use: AAAA-MM-DD HH:MM"
    }),
    
  tipo_combustible: z
    .string({
      required_error: "El tipo de combustible es requerido"
    })
    .min(1, "El tipo de combustible es requerido"),
    
  km_actual: z
    .number({
      required_error: "El kilometraje actual es requerido",
      invalid_type_error: "El kilometraje debe ser un número"
    })
    .min(0, "El kilometraje debe ser mayor o igual a 0"),
    
  cantidad: z
    .number({
      required_error: "La cantidad es requerida",
      invalid_type_error: "La cantidad debe ser un número"
    })
    .positive("La cantidad debe ser mayor a 0")
    .max(1000, "La cantidad no puede exceder 1000 litros"),
    
  precio_unitario: z
    .number({
      required_error: "El precio unitario es requerido",
      invalid_type_error: "El precio unitario debe ser un número"
    })
    .positive("El precio unitario debe ser mayor a 0")
    .max(100, "El precio unitario no puede exceder S/ 100"),
    
  grifo_nombre: z
    .string({
      required_error: "El nombre del grifo es requerido"
    })
    .min(1, "El nombre del grifo es requerido")
    .max(100, "El nombre del grifo no puede exceder 100 caracteres"),
    
  grifo_ruc: z
    .string()
    .max(11, "El RUC del grifo no puede exceder 11 dígitos")
    .regex(/^\d{11}$/, "El RUC debe contener solo dígitos")
    .optional(),
    
  factura_boleta: z
    .string()
    .max(20, "El número de factura/boleta no puede exceder 20 caracteres")
    .optional(),
    
  observaciones: z
    .string()
    .max(500, "Las observaciones no pueden exceder 500 caracteres")
    .optional()
});

/**
 * Esquema para filtros de búsqueda
 */
export const abastecimientoFiltersSchema = z.object({
  vehiculo_id: z.number().positive().optional(),
  personal_id: z.number().positive().optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  page: z.number().positive().optional(),
  limit: z.number().positive().max(100).optional()
});

/**
 * Esquema para actualización parcial (campos opcionales)
 */
export const abastecimientoUpdateSchema = z.object({
  km_actual: z.number().min(0).optional(),
  cantidad: z.number().positive().max(1000).optional(),
  precio_unitario: z.number().positive().max(100).optional(),
  grifo_nombre: z.string().min(1).max(100).optional(),
  grifo_ruc: z.string().max(11).regex(/^\d{11}$/).optional(),
  factura_boleta: z.string().max(20).optional(),
  observaciones: z.string().max(500).optional()
});

export default abastecimientoSchema;
