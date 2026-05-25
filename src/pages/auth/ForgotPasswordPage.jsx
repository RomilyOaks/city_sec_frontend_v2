import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowLeft, Mail } from "lucide-react";
import ThemeToggle from "../../components/common/ThemeToggle.jsx";
import api from "../../services/api.js";
import { APP_NAME, APP_VERSION } from "../../config/version.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Ingresa tu email");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setEnviado(true);
    } catch {
      // Siempre mostramos éxito por seguridad (el backend hace lo mismo)
      setEnviado(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Recuperar contraseña
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Te enviaremos un enlace a tu email registrado
            </p>
          </div>
          <ThemeToggle />
        </div>

        {!enviado ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoFocus
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-700 text-white py-2 font-medium hover:bg-primary-800 disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-primary-700 dark:hover:text-primary-400"
            >
              <ArrowLeft size={14} />
              Volver al login
            </Link>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Mail size={26} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-50">
                Revisa tu email
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Si <strong>{email}</strong> está registrado, recibirás las instrucciones en los próximos minutos.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-primary-700 dark:text-primary-400 hover:underline"
            >
              <ArrowLeft size={14} />
              Volver al login
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
