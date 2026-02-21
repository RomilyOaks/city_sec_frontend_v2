import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, Lock } from "lucide-react";

import ThemeToggle from "../../components/common/ThemeToggle.jsx";
import { login as loginRequest, setRequiredPassword, getMe } from "../../services/authService.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { API_URL } from "../../config/constants.js";
import { APP_VERSION, APP_NAME } from "../../config/version.js";

/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\pages\\auth\\LoginPage.jsx
 * @version 2.0.0
 * @description Página de login para usuarios. Valida credenciales y maneja redirección post-login.
 * Documentación añadida y JSDoc consolidado sin cambiar la lógica.
 *
 * @module src/pages/auth/LoginPage.jsx
 */

const loginSchema = z.object({
  username_or_email: z.string().min(1, "Requerido"),
  password: z.string().min(1, "Requerido"),
});

const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme la contraseña"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

/**
 * LoginPage - Formulario de autenticación
 *
 * @component
 * @category Pages | Auth
 * @returns {JSX.Element}
 */

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const hidePasswordTimeoutRef = useRef(null);

  // Estado del flujo de cambio de contraseña obligatorio
  const [requireChangeData, setRequireChangeData] = useState(null); // { userId, currentPassword }
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { username_or_email: "", password: "" },
  });

  const {
    register: registerChange,
    handleSubmit: handleSubmitChange,
    reset: resetChange,
    watch: watchChange,
    formState: { errors: changeErrors, isSubmitting: isChanging },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    } else {
      if (hidePasswordTimeoutRef.current) {
        clearTimeout(hidePasswordTimeoutRef.current);
      }
      reset({ username_or_email: "", password: "" });
      setShowPassword(false);
    }

    return () => {
      if (hidePasswordTimeoutRef.current) {
        clearTimeout(hidePasswordTimeoutRef.current);
      }
    };
  }, [isAuthenticated, navigate, reset]);

  const handleTogglePassword = () => {
    const username = (getValues("username_or_email") || "").trim();
    if (!username) {
      toast.error("Primero debe ingresar el usuario");
      return;
    }

    const password = getValues("password") || "";
    if (!password) {
      toast.error("Primero debe ingresar la contraseña");
      return;
    }

    setShowPassword((prev) => {
      const next = !prev;
      if (hidePasswordTimeoutRef.current) {
        clearTimeout(hidePasswordTimeoutRef.current);
      }
      if (next) {
        hidePasswordTimeoutRef.current = setTimeout(() => {
          setShowPassword(false);
        }, 3000);
      }
      return next;
    });
  };

  const onSubmit = async (form) => {
    try {
      const { token, usuario, requirePasswordChange, userId } = await loginRequest(form);

      if (requirePasswordChange) {
        // Transicionar al formulario de cambio obligatorio de contraseña
        setRequireChangeData({ userId, currentPassword: form.password });
        resetChange();
        return;
      }

      if (!token) {
        throw new Error("No se recibió token desde el servidor");
      }
      
      // Establecer token primero
      setAuth(token, usuario || null);
      
      // Obtener datos completos del usuario incluyendo roles y permisos
      try {
        const completeUserData = await getMe();
        setAuth(token, completeUserData);
        
        // Mostrar mensaje de bienvenida con nombre completo
        const nombreCompleto = completeUserData?.nombres && completeUserData?.apellidos 
          ? `${completeUserData.nombres} ${completeUserData.apellidos}`
          : completeUserData?.username || 'Usuario';
        
        toast.success(`¡Bienvenido(a), ${nombreCompleto}!`);
      } catch (meError) {
        console.error('Error obteniendo datos completos del usuario:', meError);
        
        // Si falla getMe(), crear usuario con roles básicos para que pueda navegar
        const fallbackUser = {
          ...usuario,
          roles: [{ slug: 'consulta', name: 'Consulta' }],
          permisos: [
            'novedades.incidentes.read',
            'novedades.novedades.read',
            'catalogos.tipos_novedad.read',
            'catalogos.subtipos_novedad.read',
            'personal.personal.read',
            'auditoria.estadisticas.read',
            'calles.calles.read',
            'calles.calles_cuadrantes.read'
          ]
        };
        
                setAuth(token, fallbackUser);
        
        const nombreUsuario = usuario?.username || 'Usuario';
        toast.success(`¡Bienvenido(a), ${nombreUsuario}!`);
        
        if (meError?.response?.status === 500) {
          console.warn('⚠️ El endpoint /auth/me tiene problemas en el backend. Usando rol de consulta por defecto.');
        }
      }

      const from = location.state?.from;
      navigate(from || "/dashboard", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message;
      const isNetwork =
        !status && (err?.message === "Network Error" || err?.code);

      if (isNetwork) {
        toast.error(
          `No se pudo conectar a la API (${API_URL}). Revisa .env.local / CORS / URL.`
        );
      } else {
        toast.error(backendMsg || err?.message || "Error de autenticación");
      }
    }
  };

  const onSubmitChange = async (form) => {
    try {
      await setRequiredPassword({
        userId: requireChangeData.userId,
        currentPassword: requireChangeData.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Contraseña actualizada. Iniciando sesión…");

      // Auto-login con la nueva contraseña usando las credenciales del login form
      const loginValues = getValues();
      const { token, usuario, requirePasswordChange } = await loginRequest({
        username_or_email: loginValues.username_or_email,
        password: form.newPassword,
      });

      if (requirePasswordChange) {
        // Si sigue requiriendo cambio, algo salió mal
        throw new Error("La contraseña no cumple los requisitos");
      }

      if (!token) {
        throw new Error("No se recibió token después de cambiar contraseña");
      }

      // Establecer token primero
      setAuth(token, usuario || null);
      
      // Obtener datos completos del usuario incluyendo roles y permisos
      try {
        const completeUserData = await getMe();
        setAuth(token, completeUserData);
        
        // Mostrar mensaje de bienvenida con nombre completo
        const nombreCompleto = completeUserData?.nombres && completeUserData?.apellidos 
          ? `${completeUserData.nombres} ${completeUserData.apellidos}`
          : completeUserData?.username || 'Usuario';
        
        toast.success(`¡Bienvenido(a), ${nombreCompleto}!`);
      } catch (meError) {
        console.error('Error obteniendo datos completos del usuario:', meError);
        
        // Si falla getMe(), crear usuario con roles básicos para que pueda navegar
        const fallbackUser = {
          ...usuario,
          roles: [{ slug: 'consulta', name: 'Consulta' }],
          permisos: [
            'novedades.incidentes.read',
            'novedades.novedades.read',
            'catalogos.tipos_novedad.read',
            'catalogos.subtipos_novedad.read',
            'personal.personal.read',
            'auditoria.estadisticas.read',
            'calles.calles.read',
            'calles.calles_cuadrantes.read'
          ]
        };
        
                setAuth(token, fallbackUser);
        
        const nombreUsuario = usuario?.username || 'Usuario';
        toast.success(`¡Bienvenido(a), ${nombreUsuario}!`);
        
        if (meError?.response?.status === 500) {
          console.warn('⚠️ El endpoint /auth/me tiene problemas en el backend. Usando rol de consulta por defecto.');
        }
      }

      const from = location.state?.from;
      navigate(from || "/dashboard", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const backendMsg = err?.response?.data?.message;
      const isNetwork =
        !status && (err?.message === "Network Error" || err?.code);

      if (isNetwork) {
        toast.error(
          `No se pudo conectar a la API (${API_URL}). Revisa .env.local / CORS / URL.`
        );
      } else {
        toast.error(backendMsg || err?.message || "Error al cambiar contraseña");
      }
    }
  };

  const newPwValue = watchChange("newPassword") || "";
  const pwStrength = {
    hasMinLength: newPwValue.length >= 8,
    hasUppercase: /[A-Z]/.test(newPwValue),
    hasLowercase: /[a-z]/.test(newPwValue),
    hasNumber: /[0-9]/.test(newPwValue),
  };

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <svg
                className="w-6 h-6"
                viewBox="0 0 32 32"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient
                    id="shieldGradLogin"
                    x1="0%"
                    y1="0%"
                    x2="0%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      style={{ stopColor: "#4F7942", stopOpacity: 1 }}
                    />
                    <stop
                      offset="100%"
                      style={{ stopColor: "#2D4A22", stopOpacity: 1 }}
                    />
                  </linearGradient>
                </defs>
                <path
                  d="M16 2 L28 6 L28 14 C28 22 22 28 16 30 C10 28 4 22 4 14 L4 6 Z"
                  fill="url(#shieldGradLogin)"
                  stroke="#1a2e14"
                  strokeWidth="1"
                />
                <text
                  x="16"
                  y="20"
                  fontFamily="Arial, sans-serif"
                  fontSize="14"
                  fontWeight="bold"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  C
                </text>
              </svg>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
                {/* CitySecure */}
                Seguridad Ciudadana
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">
              Ingreso al sistema
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* ── Formulario de login normal ── */}
        {!requireChangeData && (
          <form
            className="mt-6 space-y-4"
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="off"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Usuario o Email
              </label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                placeholder="Ingrese usuario o email"
                autoComplete="off"
                {...register("username_or_email")}
              />
              {errors.username_or_email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.username_or_email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 pr-10 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingrese su contraseña"
                  autoComplete="new-password"
                  onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                  onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={handleTogglePassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  title={
                    showPassword ? "Ocultar (auto en 3s)" : "Mostrar (auto en 3s)"
                  }
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
              {capsLockOn && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span className="font-semibold">⚠ MAYÚSCULAS ACTIVADAS</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary-700 text-white py-2 font-medium hover:bg-primary-800 disabled:opacity-60"
            >
              {isSubmitting ? "Ingresando…" : "Ingresar"}
            </button>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500 dark:text-slate-300">
                ¿No tienes cuenta?
              </span>
              <Link
                to="/signup"
                className="text-primary-800 dark:text-primary-200 hover:underline"
              >
                Crear cuenta
              </Link>
            </div>
          </form>
        )}

        {/* ── Formulario de cambio de contraseña obligatorio ── */}
        {requireChangeData && (
          <div className="mt-6">
            {/* Banner informativo */}
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-900/20 p-4 mb-4">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Debe cambiar su contraseña
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Por seguridad, establezca una nueva contraseña antes de continuar.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmitChange(onSubmitChange)}
              className="space-y-4"
              autoComplete="off"
            >
              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 pr-10 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    {...registerChange("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {changeErrors.newPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {changeErrors.newPassword.message}
                  </p>
                )}

                {/* Indicadores de fortaleza */}
                {newPwValue && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {[
                      { key: "hasMinLength", label: "8+ caracteres" },
                      { key: "hasUppercase", label: "Mayúscula" },
                      { key: "hasLowercase", label: "Minúscula" },
                      { key: "hasNumber", label: "Número" },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-1 text-xs">
                        <span
                          className={
                            pwStrength[key] ? "text-green-500" : "text-slate-300"
                          }
                        >
                          {pwStrength[key] ? "✓" : "○"}
                        </span>
                        <span
                          className={
                            pwStrength[key]
                              ? "text-green-600 dark:text-green-400"
                              : "text-slate-500"
                          }
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 pr-10 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                    placeholder="Repita la nueva contraseña"
                    autoComplete="new-password"
                    {...registerChange("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {changeErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">
                    {changeErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRequireChangeData(null);
                    resetChange();
                  }}
                  className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={isChanging}
                  className="flex-1 rounded-lg bg-primary-700 text-white py-2 text-sm font-medium hover:bg-primary-800 disabled:opacity-60"
                >
                  {isChanging ? "Guardando…" : "Cambiar y entrar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Versión de la aplicación */}
        <div className="mt-6 text-center">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {APP_NAME} {APP_VERSION}
          </span>
        </div>
      </div>
    </div>
  );
}
