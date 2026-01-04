// Popup script
const API_URL = 'http://localhost:8000/api/v1'
const WEB_APP_URL = 'http://localhost:3000'

let authToken = null
let isAuthenticated = false

// Initialize popup
async function init() {
  console.log('Initializing popup...')
  
  // Get auth token from storage
  const result = await chrome.storage.local.get(['auth_token'])
  authToken = result.auth_token
  
  if (authToken) {
    // Check if token is still valid
    try {
      await checkAuth()
      isAuthenticated = true
      loadStats()
    } catch (error) {
      isAuthenticated = false
      showStatus('Please login to use Job Agent', 'error')
    }
  } else {
    showStatus('Please login to use Job Agent', 'info')
  }
  
  // Setup event listeners
  setupEventListeners()
}

async function checkAuth() {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  })
  
  if (!response.ok) {
    throw new Error('Authentication failed')
  }
  
  return await response.json()
}

async function loadStats() {
  try {
    // Fetch jobs count
    const jobsResponse = await fetch(`${API_URL}/jobs?limit=1000`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json()
      document.getElementById('jobs-count').textContent = jobsData.length || 0
    }
    
    // Fetch applications count
    const appsResponse = await fetch(`${API_URL}/applications?limit=1000`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })
    
    if (appsResponse.ok) {
      const appsData = await appsResponse.json()
      document.getElementById('apps-count').textContent = appsData.length || 0
    }
    
    // Show stats
    document.getElementById('stats').classList.remove('hidden')
    showStatus('Connected to Job Agent ✓', 'success')
    
  } catch (error) {
    console.error('Error loading stats:', error)
    showStatus('Failed to load stats', 'error')
  }
}

function showStatus(message, type = 'info') {
  const statusEl = document.getElementById('status')
  statusEl.textContent = message
  statusEl.className = `status status-${type}`
  statusEl.classList.remove('hidden')
}

function setupEventListeners() {
  // Open dashboard
  document.getElementById('open-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_APP_URL}/dashboard` })
  })
  
  // View jobs
  document.getElementById('view-jobs').addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_APP_URL}/jobs` })
  })
  
  // Add experience
  document.getElementById('add-experience').addEventListener('click', () => {
    chrome.tabs.create({ url: `${WEB_APP_URL}/experiences` })
  })
  
  // Settings link
  document.getElementById('link-settings').addEventListener('click', (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: `${WEB_APP_URL}/settings` })
  })
  
  // Help link
  document.getElementById('link-help').addEventListener('click', (e) => {
    e.preventDefault()
    chrome.tabs.create({ url: `${WEB_APP_URL}` })
  })
}

// Initialize when popup opens
init()