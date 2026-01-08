// Popup Logic - Indian Theme

const WEB_APP_URL = 'https://www.jobagent-career.com'
const API_URL = 'https://api.jobagent-career.com/api/v1'

let authToken = null
let currentUser = null

console.log('Popup script loaded')

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing...')
  init()
})

async function init() {
  console.log('[1/4] Init started')
  
  try {
    // Always setup event listeners first
    console.log('[2/4] Setting up event listeners...')
    setupEventListeners()
    console.log('✅ Event listeners setup complete')
    
    // Check auth
    console.log('[3/4] Checking authentication...')
    await checkAuth()
    console.log('✅ Auth check complete')
    
  } catch (error) {
    console.error('❌ Init error:', error)
    // Fallback to showing login form
    showAuthRequired()
  }
  
  console.log('[4/4] Init complete!')
}

// ============================================================================
// Authentication
// ============================================================================

async function checkAuth() {
  try {
    console.log('Getting auth from storage...')
    
    const result = await chrome.storage.local.get(['authToken', 'user', 'authTimestamp'])
    console.log('Storage result:', result)
    
    if (!result.authToken || !result.user) {
      console.log('No auth found → showing login form')
      showAuthRequired()
      return
    }
    
    // Check token age
    const tokenAge = Date.now() - (result.authTimestamp || 0)
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    console.log('Token age (hours):', Math.round(tokenAge / (1000 * 60 * 60)))
    
    if (tokenAge > maxAge) {
      console.log('Token expired → showing login form')
      showAuthRequired()
      return
    }
    
    // Auth is valid
    console.log('✅ Auth valid → showing authenticated state')
    authToken = result.authToken
    currentUser = result.user
    showAuthenticatedState()
    
    // Load stats in background
    console.log('Loading stats...')
    loadStats().catch(err => console.log('Stats error (non-critical):', err))
    
  } catch (error) {
    console.error('❌ checkAuth error:', error)
    showAuthRequired()
  }
}

function showAuthRequired() {
  console.log('Showing auth required state')
  hide('loadingState')
  hide('authenticatedState')
  show('authRequired')
}

function showAuthenticatedState() {
  console.log('Showing authenticated state')
  hide('loadingState')
  hide('authRequired')
  show('authenticatedState')
  
  // Update user info
  if (currentUser) {
    console.log('Updating user info:', currentUser)
    const avatar = (currentUser.full_name || currentUser.email || 'U').charAt(0).toUpperCase()
    setText('userAvatar', avatar)
    setText('userName', currentUser.full_name || 'User')
    setText('userEmail', currentUser.email)
  }
}

// ============================================================================
// Stats Loading
// ============================================================================

async function loadStats() {
    if (!authToken) return
    
    try {
      console.log('Fetching job count...')
      const jobsResponse = await fetch(`${API_URL}/jobs/stats/count`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json()
        console.log('Jobs count response:', jobsData)
        
        const count = jobsData.count || 0
        console.log('Job count:', count)
        setText('jobCount', count)
      } else {
        console.error('Jobs API error:', jobsResponse.status)
        setText('jobCount', '0')
      }
    } catch (error) {
      console.error('Job count error:', error)
      setText('jobCount', '0')
    }
    
    try {
      console.log('Fetching app count...')
      const appsResponse = await fetch(`${API_URL}/applications/stats/count`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      
      if (appsResponse.ok) {
        const appsData = await appsResponse.json()
        console.log('Apps count response:', appsData)
        
        const count = appsData.count || 0
        console.log('App count:', count)
        setText('appCount', count)
      } else {
        console.error('Apps API error:', appsResponse.status)
        setText('appCount', '0')
      }
    } catch (error) {
      console.error('App count error:', error)
      setText('appCount', '0')
    }
  }

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
  // Login form
  on('loginForm', 'submit', handleLogin)
  
  // Buttons
  onClick('signUpBtn', () => openWebApp('/register'))
  onClick('openPanelBtn', handleOpenPanel)
  onClick('viewJobsBtn', () => openWebApp('/jobs'))
  onClick('dashboardLink', (e) => { e.preventDefault(); openWebApp('/dashboard') })
  onClick('settingsLink', (e) => { e.preventDefault(); openWebApp('/settings') })
  onClick('signOutBtn', (e) => { e.preventDefault(); handleSignOut() })
  
  console.log('All event listeners attached')
}

// ============================================================================
// Actions
// ============================================================================

async function handleLogin(e) {
  e.preventDefault()
  console.log('Login form submitted')
  
  const email = getValue('loginEmail')
  const password = getValue('loginPassword')
  
  console.log('Email:', email)
  
  // UI feedback
  disable('loginSubmitBtn')
  setText('loginBtnText', 'Signing in...')
  hide('authError')
  
  try {
    console.log('Calling login API...')
    
    // Login
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email, password })
    })
    
    if (!loginResponse.ok) {
      const error = await loginResponse.json()
      throw new Error(error.detail || 'Login failed')
    }
    
    const { access_token } = await loginResponse.json()
    console.log('Got access token')
    
    // Get user
    console.log('Getting user info...')
    const userResponse = await fetch(`${API_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    })
    
    if (!userResponse.ok) {
      throw new Error('Failed to get user info')
    }
    
    const user = await userResponse.json()
    console.log('Got user:', user)
    
    // Store auth in chrome.storage (this will auto-sync to web app)
    console.log('Storing auth in chrome.storage...')
    await chrome.storage.local.set({
      authToken: access_token,
      user: user,
      authTimestamp: Date.now()
    })
    
    console.log('Auth stored successfully')
    
    // Update state
    authToken = access_token
    currentUser = user
    showAuthenticatedState()
    loadStats()
    
    console.log('Login complete!')
    
  } catch (error) {
    console.error('Login error:', error)
    setText('authErrorText', error.message)
    show('authError')
  } finally {
    enable('loginSubmitBtn')
    setText('loginBtnText', 'Sign In')
  }
}

async function handleOpenPanel() {
  console.log('Opening side panel...')
  
  try {
    // Check if sidePanel API is available
    if (!chrome.sidePanel) {
      console.error('Side Panel API not available')
      alert('Side Panel not supported. Please update Chrome to 114+')
      return
    }
    
    // Get current window
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    
    if (!tab || !tab.windowId) {
      console.error('No active tab found')
      alert('Please open a tab first')
      return
    }
    
    console.log('Opening side panel for window:', tab.windowId)
    
    // Open side panel
    await chrome.sidePanel.open({ windowId: tab.windowId })
    
    console.log('✅ Side panel opened')
    
    // Close popup
    window.close()
    
  } catch (error) {
    console.error('Panel open error:', error)
    alert(`Failed to open side panel: ${error.message}`)
  }
}

async function handleSignOut() {
  if (!confirm('Sign out?')) return
  
  console.log('Signing out...')
  await chrome.storage.local.remove(['authToken', 'user', 'authTimestamp'])
  authToken = null
  currentUser = null
  showAuthRequired()
  console.log('Signed out')
}

function openWebApp(path = '/') {
  console.log('Opening web app:', path)
  chrome.tabs.create({ url: `${WEB_APP_URL}${path}` })
  window.close()
}

// ============================================================================
// Helper Functions
// ============================================================================

function $(id) {
  return document.getElementById(id)
}

function show(id) {
  const el = $(id)
  if (el) {
    el.classList.remove('hidden')
  }
}

function hide(id) {
  const el = $(id)
  if (el) {
    el.classList.add('hidden')
  }
}

function setText(id, text) {
  const el = $(id)
  if (el) el.textContent = text
}

function getValue(id) {
  const el = $(id)
  return el ? el.value : ''
}

function disable(id) {
  const el = $(id)
  if (el) el.disabled = true
}

function enable(id) {
  const el = $(id)
  if (el) el.disabled = false
}

function onClick(id, handler) {
  const el = $(id)
  if (el) el.addEventListener('click', handler)
}

function on(id, event, handler) {
  const el = $(id)
  if (el) el.addEventListener(event, handler)
}

// ============================================================================
// Message Listener
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message.type)
  
  if (message.type === 'AUTH_SUCCESS') {
    authToken = message.token
    currentUser = message.user
    showAuthenticatedState()
    loadStats()
  } else if (message.type === 'LOGOUT') {
    authToken = null
    currentUser = null
    showAuthRequired()
  }
  
  sendResponse({ received: true })
})

console.log('Popup script ready')