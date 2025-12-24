// Service Worker for Job Agent Extension
console.log('🚀 Job Agent: Service worker loaded')

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason)
  
  if (details.reason === 'install') {
    // Open welcome page on first install
    chrome.tabs.create({
      url: 'http://localhost:3000/register'
    })
  }
})

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request)
  
  if (request.action === 'saveJob') {
    handleSaveJob(request.data, sendResponse)
    return true // Keep channel open for async response
  }
  
  if (request.action === 'checkAuth') {
    handleCheckAuth(sendResponse)
    return true
  }
})

async function handleSaveJob(jobData, sendResponse) {
  try {
    // Get auth token
    const { auth_token } = await chrome.storage.local.get(['auth_token'])
    
    if (!auth_token) {
      sendResponse({ success: false, error: 'Not authenticated' })
      return
    }
    
    // Save job via API
    const response = await fetch('http://localhost:8000/api/v1/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth_token}`
      },
      body: JSON.stringify(jobData)
    })
    
    if (!response.ok) {
      throw new Error('Failed to save job')
    }
    
    const result = await response.json()
    sendResponse({ success: true, data: result })
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../assets/icons/icon-48.png',
      title: 'Job Saved!',
      message: `${jobData.title} has been saved to your dashboard.`
    })
    
  } catch (error) {
    console.error('Error saving job:', error)
    sendResponse({ success: false, error: error.message })
  }
}

async function handleCheckAuth(sendResponse) {
  try {
    const { auth_token } = await chrome.storage.local.get(['auth_token'])
    
    if (!auth_token) {
      sendResponse({ authenticated: false })
      return
    }
    
    // Verify token
    const response = await fetch('http://localhost:8000/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${auth_token}`
      }
    })
    
    sendResponse({ authenticated: response.ok })
    
  } catch (error) {
    sendResponse({ authenticated: false })
  }
}

// Handle browser action click (if needed)
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.url)
})

// Listen for tab updates to detect job pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Check if it's a job portal
    const url = tab.url || ''
    
    if (url.includes('naukri.com') || url.includes('linkedin.com/jobs')) {
      console.log('Job portal detected:', url)
      // Content script will handle the page
    }
  }
})