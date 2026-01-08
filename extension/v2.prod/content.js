// Content Script - Injected into web app pages
// Bridges communication between web app and extension

console.log('🔌 Job Agent Extension: Content script loaded')

const marker = document.createElement('div')
marker.setAttribute('data-job-agent-extension', 'true')
marker.style.display = 'none'
document.body.appendChild(marker)

window.postMessage({
  type: 'EXTENSION_READY',
  extensionId: chrome.runtime.id
}, window.location.origin)

// Listen for messages from web app (page)
window.addEventListener('message', async (event) => {
  // Only accept messages from same origin
  if (event.source !== window) return
  if (!event.data.source || event.data.source !== 'job-agent-webapp') return
  
  console.log('📨 Content script received:', event.data.type)
  
  const { type, data } = event.data
  
  try {
    switch (type) {
      case 'GET_AUTH':
        await handleGetAuth()
        break
        
      case 'SAVE_AUTH':
        await handleSaveAuth(data)
        break
        
      case 'CLEAR_AUTH':
        await handleClearAuth()
        break
        
      default:
        console.log('Unknown message type:', type)
    }
  } catch (error) {
    console.error('Content script error:', error)
  }
})

// Get auth from extension storage
async function handleGetAuth() {
  console.log('Getting auth from extension storage...')
  
  const result = await chrome.storage.local.get(['authToken', 'user', 'authTimestamp'])
  
  if (result.authToken && result.user) {
    // Check if token is still valid (24 hours)
    const tokenAge = Date.now() - (result.authTimestamp || 0)
    const maxAge = 24 * 60 * 60 * 1000
    
    if (tokenAge < maxAge) {
      console.log('✅ Valid auth found in extension')
      window.postMessage({
        type: 'AUTH_RESPONSE',
        source: 'job-agent-extension',
        data: {
          token: result.authToken,
          user: result.user,
          valid: true
        }
      }, '*')
    } else {
      console.log('⚠️ Token expired')
      await chrome.storage.local.remove(['authToken', 'user', 'authTimestamp'])
      window.postMessage({
        type: 'AUTH_RESPONSE',
        source: 'job-agent-extension',
        data: { valid: false, reason: 'expired' }
      }, '*')
    }
  } else {
    console.log('ℹ️ No auth in extension')
    window.postMessage({
      type: 'AUTH_RESPONSE',
      source: 'job-agent-extension',
      data: { valid: false, reason: 'not_found' }
    }, '*')
  }
}

// Save auth to extension storage
async function handleSaveAuth(data) {
  console.log('Saving auth to extension storage...')
  
  if (!data.token || !data.user) {
    console.error('Invalid auth data')
    return
  }
  
  await chrome.storage.local.set({
    authToken: data.token,
    user: data.user,
    authTimestamp: Date.now()
  })
  
  console.log('✅ Auth saved to extension')
  
  window.postMessage({
    type: 'AUTH_SAVED',
    source: 'job-agent-extension',
    data: { success: true }
  }, '*')
  
}

// Clear auth from extension storage
async function handleClearAuth() {
  console.log('Clearing auth from extension storage...')
  
  await chrome.storage.local.remove(['authToken', 'user', 'authTimestamp'])
  
  console.log('✅ Auth cleared from extension')
  
  window.postMessage({
    type: 'AUTH_CLEARED',
    source: 'job-agent-extension',
    data: { success: true }
  }, '*')
}

// Listen for storage changes from extension (e.g., popup login)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes.authToken || changes.user)) {
    console.log('📥 Auth changed in extension storage')
    
    // Notify web app
    if (changes.authToken && changes.user && changes.authToken.newValue) {
      // Auth was added/updated
      console.log('changes.authToken.newValue:', changes.authToken.newValue)
      window.postMessage({
        type: 'AUTH_CHANGED',
        source: 'job-agent-extension',
        data: {
          token: changes.authToken.newValue,
          user: changes.user.newValue,
          action: 'updated'
        }
      }, '*')
    } else if (changes.authToken && !changes.authToken.newValue) {
      // Auth was removed
      window.postMessage({
        type: 'AUTH_CHANGED',
        source: 'job-agent-extension',
        data: {
          action: 'cleared'
        }
      }, '*')
    }
  }
})

// Notify web app that content script is ready
console.log('✅ Content script ready, notifying web app...')
window.postMessage({
  type: 'EXTENSION_READY',
  source: 'job-agent-extension',
  data: { version: '1.0.0' }
}, '*')