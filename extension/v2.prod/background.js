// Background Service Worker - Job Agent Extension

console.log('Job Agent Extension - Background Service Worker Started')

// ============================================================================
// Extension Installation & Updates
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason)
  
  if (details.reason === 'install') {
    // First time installation
    console.log('First time installation')
    
    // Open welcome page
    chrome.tabs.create({
      url: 'https://www.jobagent-career.com?welcome=true'
    })
    
    // Set default storage
    chrome.storage.local.set({
      settings: {
        autoSave: false,
        smartDetection: true,
        notifications: true
      }
    })
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('Extension updated to version:', chrome.runtime.getManifest().version)
  }
  
  // Create context menu (on install or update)
  chrome.contextMenus.create({
    id: 'save-job-text',
    title: 'Save as Job Description',
    contexts: ['selection']
  })
})

// ============================================================================
// Side Panel Management
// ============================================================================

// Open side panel when extension icon clicked
// chrome.action.onClicked.addListener(async (tab) => {
//   try {
//     // Check if side panel API is available
//     if (chrome.sidePanel) {
//       await chrome.sidePanel.open({ tabId: tab.id })
//     } else {
//       // Fallback to popup if side panel not available
//       console.log('Side panel not available, using popup')
//     }
//   } catch (error) {
//     console.error('Error opening side panel:', error)
//   }
// })

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command)
  
  if (command === 'save-current') {
    // Trigger quick save
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'QUICK_SAVE_TRIGGER'
        })
      }
    })
  }
})

// ============================================================================
// Authentication Management
// ============================================================================

// Listen for auth messages from web app or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type)
  
  if (message.type === 'AUTH_LOGIN') {
    handleAuthLogin(message.data)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }))
    return true // Keep channel open for async response
  }
  
  if (message.type === 'AUTH_LOGOUT') {
    handleAuthLogout()
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }))
    return true
  }
  
  if (message.type === 'GET_AUTH_STATUS') {
    getAuthStatus()
      .then((status) => sendResponse(status))
      .catch((error) => sendResponse({ authenticated: false, error: error.message }))
    return true
  }
  
  if (message.type === 'OPEN_WEB_APP') {
    chrome.tabs.create({ url: message.url || 'https://www.jobagent-career.com' })
    sendResponse({ success: true })
  }
  
  if (message.type === 'SHOW_NOTIFICATION') {
    showNotification(message.title, message.message, message.icon)
    sendResponse({ success: true })
  }
})

// ============================================================================
// Auth Helpers
// ============================================================================

async function handleAuthLogin(authData) {
  console.log('Handling auth login')
  
  // Store auth token and user data
  await chrome.storage.local.set({
    authToken: authData.token,
    user: authData.user,
    authTimestamp: Date.now()
  })
  
  // Notify all extension pages
  chrome.runtime.sendMessage({
    type: 'AUTH_SUCCESS',
    token: authData.token,
    user: authData.user
  })
  
  // Show notification
  showNotification(
    'Signed In',
    `Welcome back, ${authData.user.full_name || authData.user.email}!`,
    'success'
  )
}

async function handleAuthLogout() {
  console.log('Handling auth logout')
  
  // Clear storage
  await chrome.storage.local.remove(['authToken', 'user', 'authTimestamp'])
  
  // Notify all extension pages
  chrome.runtime.sendMessage({
    type: 'LOGOUT'
  })
  
  showNotification(
    'Signed Out',
    'You have been signed out',
    'info'
  )
}

async function getAuthStatus() {
  const result = await chrome.storage.local.get(['authToken', 'user', 'authTimestamp'])
  
  if (!result.authToken) {
    return { authenticated: false }
  }
  
  // Check if token is still valid (24 hours)
  const tokenAge = Date.now() - (result.authTimestamp || 0)
  const maxAge = 24 * 60 * 60 * 1000 // 24 hours
  
  if (tokenAge > maxAge) {
    // Token expired
    await handleAuthLogout()
    return { authenticated: false, reason: 'Token expired' }
  }
  
  return {
    authenticated: true,
    user: result.user,
    token: result.authToken
  }
}

// ============================================================================
// Notifications
// ============================================================================

function showNotification(title, message, type = 'info') {
  // Check if notifications are enabled
  chrome.storage.local.get(['settings'], (result) => {
    if (result.settings?.notifications === false) {
      return
    }
    
    const iconMap = {
      success: 'icons/icon-success.png',
      error: 'icons/icon-error.png',
      info: 'icons/icon48.png'
    }
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: iconMap[type] || iconMap.info,
      title: title,
      message: message,
      priority: 1
    })
  })
}

// ============================================================================
// Context Menu (Optional)
// ============================================================================

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'save-job-text' && info.selectionText) {
    // Send selected text to side panel
    chrome.runtime.sendMessage({
      type: 'PASTE_TEXT',
      text: info.selectionText
    })
    
    // Open side panel
    if (chrome.sidePanel) {
      chrome.sidePanel.open({ tabId: tab.id })
    }
  }
})

// ============================================================================
// External Messages (from web app)
// ============================================================================

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('External message from:', sender.url)
  
  // Only accept messages from trusted origins
  const trustedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://jobagent.app',
    'https://jobagent-career.com',
    'https://www.jobagent-career.com'
  ]
  
  const senderOrigin = new URL(sender.url).origin
  if (!trustedOrigins.includes(senderOrigin)) {
    console.warn('Rejected message from untrusted origin:', senderOrigin)
    sendResponse({ success: false, error: 'Untrusted origin' })
    return
  }
  
  // Handle auth from web app
  if (message.type === 'WEB_APP_AUTH') {
    handleAuthLogin({
      token: message.token,
      user: message.user
    })
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }))
    return true
  }
})

// ============================================================================
// Alarm for Token Refresh (Optional)
// ============================================================================

// Check token validity every hour
chrome.alarms.create('checkAuthToken', {
  periodInMinutes: 60
})

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'checkAuthToken') {
    const status = await getAuthStatus()
    
    if (!status.authenticated && status.reason === 'Token expired') {
      console.log('Token expired, user logged out')
    }
  }
})

// ============================================================================
// Error Handling
// ============================================================================

self.addEventListener('error', (event) => {
  console.error('Service Worker Error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason)
})

// ============================================================================
// Keep Alive (Prevent service worker from sleeping)
// ============================================================================

// Ping every 20 seconds to keep service worker alive
setInterval(() => {
  chrome.runtime.getPlatformInfo(() => {
    // Just to keep the service worker alive
  })
}, 20000)

console.log('Background service worker setup complete')