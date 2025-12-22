import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

import ThemeToggle from '../../components/common/ThemeToggle.jsx'
import { register as registerRequest } from '../../services/authService.js'
import { API_URL } from '../../config/constants.js'
import { APP_VERSION, APP_NAME } from '../../config/version.js'

const schema = z
  .object({
    username: z.string().min(3, 'Mínimo 3 caracteres').max(50, 'Máximo 50 caracteres'),
    email: z.string().email('Email inválido'),
    nombres: z.string().min(1, 'Requerido').max(100, 'Máximo 100 caracteres'),
    apellidos: z.string().min(1, 'Requerido').max(100, 'Máximo 100 caracteres'),
    telefono: z
      .string()
      .optional()
      .or(z.literal(''))
      .refine((v) => !v || /^[0-9]{7,15}$/.test(v), 'Teléfono inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Requerido'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export default function SignupPage() {
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const hidePasswordTimeoutRef = useRef(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      email: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    return () => {
      if (hidePasswordTimeoutRef.current) {
        clearTimeout(hidePasswordTimeoutRef.current)
      }
    }
  }, [])

  const handleTogglePassword = () => {
    const password = getValues('password') || ''
    if (!password) {
      toast.error('Primero debe ingresar la contraseña')
      return
    }

    setShowPassword((prev) => {
      const next = !prev
      if (hidePasswordTimeoutRef.current) {
        clearTimeout(hidePasswordTimeoutRef.current)
      }
      if (next) {
        hidePasswordTimeoutRef.current = setTimeout(() => {
          setShowPassword(false)
        }, 3000)
      }
      return next
    })
  }

  const onSubmit = async (form) => {
    try {
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        nombres: form.nombres,
        apellidos: form.apellidos,
        telefono: form.telefono || undefined,
      }

      await registerRequest(payload)
      toast.success('Usuario creado. Ahora puedes ingresar.')
      navigate('/login', { replace: true })
    } catch (err) {
      const status = err?.response?.status
      const backendMsg = err?.response?.data?.message
      const isNetwork = !status && (err?.message === 'Network Error' || err?.code)

      if (isNetwork) {
        toast.error(`No se pudo conectar a la API (${API_URL}). Revisa .env.local / CORS / URL.`)
      } else {
        toast.error(backendMsg || err?.message || 'No se pudo registrar')
      }
    }
  }

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="shieldGradSignup" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#4F7942',stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#2D4A22',stopOpacity:1}} />
                  </linearGradient>
                </defs>
                <path d="M16 2 L28 6 L28 14 C28 22 22 28 16 30 C10 28 4 22 4 14 L4 6 Z" 
                      fill="url(#shieldGradSignup)" stroke="#1a2e14" strokeWidth="1"/>
                <text x="16" y="20" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" 
                      fill="#FFFFFF" textAnchor="middle">C</text>
              </svg>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">CitySecure</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">Crear cuenta</p>
          </div>
          <ThemeToggle />
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Usuario</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
              placeholder="Ingrese usuario"
              autoComplete="off"
              {...register('username')}
            />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
              placeholder="correo@dominio.com"
              autoComplete="off"
              {...register('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Nombres</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                placeholder="Nombres"
                autoComplete="off"
                {...register('nombres')}
              />
              {errors.nombres && <p className="mt-1 text-xs text-red-600">{errors.nombres.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Apellidos</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                placeholder="Apellidos"
                autoComplete="off"
                {...register('apellidos')}
              />
              {errors.apellidos && <p className="mt-1 text-xs text-red-600">{errors.apellidos.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Teléfono (opcional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
              placeholder="999999999"
              autoComplete="off"
              {...register('telefono')}
            />
            {errors.telefono && <p className="mt-1 text-xs text-red-600">{errors.telefono.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Contraseña</label>
            <div className="mt-1 relative">
              <input
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 pr-10 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                onKeyDown={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
                {...register('password')}
              />
              <button
                type="button"
                onClick={handleTogglePassword}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-50"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar (auto en 3s)' : 'Mostrar (auto en 3s)'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            {capsLockOn && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="font-semibold">⚠ MAYÚSCULAS ACTIVADAS</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Confirmar contraseña</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500/60 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
              type={showPassword ? 'text' : 'password'}
              placeholder="Repita la contraseña"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-primary-700 text-white py-2 font-medium hover:bg-primary-800 disabled:opacity-60"
          >
            {isSubmitting ? 'Creando…' : 'Crear cuenta'}
          </button>

          <div className="flex items-center justify-between gap-3 text-sm">
            <Link to="/login" className="text-primary-800 dark:text-primary-200 hover:underline">
              Volver a login
            </Link>
          </div>
        </form>
        
        {/* Versión de la aplicación */}
        <div className="mt-6 text-center">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {APP_NAME} {APP_VERSION}
          </span>
        </div>
      </div>
    </div>
  )
}
