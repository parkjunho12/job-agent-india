// Side Panel Logic - User-Driven Job Saving

const API_URL = 'http://localhost:8000/api/v1'

// State
let authToken = null
let currentUser = null

// Initialize
document.addEventListener('DOMContentLoaded', init)

async function init() {
  // Check authentication
  await checkAuth()
  
  // Set up event listeners
  setupEventListeners()
  
  // Load saved form data (if any)
  loadDraftForm()
}

// ============================================================================
// Authentication
// ============================================================================

async function checkAuth() {
  // Get token from storage
  const result = await chrome.storage.local.get(['authToken', 'user'])
  
  if (result.authToken) {
    authToken = result.authToken
    currentUser = result.user
    showMainForm()
  } else {
    showAuthRequired()
  }
}

function showAuthRequired() {
  document.getElementById('authRequired').style.display = 'block'
  document.getElementById('mainForm').style.display = 'none'
}

function showMainForm() {
  document.getElementById('authRequired').style.display = 'none'
  document.getElementById('mainForm').style.display = 'block'
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
  // Form submission
  document.getElementById('jobForm').addEventListener('submit', handleSubmit)
  
  // Quick actions
  document.getElementById('pasteBtn').addEventListener('click', handlePasteClipboard)
  document.getElementById('clearBtn').addEventListener('click', handleClearForm)
  document.getElementById('smartParseBtn').addEventListener('click', handleSmartParse)
  
  // Navigation
  document.getElementById('closeBtn').addEventListener('click', () => window.close())
  document.getElementById('openLoginBtn').addEventListener('click', openWebApp)
  document.getElementById('viewJobsBtn').addEventListener('click', openWebApp)
  document.getElementById('settingsBtn').addEventListener('click', () => openWebApp('/settings'))
  
  // Character count
  document.getElementById('description').addEventListener('input', updateCharCount)
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts)
  
  // Auto-save draft
  const formInputs = document.querySelectorAll('input, textarea, select')
  formInputs.forEach(input => {
    input.addEventListener('input', saveDraftForm)
  })
}

// ============================================================================
// Paste & Parse
// ============================================================================

async function handlePasteClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    
    if (!text || text.trim().length === 0) {
      showStatus('Clipboard is empty', 'error')
      return
    }
    
    // Insert into description
    document.getElementById('description').value = text
    updateCharCount()
    
    // Try to auto-detect title and company
    autoDetectFields(text)
    
    showStatus('Pasted from clipboard! ✨', 'success')
    
    // Save draft
    saveDraftForm()
  } catch (error) {
    console.error('Paste error:', error)
    showStatus('Could not read clipboard', 'error')
  }
}

function autoDetectFields(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  
  if (lines.length === 0) return
  
  // Try to detect job title (usually first line or has keywords)
  const titleField = document.getElementById('jobTitle')
  if (!titleField.value && lines[0]) {
    // First non-empty line is often the job title
    titleField.value = lines[0]
  }
  
  // Try to detect company (often second line or has "at", "by", etc.)
  const companyField = document.getElementById('company')
  if (!companyField.value && lines.length > 1) {
    for (let i = 1; i < Math.min(lines.length, 5); i++) {
      const line = lines[i]
      // Check if line looks like a company name
      if (line.length < 100 && !line.toLowerCase().includes('description')) {
        companyField.value = line
        break
      }
    }
  }
  
  // Try to detect location
  const locationField = document.getElementById('location')
  if (!locationField.value) {
    const locationRegex = /location:\s*(.+?)(?:\n|$)/i
    const match = text.match(locationRegex)
    if (match) {
      locationField.value = match[1].trim()
    }
  }
  
  // Try to detect salary
  const salaryField = document.getElementById('salary')
  if (!salaryField.value) {
    const salaryRegex = /(?:salary|compensation|pay):\s*(.+?)(?:\n|$)/i
    const match = text.match(salaryRegex)
    if (match) {
      salaryField.value = match[1].trim()
    }
  }
}

function handleSmartParse() {
  const description = document.getElementById('description').value
  
  if (!description || description.trim().length === 0) {
    showStatus('Please paste job description first', 'error')
    return
  }
  
  autoDetectFields(description)
  showStatus('Auto-detected fields from text', 'success')
}

// ============================================================================
// Form Handling
// ============================================================================

async function handleSubmit(e) {
  e.preventDefault()
  
  const submitBtn = document.getElementById('submitBtn')
  const originalText = submitBtn.innerHTML
  
  // Disable button
  submitBtn.disabled = true
  submitBtn.innerHTML = `
    <svg class="btn-icon spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
    </svg>
    Saving...
  `
  
  try {
    // Get form data
    const formData = {
      title: document.getElementById('jobTitle').value.trim(),
      company: document.getElementById('company').value.trim(),
      description: document.getElementById('description').value.trim(),
      location: document.getElementById('location').value.trim() || null,
      job_type: document.getElementById('jobType').value || null,
      salary_range: document.getElementById('salary').value.trim() || null,
      url: document.getElementById('url').value.trim() || null,
      portal_type: 'manual', // ✅ Always manual
      notes: document.getElementById('notes').value.trim() || null
    }
    
    // Call API
    const response = await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(formData)
    })
    
    if (!response.ok) {
      throw new Error('Failed to save job')
    }
    
    const result = await response.json()
    
    // Success!
    showStatus('✅ Job saved successfully!', 'success')
    
    // Clear form
    handleClearForm()
    
    // Clear draft
    await chrome.storage.local.remove('draftForm')
    
    // Optional: Show AI insights
    if (result.required_skills || result.key_responsibilities) {
      showAIInsights(result)
    }
    
  } catch (error) {
    console.error('Save error:', error)
    showStatus('❌ Failed to save job', 'error')
  } finally {
    // Re-enable button
    submitBtn.disabled = false
    submitBtn.innerHTML = originalText
  }
}

function handleClearForm() {
  document.getElementById('jobForm').reset()
  updateCharCount()
  hideAIInsights()
  showStatus('Form cleared', 'success')
}

// ============================================================================
// Draft Auto-Save
// ============================================================================

function saveDraftForm() {
  const formData = {
    title: document.getElementById('jobTitle').value,
    company: document.getElementById('company').value,
    description: document.getElementById('description').value,
    location: document.getElementById('location').value,
    jobType: document.getElementById('jobType').value,
    salary: document.getElementById('salary').value,
    url: document.getElementById('url').value,
    notes: document.getElementById('notes').value,
    timestamp: Date.now()
  }
  
  chrome.storage.local.set({ draftForm: formData })
}

async function loadDraftForm() {
  const result = await chrome.storage.local.get('draftForm')
  
  if (result.draftForm && result.draftForm.timestamp) {
    // Only load if draft is less than 24 hours old
    const hoursSinceDraft = (Date.now() - result.draftForm.timestamp) / (1000 * 60 * 60)
    
    if (hoursSinceDraft < 24) {
      const draft = result.draftForm
      
      document.getElementById('jobTitle').value = draft.title || ''
      document.getElementById('company').value = draft.company || ''
      document.getElementById('description').value = draft.description || ''
      document.getElementById('location').value = draft.location || ''
      document.getElementById('jobType').value = draft.jobType || ''
      document.getElementById('salary').value = draft.salary || ''
      document.getElementById('url').value = draft.url || ''
      document.getElementById('notes').value = draft.notes || ''
      
      updateCharCount()
      
      if (draft.description) {
        showStatus('Draft restored', 'success')
      }
    }
  }
}

// ============================================================================
// AI Insights (Optional)
// ============================================================================

function showAIInsights(jobData) {
  const container = document.getElementById('aiInsights')
  const content = document.getElementById('insightsContent')
  
  let html = ''
  
  if (jobData.required_skills && jobData.required_skills.length > 0) {
    html += `
      <div class="insight-section">
        <h4>Required Skills (${jobData.required_skills.length})</h4>
        <div class="skill-tags">
          ${jobData.required_skills.map(skill => `
            <span class="skill-tag">${skill}</span>
          `).join('')}
        </div>
      </div>
    `
  }
  
  if (jobData.key_responsibilities && jobData.key_responsibilities.length > 0) {
    html += `
      <div class="insight-section">
        <h4>Key Responsibilities</h4>
        <ul class="responsibilities-list">
          ${jobData.key_responsibilities.slice(0, 3).map(resp => `
            <li>${resp}</li>
          `).join('')}
        </ul>
      </div>
    `
  }
  
  if (html) {
    content.innerHTML = html
    container.style.display = 'block'
  }
}

function hideAIInsights() {
  document.getElementById('aiInsights').style.display = 'none'
}

// ============================================================================
// UI Utilities
// ============================================================================

function updateCharCount() {
  const description = document.getElementById('description').value
  document.getElementById('charCount').textContent = description.length
}

function showStatus(message, type = 'success') {
  const statusEl = document.getElementById('statusMessage')
  const textEl = statusEl.querySelector('.status-text')
  
  statusEl.className = `status-message ${type}`
  textEl.textContent = message
  statusEl.style.display = 'block'
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusEl.style.display = 'none'
  }, 3000)
}

function openWebApp(path = '/') {
  chrome.tabs.create({ url: `http://localhost:3000${path}` })
}

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

function handleKeyboardShortcuts(e) {
  // Escape to close
  if (e.key === 'Escape') {
    window.close()
  }
  
  // Ctrl/Cmd + S to save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    document.getElementById('jobForm').dispatchEvent(new Event('submit'))
  }
  
  // Ctrl/Cmd + V to paste (if not in input)
  if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
    e.preventDefault()
    handlePasteClipboard()
  }
}

// ============================================================================
// Message Listener (from background/popup)
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_SUCCESS') {
    authToken = message.token
    currentUser = message.user
    showMainForm()
  } else if (message.type === 'LOGOUT') {
    authToken = null
    currentUser = null
    showAuthRequired()
  }
  
  sendResponse({ received: true })
})