import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSuscripcion,
  getMetricasActual,
  getFacturas,
  registrarPago,
  getDatosFacturacion,
  updateDatosFacturacion,
  getPlanes,
  cambiarPlan,
} from "../services/billingService.js";

export const useSuscripcion = () =>
  useQuery({
    queryKey: ["billing", "suscripcion"],
    queryFn: getSuscripcion,
  });

export const useMetricasActual = () =>
  useQuery({
    queryKey: ["billing", "metricas", "actual"],
    queryFn: getMetricasActual,
  });

export const useFacturas = (filters = {}) =>
  useQuery({
    queryKey: ["billing", "facturas", filters],
    queryFn: () => getFacturas(filters),
  });

export const useDatosFacturacion = () =>
  useQuery({
    queryKey: ["billing", "datos-facturacion"],
    queryFn: getDatosFacturacion,
  });

export const usePlanes = () =>
  useQuery({
    queryKey: ["billing", "planes"],
    queryFn: getPlanes,
  });

export const useRegistrarPago = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => registrarPago(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "facturas"] });
      queryClient.invalidateQueries({ queryKey: ["billing", "suscripcion"] });
    },
  });
};

export const useUpdateDatosFacturacion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDatosFacturacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "datos-facturacion"] });
    },
  });
};

export const useCambiarPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cambiarPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing", "suscripcion"] });
    },
  });
};
