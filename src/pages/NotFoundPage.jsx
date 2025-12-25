import { Link } from 'react-router-dom'

/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\pages\\NotFoundPage.jsx
 * @version 2.0.0
 * @description Página 404 / Not Found.
 *
 * @module src/pages/NotFoundPage.jsx
 */

/**
 * NotFoundPage - Página 404
 *
 * @component
 * @category Pages
 * @returns {JSX.Element}
 */

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm p-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">404</h1>
        <p className="text-sm text-slate-500 mt-2">Página no encontrada</p>
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 text-white px-4 py-2 font-medium hover:bg-slate-800"
          >
            Ir a Login
          </Link>
        </div>
      </div>
    </div>
  )
}
