import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Building2, Check } from "lucide-react";
import { ConfirmModal } from "../../common";
import {
  useDatosFacturacion,
  useUpdateDatosFacturacion,
  usePlanes,
  useSuscripcion,
  useCambiarPlan,
} from "../../../hooks/useBilling.js";
import { extractValidationErrors } from "../../../utils/errorUtils.js";

const datosFacturacionSchema = z.object({
  razon_social: z.string().min(1, "La razón social es requerida").max(200),
  ruc: z.string().regex(/^\d{11}$/, "El RUC debe tener 11 dígitos"),
  direccion_fiscal: z.string().min(1, "La dirección fiscal es requerida").max(255),
  email_facturacion: z.string().email("Email inválido"),
  representante_legal: z.string().min(1, "El representante legal es requerido").max(150),
  cargo_representante: z.string().min(1, "El cargo es requerido").max(100),
});

const formatMonto = (m, moneda = "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(m ?? 0);

export default function ConfigBillingTab() {
  const { data: datosData, isLoading: loadingDatos } = useDatosFacturacion();
  const updateDatosMutation = useUpdateDatosFacturacion();

  const { data: planesData, isLoading: loadingPlanes } = usePlanes();
  const { data: suscripcionData } = useSuscripcion();
  const cambiarPlanMutation = useCambiarPlan();

  const [confirmPlan, setConfirmPlan] = useState({ isOpen: false, plan: null, loading: false });

  const datos = datosData;
  const planes = planesData ?? [];
  const planActualId = suscripcionData?.plan?.id;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(datosFacturacionSchema),
    values: datos
      ? {
          razon_social: datos.razon_social ?? "",
          ruc: datos.ruc ?? "",
          direccion_fiscal: datos.direccion_fiscal ?? "",
          email_facturacion: datos.email_facturacion ?? "",
          representante_legal: datos.representante_legal ?? "",
          cargo_representante: datos.cargo_representante ?? "",
        }
      : undefined,
  });

  const onSubmit = async (formData) => {
    const toastId = toast.loading("Guardando...");
    try {
      await updateDatosMutation.mutateAsync(formData);
      toast.dismiss(toastId);
      toast.success("Datos de facturación actualizados");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(extractValidationErrors(err) || "Error al guardar los datos");
    }
  };

  const handleConfirmCambiarPlan = async () => {
    setConfirmPlan((s) => ({ ...s, loading: true }));
    try {
      await cambiarPlanMutation.mutateAsync({ plan_id: confirmPlan.plan.id });
      toast.success(`Plan cambiado a "${confirmPlan.plan.nombre}"`);
    } catch (err) {
      toast.error(extractValidationErrors(err) || "Error al cambiar el plan");
    } finally {
      setConfirmPlan({ isOpen: false, plan: null, loading: false });
    }
  };

  return (
    <div className="space-y-8">

      {/* Sección A: Datos de la municipalidad */}
      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white mb-4">
          <Building2 size={16} className="text-primary-700 dark:text-primary-400" />
          Datos de la municipalidad
        </h3>

        {loadingDatos ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Cargando datos...</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Campo label="Razón social" error={errors.razon_social}>
              <input
                type="text"
                {...register("razon_social")}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </Campo>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label="RUC" error={errors.ruc}>
                <input
                  type="text"
                  maxLength={11}
                  {...register("ruc")}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </Campo>

              <Campo label="Email de facturación" error={errors.email_facturacion}>
                <input
                  type="email"
                  {...register("email_facturacion")}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </Campo>
            </div>

            <Campo label="Dirección fiscal" error={errors.direccion_fiscal}>
              <input
                type="text"
                {...register("direccion_fiscal")}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </Campo>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo label="Representante legal" error={errors.representante_legal}>
                <input
                  type="text"
                  {...register("representante_legal")}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </Campo>

              <Campo label="Cargo del representante" error={errors.cargo_representante}>
                <input
                  type="text"
                  {...register("cargo_representante")}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </Campo>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 rounded-md disabled:opacity-60 transition"
              >
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Sección B: Plan de suscripción */}
      <section>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Plan de suscripción
        </h3>

        {loadingPlanes ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Cargando planes...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {planes.map((plan) => {
              const esActual = plan.id === planActualId;
              return (
                <div
                  key={plan.id}
                  className={`rounded-lg border p-4 flex flex-col ${
                    esActual
                      ? "border-primary-500 ring-1 ring-primary-500 bg-primary-50 dark:bg-primary-900/10"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  }`}
                >
                  <h4 className="text-sm font-bold uppercase text-gray-900 dark:text-white">
                    {plan.nombre}
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                    {formatMonto(plan.precio_base_mensual, plan.moneda)}
                    <span className="text-xs font-normal text-gray-500 dark:text-gray-400">/mes</span>
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-gray-600 dark:text-gray-400 flex-1">
                    <li>{plan.max_usuarios == null ? "Usuarios ilimitados" : `${plan.max_usuarios} usuarios`}</li>
                    <li>
                      {plan.max_novedades_mes == null
                        ? "Novedades ilimitadas"
                        : `${plan.max_novedades_mes.toLocaleString("es-PE")} novedades/mes`}
                    </li>
                  </ul>

                  {esActual ? (
                    <span className="mt-4 flex items-center justify-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
                      <Check size={14} /> ACTUAL
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirmPlan({ isOpen: true, plan, loading: false })}
                      className="mt-4 px-3 py-1.5 text-xs font-medium text-white bg-primary-700 hover:bg-primary-800 rounded-md transition"
                    >
                      Seleccionar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={confirmPlan.isOpen}
        title="Cambiar plan de suscripción"
        message={`¿Confirma el cambio al plan "${confirmPlan.plan?.nombre}"? El nuevo monto se aplicará desde el próximo ciclo de facturación.`}
        confirmText="Cambiar plan"
        type="warning"
        loading={confirmPlan.loading}
        onClose={() => setConfirmPlan({ isOpen: false, plan: null, loading: false })}
        onConfirm={handleConfirmCambiarPlan}
      />
    </div>
  );
}

function Campo({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error.message}</p>}
    </div>
  );
}
