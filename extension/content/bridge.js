// Extension Bridge Content Script
// Runs on localhost:3000 (web app) to receive auth tokens
console.log('🌉 Job Agent: Bridge script loaded on web app')

// Add marker to page so web app knows extension is installed
const marker = document.createElement('div')
marker.setAttribute('data-job-agent-extension', 'true')
marker.style.display = 'none'
document.body.appendChild(marker)

// Notify web app that extension is ready
window.postMessage({
  type: 'EXTENSION_READY',
  extensionId: chrome.runtime.id
}, window.location.origin)

// Listen for messages from web app
window.addEventListener('message', async (event) => {
  // Only accept messages from same origin
  if (event.origin !== window.location.origin) return
  
  const message = event.data
  
  // Ignore messages not for us
  if (message.source !== 'job-agent-webapp') return
  
  console.log('📨 Bridge received message:', message.type)
  
  // Handle SAVE_AUTH_TOKEN
  if (message.type === 'SAVE_AUTH_TOKEN') {
    const token = message.token
    
    try {
      // Save to chrome.storage.local
      await chrome.storage.local.set({ auth_token: token })
      console.log('✅ Token saved to extension storage')
      
      // Notify web app
      window.postMessage({
        type: 'AUTH_TOKEN_SAVED',
        success: true
      }, window.location.origin)
      
      // Also send to background script
      chrome.runtime.sendMessage({
        action: 'tokenUpdated',
        token: token
      })
      
    } catch (error) {
      console.error('❌ Failed to save token:', error)
      window.postMessage({
        type: 'AUTH_TOKEN_SAVED',
        success: false,
        error: error.message
      }, window.location.origin)
    }
  }
  
  // Handle CLEAR_AUTH_TOKEN
  if (message.type === 'CLEAR_AUTH_TOKEN') {
    try {
      // Remove from chrome.storage.local
      await chrome.storage.local.remove(['auth_token'])
      console.log('✅ Token cleared from extension storage')
      
      // Notify web app
      window.postMessage({
        type: 'AUTH_TOKEN_CLEARED',
        success: true
      }, window.location.origin)
      
      // Notify background script
      chrome.runtime.sendMessage({
        action: 'tokenCleared'
      })
      
    } catch (error) {
      console.error('❌ Failed to clear token:', error)
    }
  }
})

console.log('🌉 Bridge ready to receive auth tokens')