// Extension Bridge
// This script enables communication between web app and extension

class ExtensionBridge {
    constructor() {
      this.extensionId = null
      this.isConnected = false
      this.init()
    }
  
    async init() {
      // Try to detect extension
      await this.detectExtension()
    }
  
    async detectExtension() {
      // Method 1: Try to communicate via postMessage
      window.addEventListener('message', (event) => {
        // Only accept messages from same origin
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === 'EXTENSION_READY') {
          console.log('✅ Extension detected and ready')
          this.isConnected = true
          this.extensionId = event.data.extensionId
        }
        
        if (event.data.type === 'AUTH_TOKEN_SAVED') {
          console.log('✅ Token saved to extension:', event.data.success)
        }
      })
      
      // Check if extension is present by looking for injected content
      const checkInterval = setInterval(() => {
        if (document.querySelector('[data-job-agent-extension]')) {
          this.isConnected = true
          clearInterval(checkInterval)
        }
      }, 100)
      
      // Stop checking after 3 seconds
      setTimeout(() => clearInterval(checkInterval), 3000)
    }
  
    // Send token to extension
    async saveToken(token) {
      if (!token) {
        console.warn('No token to save')
        return false
      }
  
      try {
        // Method 1: PostMessage to content script
        window.postMessage({
          type: 'SAVE_AUTH_TOKEN',
          token: token,
          source: 'job-agent-webapp'
        }, window.location.origin)
        
        console.log('📤 Token sent to extension')
        return true
      } catch (error) {
        console.error('Failed to send token to extension:', error)
        return false
      }
    }
  
    // Clear token from extension
    async clearToken() {
      try {
        window.postMessage({
          type: 'CLEAR_AUTH_TOKEN',
          source: 'job-agent-webapp'
        }, window.location.origin)
        
        console.log('📤 Clear token request sent to extension')
        return true
      } catch (error) {
        console.error('Failed to clear token from extension:', error)
        return false
      }
    }
  
    // Check if extension is installed
    isInstalled() {
      return this.isConnected
    }
  }
  
  // Create singleton instance
  const extensionBridge = new ExtensionBridge()
  
  // Make it available globally
  window.extensionBridge = extensionBridge
  
  export default extensionBridge