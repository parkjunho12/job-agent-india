// LinkedIn Job Handler
console.log('🚀 Job Agent: LinkedIn handler loaded')

class LinkedInHandler {
  constructor() {
    this.overlay = null
    this.currentJob = null
    this.isAuthenticated = false
    this.init()
  }

  async init() {
    if (!window.apiClient) {
      setTimeout(() => this.init(), 100)
      return
    }

    this.isAuthenticated = await window.apiClient.isAuthenticated()
    console.log('Authentication status:', this.isAuthenticated)
    
    // LinkedIn is SPA, watch for URL changes
    this.observeURLChanges()
  }

  observeURLChanges() {
    let lastUrl = location.href
    new MutationObserver(() => {
      const url = location.href
      if (url !== lastUrl) {
        lastUrl = url
        this.onURLChange()
      }
    }).observe(document, {subtree: true, childList: true})
    
    this.onURLChange()
  }

  onURLChange() {
    if (this.isJobDetailPage()) {
      setTimeout(() => this.extractJobDetails(), 1500)
    }
  }

  isJobDetailPage() {
    return window.location.href.includes('/jobs/view/') ||
           window.location.href.includes('/jobs/collections/')
  }

  extractJobDetails() {
    console.log('Extracting job details from LinkedIn...')

    try {
      const title = this.getText([
        '.job-details-jobs-unified-top-card__job-title',
        '.jobs-unified-top-card__job-title',
        'h1'
      ])

      const company = this.getText([
        '.job-details-jobs-unified-top-card__company-name',
        '.jobs-unified-top-card__company-name',
        '[class*="company"]'
      ])

      const location = this.getText([
        '.job-details-jobs-unified-top-card__bullet',
        '[class*="workplace"]'
      ])

      const description = this.getText([
        '.jobs-description__content',
        '[class*="description"]'
      ], true)

      const skills = this.extractSkills()

      this.currentJob = {
        title: title || 'Job Title',
        company: company || 'Company',
        location: location || '',
        description: description || '',
        url: window.location.href,
        portal_type: 'linkedin',
        required_skills: skills
      }

      console.log('Extracted job:', this.currentJob)
      this.showOverlay()
    } catch (error) {
      console.error('Error extracting job details:', error)
    }
  }

  getText(selectors, fullText = false) {
    for (const selector of selectors) {
      const element = document.querySelector(selector)
      if (element) {
        return fullText ? element.textContent.trim() : element.textContent.trim().split('\n')[0]
      }
    }
    return ''
  }

  extractSkills() {
    const skills = []
    const skillElements = document.querySelectorAll('[class*="skill"]')
    skillElements.forEach(el => {
      const skill = el.textContent.trim()
      if (skill && skill.length < 30) {
        skills.push(skill)
      }
    })
    return skills
  }

  showOverlay() {
    if (this.overlay) {
      this.overlay.remove()
    }

    this.overlay = document.createElement('div')
    this.overlay.className = 'job-agent-overlay'
    this.overlay.innerHTML = this.getOverlayHTML()
    document.body.appendChild(this.overlay)

    this.attachEventListeners()
  }

  getOverlayHTML() {
    if (!this.isAuthenticated) {
      return `
        <div class="job-agent-header">
          <div class="job-agent-logo">
            <div class="job-agent-logo-icon"></div>
            <div class="job-agent-logo-text">Job Agent</div>
          </div>
          <button class="job-agent-close" id="job-agent-close">×</button>
        </div>
        <div class="job-agent-content">
          <div class="job-agent-status job-agent-status-info">
            Please login to save this job
          </div>
          <button class="job-agent-button job-agent-button-primary" id="job-agent-login">
            Login to Job Agent
          </button>
        </div>
      `
    }

    return `
      <div class="job-agent-header">
        <div class="job-agent-logo">
          <div class="job-agent-logo-icon"></div>
          <div class="job-agent-logo-text">Job Agent</div>
        </div>
        <button class="job-agent-close" id="job-agent-close">×</button>
      </div>
      <div class="job-agent-content">
        <div class="job-agent-job-info">
          <div class="job-agent-job-title">${this.currentJob.title}</div>
          <div class="job-agent-job-company">${this.currentJob.company}</div>
          <div class="job-agent-job-meta">
            ${this.currentJob.location ? `<span>📍 ${this.currentJob.location}</span>` : ''}
          </div>
        </div>
        <div id="job-agent-status"></div>
        <button class="job-agent-button job-agent-button-primary" id="job-agent-save">
          💾 Save & Analyze Job
        </button>
        <button class="job-agent-button job-agent-button-secondary" id="job-agent-view">
          👁️ View Dashboard
        </button>
      </div>
    `
  }

  attachEventListeners() {
    const closeBtn = document.getElementById('job-agent-close')
    if (closeBtn) closeBtn.addEventListener('click', () => this.overlay.remove())

    const loginBtn = document.getElementById('job-agent-login')
    if (loginBtn) loginBtn.addEventListener('click', () => window.open('http://localhost:3000/login', '_blank'))

    const saveBtn = document.getElementById('job-agent-save')
    if (saveBtn) saveBtn.addEventListener('click', () => this.saveJob())

    const viewBtn = document.getElementById('job-agent-view')
    if (viewBtn) viewBtn.addEventListener('click', () => window.open('http://localhost:3000/jobs', '_blank'))
  }

  async saveJob() {
    const saveBtn = document.getElementById('job-agent-save')
    const statusDiv = document.getElementById('job-agent-status')

    try {
      saveBtn.disabled = true
      saveBtn.innerHTML = '<span class="job-agent-spinner"></span> Saving...'

      const result = await window.apiClient.saveJob(this.currentJob)
      
      statusDiv.className = 'job-agent-status job-agent-status-success'
      statusDiv.textContent = '✓ Job saved successfully!'

      saveBtn.disabled = false
      saveBtn.innerHTML = '✓ Saved! View Dashboard'
      saveBtn.onclick = () => window.open(`http://localhost:3000/jobs/${result.id}`, '_blank')

      setTimeout(() => {
        if (this.overlay) this.overlay.remove()
      }, 3000)

    } catch (error) {
      statusDiv.className = 'job-agent-status job-agent-status-error'
      statusDiv.textContent = '✗ ' + error.message

      saveBtn.disabled = false
      saveBtn.innerHTML = '💾 Try Again'
    }
  }
}

new LinkedInHandler()