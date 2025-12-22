import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Eye, EyeOff, Lock, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { changePassword } from '../services/authService'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Ingrese su contraseña actual'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme la nueva contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const newPassword = watch('newPassword', '')

  // Validaciones de contraseña
  const hasMinLength = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasLowercase = /[a-z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)

  const onSubmit = async (data) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      toast.success('Contraseña actualizada correctamente')
      reset()
      onClose()
    } catch (err) {
      const message = err?.response?.data?.message || 'Error al cambiar la contraseña'
      toast.error(message)
    }
  }

  const handleClose = () => {
    reset()
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4" style={{ zIndex: 9999 }}>
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Cambiar Contraseña
              </h3>
              <p className="text-sm text-slate-500">Actualiza tu contraseña de acceso</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Contraseña actual */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Contraseña actual
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 pr-10 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                placeholder="Ingrese su contraseña actual"
                {...register('currentPassword')}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* Nueva contraseña */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 pr-10 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                placeholder="Ingrese la nueva contraseña"
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
            )}

            {/* Indicadores de fortaleza */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <Check size={14} className={hasMinLength ? 'text-green-500' : 'text-slate-300'} />
                  <span className={hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}>
                    Mínimo 8 caracteres
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Check size={14} className={hasUppercase ? 'text-green-500' : 'text-slate-300'} />
                  <span className={hasUppercase ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}>
                    Una mayúscula
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Check size={14} className={hasLowercase ? 'text-green-500' : 'text-slate-300'} />
                  <span className={hasLowercase ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}>
                    Una minúscula
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Check size={14} className={hasNumber ? 'text-green-500' : 'text-slate-300'} />
                  <span className={hasNumber ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}>
                    Un número
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Confirmar nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 pr-10 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                placeholder="Repita la nueva contraseña"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-60 font-medium"
            >
              {isSubmitting ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
