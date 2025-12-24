// Naukri.com Job Handler
console.log('🚀 Job Agent: Naukri handler loaded')

class NaukriHandler {
  constructor() {
    this.overlay = null
    this.currentJob = null
    this.isAuthenticated = false
    this.init()
  }

  async init() {
    // Wait for API client to be ready
    if (!window.apiClient) {
      setTimeout(() => this.init(), 100)
      return
    }

    // Check authentication
    this.isAuthenticated = await window.apiClient.isAuthenticated()
    console.log('Authentication status:', this.isAuthenticated)

    // Detect job page and show overlay
    if (this.isJobDetailPage()) {
        console.log('Naukri job detail page detected.')
      setTimeout(() => this.extractJobDetails(), 1000)
    }
    else {
      console.log('Not a Naukri job detail page.')
    }
  }

  isJobDetailPage() {
    // Naukri job detail URLs contain /job-listings/
    return window.location.href.includes('/job-listings/') || 
           window.location.href.includes('/jobDetail/') ||
           window.location.href.includes('/job-listings')
  }

  extractJobDetails() {
    console.log('Extracting job details from Naukri...')

    try {
      // Try multiple selectors for job title
      const title = this.getText([
        '.jd-header-title',
        '.title',
        'h1.job-title',
        '[class*="title"]'
      ])

      // Company name
      const company = this.getText([
        '.jd-header-comp-name',
        '.company-name',
        '[class*="company"]'
      ])

      // Location
      const location = this.getText([
        '.location',
        '.loc',
        '[class*="location"]'
      ])

      // Experience
      const experience = this.getText([
        '.exp',
        '[class*="experience"]'
      ])

      // Salary
      const salary = this.getText([
        '.salary',
        '[class*="salary"]'
      ])

      // Description
      const description = this.getText([
        '.dang-inner-html',
        '.job-desc',
        '[class*="description"]'
      ], true)

      // Skills
      const skills = this.extractSkills()

      this.currentJob = {
        title: title || 'Job Title',
        company: company || 'Company',
        location: location || '',
        description: description || '',
        url: window.location.href,
        portal_type: 'naukri',
        required_experience: experience || '',
        salary_range: salary || '',
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
    
    // Try to find skill tags
    const skillElements = document.querySelectorAll('.tag, .skill-tag, [class*="skill"]')
    skillElements.forEach(el => {
      const skill = el.textContent.trim()
      if (skill && skill.length < 30) {
        skills.push(skill)
      }
    })

    // If no skills found, try to extract from description
    if (skills.length === 0) {
      const description = this.getText(['.dang-inner-html', '.job-desc'], true)
      const commonSkills = ['Python', 'Java', 'JavaScript', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Kubernetes']
      commonSkills.forEach(skill => {
        if (description.includes(skill)) {
          skills.push(skill)
        }
      })
    }

    return skills
  }

  showOverlay() {
    // Remove existing overlay
    if (this.overlay) {
      this.overlay.remove()
    }

    // Create overlay
    this.overlay = document.createElement('div')
    this.overlay.className = 'job-agent-overlay'
    this.overlay.innerHTML = this.getOverlayHTML()
    document.body.appendChild(this.overlay)

    // Add event listeners
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
          
          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 12px;">
            Don't have an account? 
            <a href="http://localhost:3000/register" target="_blank" class="job-agent-link">Register</a>
          </p>
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
            ${this.currentJob.required_experience ? `<span>💼 ${this.currentJob.required_experience}</span>` : ''}
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
    // Close button
    const closeBtn = document.getElementById('job-agent-close')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.overlay.remove())
    }

    // Login button
    const loginBtn = document.getElementById('job-agent-login')
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        window.open('http://localhost:3000/login', '_blank')
      })
    }

    // Save button
    const saveBtn = document.getElementById('job-agent-save')
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveJob())
    }

    // View dashboard button
    const viewBtn = document.getElementById('job-agent-view')
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
        window.open('http://localhost:3000/jobs', '_blank')
      })
    }
  }

  async saveJob() {
    const saveBtn = document.getElementById('job-agent-save')
    const statusDiv = document.getElementById('job-agent-status')

    try {
      // Disable button
      saveBtn.disabled = true
      saveBtn.innerHTML = '<span class="job-agent-spinner"></span> Saving...'

      // Save job via API
      const result = await window.apiClient.saveJob(this.currentJob)
      console.log('Job saved:', result)

      // Show success message
      statusDiv.className = 'job-agent-status job-agent-status-success'
      statusDiv.textContent = '✓ Job saved successfully!'

      // Re-enable button with new text
      saveBtn.disabled = false
      saveBtn.innerHTML = '✓ Saved! View Dashboard'
      saveBtn.onclick = () => {
        window.open(`http://localhost:3000/jobs/${result.id}`, '_blank')
      }

      // Auto-close after 3 seconds
      setTimeout(() => {
        if (this.overlay) {
          this.overlay.remove()
        }
      }, 3000)

    } catch (error) {
      console.error('Error saving job:', error)

      // Show error message
      statusDiv.className = 'job-agent-status job-agent-status-error'
      statusDiv.textContent = '✗ ' + error.message

      // Re-enable button
      saveBtn.disabled = false
      saveBtn.innerHTML = '💾 Try Again'
    }
  }
}

// Initialize handler
new NaukriHandler()