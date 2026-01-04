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
        console.log('🔄 Syncing auth to extension...')
        await extensionBridge.saveAuth(user, token)
      },
      logout: async () => {
        // Clear Zustand state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        
        // Clear from Extension
        console.log('🔄 Clearing auth from extension...')
        await extensionBridge.clearAuth()
      },
       // Sync from extension on app start
       syncFromExtension: async () => {
        console.log('🔄 Checking extension for existing auth...')
        const auth = await extensionBridge.getAuth()
       
        if (auth && auth.token && auth.user) {
          console.log('✅ Found auth in extension, syncing to app...')
          set({
            user: auth.user,
            token: auth.token,
            isAuthenticated: true,
          })
          
          return true
        }
        
        return false
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
