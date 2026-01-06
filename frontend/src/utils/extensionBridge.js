// Extension Bridge - Web App Side
// Communicates with extension via content script

class ExtensionBridge {
  constructor() {
    this.isReady = false
    this.pendingRequests = new Map()
    this.requestId = 0
    this.init()
  }

  async init() {
    console.log('🔌 Extension Bridge initializing...')
    
    // Listen for messages from content script
    window.addEventListener('message', (event) => {
      // Only accept messages from same window
      if (event.source !== window) return
      if (!event.data.source || event.data.source !== 'job-agent-extension') return
      
      this.handleMessage(event.data)
    })
    
    // Wait for extension ready signal
    const readyPromise = new Promise((resolve) => {
      const checkReady = (event) => {
        if (event.data.type === 'EXTENSION_READY' && 
            event.data.source === 'job-agent-extension') {
          this.isReady = true
          console.log('✅ Extension detected and ready')
          window.removeEventListener('message', checkReady)
          resolve()
        }
      }
      window.addEventListener('message', checkReady)
      
      // Timeout after 3 seconds
      setTimeout(() => {
        if (!this.isReady) {
          console.log('⚠️ Extension not detected')
          window.removeEventListener('message', checkReady)
          resolve()
        }
      }, 3000)
    })
    
    await readyPromise
  }

  handleMessage(message) {
    const { type, data } = message
    
    console.log('📨 Received from extension:', type)
    
    switch (type) {
      case 'EXTENSION_READY':
        this.isReady = true
        break
        
      case 'AUTH_RESPONSE':
        this.handleAuthResponse(data)
        break
        
      case 'AUTH_SAVED':
        console.log('✅ Auth saved confirmation')
        break
        
      case 'AUTH_CLEARED':
        console.log('✅ Auth cleared confirmation')
        break
        
      case 'AUTH_CHANGED':
        this.handleAuthChanged(data)
        break
    }
  }

  handleAuthResponse(data) {
    if (data.valid && data.token && data.user) {
      console.log('✅ Received valid auth from extension')
      
      // Update localStorage for Zustand
      const authStorage = {
        state: {
          user: data.user,
          token: data.token,
          isAuthenticated: true
        },
        version: 0
      }
      localStorage.setItem('auth-storage', JSON.stringify(authStorage))
      
      // Trigger storage event to update Zustand
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'auth-storage',
        newValue: JSON.stringify(authStorage)
      }))
      
      // Also dispatch custom event
      window.dispatchEvent(new CustomEvent('auth-synced', { detail: data }))
    } else {
      console.log('❌ Received invalid auth from extension, clearing local auth')
      localStorage.removeItem('auth-storage')
      window.dispatchEvent(new Event('storage'))
      window.dispatchEvent(new CustomEvent('auth-cleared'))
    }
  }

  handleAuthChanged(data) {
    console.log('📥 Auth changed in extension:', data.action)
    
    if (data.action === 'updated' && data.token && data.user) {
      // Extension logged in - sync to web app
      this.handleAuthResponse({ valid: true, ...data })
    } else if (data.action === 'cleared') {
      // Extension logged out - clear web app
      localStorage.removeItem('auth-storage')
      window.dispatchEvent(new Event('storage'))
      window.dispatchEvent(new CustomEvent('auth-cleared'))
    }
  }

  // Check if extension is available
  isAvailable() {
    return this.isReady
  }

  // Send message to content script
  sendMessage(type, data = {}) {
    window.postMessage({
      type,
      source: 'job-agent-webapp',
      data
    }, '*')
  }

  // Save auth to extension storage
  async saveAuth(user, token) {


    console.log('📤 Saving auth to extension...')
    this.sendMessage('SAVE_AUTH', { user, token })
    return true
  }

  // Get auth from extension storage
  async getAuth() {
  

    console.log('📤 Requesting auth from extension...')
    
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.data.type === 'AUTH_RESPONSE' && 
            event.data.source === 'job-agent-extension') {
          window.removeEventListener('message', handler)
          
          if (event.data.data.valid) {
            resolve({
              token: event.data.data.token,
              user: event.data.data.user
            })
          } else {
            resolve(null)
          }
        }
      }
      
      window.addEventListener('message', handler)
      this.sendMessage('GET_AUTH')
      
      // Timeout after 2 seconds
      setTimeout(() => {
        window.removeEventListener('message', handler)
        resolve(null)
      }, 2000)
    })
  }

  // Clear auth from extension storage
  async clearAuth() {

    console.log('📤 Clearing auth from extension...')
    this.sendMessage('CLEAR_AUTH')
    return true
  }

  // Sync from extension to web app
  async syncFromExtension() {
    const auth = await this.getAuth()
    
    if (auth && auth.token && auth.user) {
      console.log('✅ Syncing auth from extension to web app')
      this.handleAuthResponse({ valid: true, ...auth })
      return auth
    }
    
    return null
  }
}

// Create singleton instance
const extensionBridge = new ExtensionBridge()

// Make it available globally
if (typeof window !== 'undefined') {
  window.extensionBridge = extensionBridge
}

export default extensionBridge