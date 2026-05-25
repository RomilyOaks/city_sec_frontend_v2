import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";
import ThemeToggle from "../../components/common/ThemeToggle.jsx";
import api from "../../services/api.js";
import { APP_NAME, APP_VERSION } from "../../config/version.js";

const pwStrengthCheck = (pw) => ({
  hasMinLength: pw.length >= 8,
  hasUppercase: /[A-Z]/.test(pw),
  hasLowercase: /[a-z]/.test(pw),
  hasNumber: /[0-9]/.test(pw),
});

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exitoso, setExitoso] = useState(false);

  const strength = pwStrengthCheck(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (!token || !email) {
      toast.error("Enlace inválido. Solicita uno nuevo.");
      return;
    }

    setLoading(true);
    try {
      console.group("🔐 [ResetPassword] submit");
      console.log("→ payload:", { token: token?.slice(0, 8) + "...", email, newPasswordLength: newPassword.length });

      const response = await api.post("/auth/reset-password", { token, email, newPassword });

      console.log("✅ respuesta OK:", response.status, response.data);
      console.groupEnd();

      setExitoso(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      console.group("❌ [ResetPassword] error");
      console.log("HTTP status:", err?.response?.status);
      console.log("response.data:", err?.response?.data);
      console.log("message extraído:", err?.response?.data?.message);
      console.log("err completo:", err);
      console.groupEnd();

      const msg = err?.response?.data?.message || "Error al restablecer contraseña";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-primary-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-center space-y-4">
          <p className="text-red-600 dark:text-red-400 font-medium">
            Enlace de recuperación inválido o incompleto.
          </p>
          <Link to="/forgot-password" className="text-sm text-primary-700 dark:text-primary-400 hover:underline">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Nueva contraseña
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Para <strong>{email}</strong>
            </p>
          </div>
          <ThemeToggle />
        </div>

        {!exitoso ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoFocus
                  className="w-full pr-10 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                />
                <button type="button" onClick={() => setShowNew((p) => !p)}
                  className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2 grid grid-cols-2 gap-1">
                  {[
                    { key: "hasMinLength", label: "8+ caracteres" },
                    { key: "hasUppercase", label: "Mayúscula" },
                    { key: "hasLowercase", label: "Minúscula" },
                    { key: "hasNumber", label: "Número" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-1 text-xs">
                      <span className={strength[key] ? "text-green-500" : "text-slate-300"}>
                        {strength[key] ? "✓" : "○"}
                      </span>
                      <span className={strength[key] ? "text-green-600 dark:text-green-400" : "text-slate-500"}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmar */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full pr-10 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                />
                <button type="button" onClick={() => setShowConfirm((p) => !p)}
                  className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Las contraseñas no coinciden</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-700 text-white py-2 font-medium hover:bg-primary-800 disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Restablecer contraseña"}
            </button>

            <Link to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-primary-700 dark:hover:text-primary-400">
              <ArrowLeft size={14} />
              Volver al login
            </Link>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <KeyRound size={26} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-50">
                ¡Contraseña restablecida!
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Serás redirigido al login en unos segundos...
              </p>
            </div>
            <Link to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-primary-700 dark:text-primary-400 hover:underline">
              <ArrowLeft size={14} />
              Ir al login ahora
            </Link>
          </div>
        )}

        <div className="mt-6 text-center">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {APP_NAME} {APP_VERSION}
          </span>
        </div>
      </div>
    </div>
  );
}
