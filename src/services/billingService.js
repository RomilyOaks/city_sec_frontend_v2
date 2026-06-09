import api from "./api.js";

export const getSuscripcion = () =>
  api.get("/billing/suscripcion");

export const getMetricasActual = () =>
  api.get("/billing/metricas/actual");

export const getFacturas = (params) =>
  api.get("/billing/facturas", { params });

export const getFactura = (id) =>
  api.get(`/billing/facturas/${id}`);

export const registrarPago = (id, data) =>
  api.post(`/billing/facturas/${id}/pagar`, data);

export const getDatosFacturacion = () =>
  api.get("/billing/datos-facturacion");

export const updateDatosFacturacion = (data) =>
  api.put("/billing/datos-facturacion", data);

export const getPlanes = () =>
  api.get("/billing/planes");

export const cambiarPlan = (data) =>
  api.put("/billing/suscripcion/plan", data);
