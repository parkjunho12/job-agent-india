import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import extensionBridge from '../utils/extensionBridge'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      
      // Actions
      login: async (user, token) => {
        // Update Zustand state (saves to localStorage)
        set({
          user,
          token,
          isAuthenticated: true,
        })
        
        // Sync to Extension
        console.log('🔄 Syncing token to extension...')
        await extensionBridge.saveToken(token)
      },
      
      logout: async () => {
        // Clear Zustand state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        
        // Clear from Extension
        console.log('🔄 Clearing token from extension...')
        await extensionBridge.clearToken()
      },
      
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }))
      },
      
      // Helpers
      getToken: () => get().token,
      getUser: () => get().user,
      
      isFreeTier: () => {
        const user = get().user
        return user?.tier === 'free'
      },
      
      isPremium: () => {
        const user = get().user
        return user?.is_premium || false
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
