import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * * STORE ZUSTAND: useThemeStore
 * 
 * @module useThemeStore
 * @description Store de estado global para gestión del tema visual de la aplicación
 * 
 * @property {Object} state - Estado del store
 * @property {Function} actions - Acciones para modificar el estado
 * 
 * ! NO modificar el estado directamente - usar las acciones provistas
 * TODO: Documentar propiedades específicas del estado
 * TODO: Documentar todas las acciones disponibles
 * 
 * @example
 * const { state, action } = useThemeStore();
 */

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: next })
      },
    }),
    { name: 'theme-storage' },
  ),
)
