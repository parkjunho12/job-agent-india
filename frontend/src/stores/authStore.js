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
        console.log('🔐 Login:', { user: user?.email })
        
        
        set({
          user,
          token,
          isAuthenticated: true,
        })
        
        try {
          await extensionBridge.saveAuth(user, token)
        } catch (error) {
          console.warn('⚠️ Extension not available')
        }
      },
      
      logout: async () => {
        console.log('🚪 Logout')
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        
        try {
          await extensionBridge.clearAuth()
        } catch (error) {
          console.warn('⚠️ Extension not available')
        }
      },
      
      setToken: (token) => {
        set({ token })
        
        try {
          const user = get().user
          if (user) {
            extensionBridge.saveAuth(user, token)
          }
        } catch (error) {
          console.warn('⚠️ Extension not available')
        }
      },
      
      syncFromExtension: async () => {
        console.log('🔄 Checking extension...')
        
        try {
          const auth = await extensionBridge.getAuth()
          
          if (auth && auth.token && auth.user) {
            console.log('✅ Found auth in extension')
            set({
              user: auth.user,
              token: auth.token,
              isAuthenticated: true,
            })
            
            return true
          }
        } catch (error) {
          console.warn('⚠️ Extension not available')
        }
        
        return false
      },
      
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }))
        
        try {
          const { user, token } = get()
          extensionBridge.saveAuth(user, token)
        } catch (error) {
          console.warn('⚠️ Extension not available')
        }
      },
      updateBilling: (billing) => set((state) => ({
        user: {
          ...state.user,
          plan: billing.plan,
          credits: billing.credits
        }
      })),
      
      // Getters
      getToken: () => get().token,
      getUser: () => get().user,
      
      // Tier & Permissions
      isFreeTier: () => get().user?.plan === 'free',
      isBasicTier: () => get().user?.plan === 'basic',
      isProTier: () => get().user?.plan === 'pro',
      isUltimateTier: () => get().user?.plan === 'ultimate',
      isEnterpriseTier: () => get().user?.plan === 'enterprise',
      isPremium: () => {
        const tier = get().user?.plan
        return tier && tier !== 'free'
      },
      getTier: () => get().user?.plan || 'free',
      
      // Email & OAuth
      isEmailVerified: () => get().user?.email_verified || false,
      isOAuthUser: () => !!get().user?.oauth_provider,
      getOAuthProvider: () => get().user?.oauth_provider || null,
      hasOAuthPicture: () => !!get().user?.oauth_picture,
      getOAuthPicture: () => get().user?.oauth_picture || null,
      
      // Account Status
      isActive: () => get().user?.is_active !== false,
      isSuperuser: () => get().user?.is_superuser || false,
      
      // User Info
      getFullName: () => get().user?.full_name || 'User',
      getEmail: () => get().user?.email || null,
      getInitials: () => {
        const user = get().user
        const name = user?.full_name || user?.email || 'U'
        
        if (user?.full_name) {
          const parts = name.split(' ')
          if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase()
          }
          return name.substring(0, 2).toUpperCase()
        }
        
        return name.substring(0, 2).toUpperCase()
      },
      
      // Settings
      isAutoFillEnabled: () => get().user?.auto_fill_enabled !== false,
      isNotificationEnabled: () => get().user?.notification_enabled !== false,
      
      // Profile
      getPhone: () => get().user?.phone || null,
      getLocation: () => get().user?.location || null,
      getLinkedInUrl: () => get().user?.linkedin_url || null,
      getPortfolioUrl: () => get().user?.portfolio_url || null,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

// Selectors
export const selectUser = (state) => state.user
export const selectToken = (state) => state.token
export const selectIsAuthenticated = (state) => state.isAuthenticated
export const selectTier = (state) => state.user?.plan || 'free'
export const selectIsEmailVerified = (state) => state.user?.email_verified || false
export const selectIsOAuthUser = (state) => !!state.user?.oauth_provider