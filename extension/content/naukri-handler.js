// Naukri.com Handler v3.0 - Based on Real HTML Structure
console.log('🚀 Job Agent: Naukri handler v3.0 loaded')

class NaukriHandler {
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
    console.log('✅ Auth status:', this.isAuthenticated)

    if (this.isJobDetailPage()) {
      // Wait for page to fully load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => this.extractJobDetails(), 2000)
        })
      } else {
        setTimeout(() => this.extractJobDetails(), 2000)
      }
    }
  }

  isJobDetailPage() {
    return window.location.pathname.includes('/job-listings-')
  }

  extractJobDetails() {
    console.log('📊 Extracting job from Naukri...')

    try {
      // Extract from actual DOM structure
      const jobData = this.extractFromRealDOM()
      
      if (jobData && jobData.title) {
        this.currentJob = jobData
        console.log('✅ Job extracted:', this.currentJob)
        this.showOverlay()
      } else {
        console.warn('❌ Could not extract job details')
      }
      
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }

  extractFromRealDOM() {
    // 실제 HTML 구조 기반 추출
    console.log('🔍 Extracting from real DOM structure...')
    
    // Title: <h1 class="styles_jd-header-title__rZwM1">
    const title = this.getTextBySelector('.styles_jd-header-title__rZwM1')
    
    // Company: <div class="styles_jd-header-comp-name__MvqAI"><a>
    const company = this.getTextBySelector('.styles_jd-header-comp-name__MvqAI a')
    
    // Location: <span class="styles_jhc__location__W_pVs"><a>
    const location = this.getTextBySelector('.styles_jhc__location__W_pVs a') || 
                     this.getTextBySelector('.styles_jhc__loc___Du2H')
    
    // Experience: <div class="styles_jhc__exp__k_giM">
    const experience = this.getTextBySelector('.styles_jhc__exp__k_giM')
    
    // Salary: <div class="styles_jhc__salary__jdfEC">
    const salary = this.getTextBySelector('.styles_jhc__salary__jdfEC')
    
    // Description: <div class="styles_JDC__dang-inner-html__h0K4t">
    const description = this.getTextBySelector('.styles_JDC__dang-inner-html__h0K4t', true)
    
    // Skills: <div class="styles_key-skill__GIPn_"> 내의 <a> 태그들
    const skills = this.extractSkillsFromKeySkillSection()
    
    // Job ID from URL
    const jobId = this.extractJobIdFromURL()

    if (!title) {
      console.warn('Title not found, trying fallback')
      return this.extractFromURL()
    }

    return {
      title: title,
      company: company || 'Company',
      location: location || 'India',
      description: description || 'Job description not available',
      url: window.location.href,
      portal_type: 'naukri',
      required_experience: experience || '',
      salary_range: salary || '',
      required_skills: skills,
      job_id: jobId
    }
  }

  getTextBySelector(selector, fullText = false) {
    try {
      const element = document.querySelector(selector)
      if (!element) return ''
      
      const text = element.textContent.trim()
      
      if (fullText) return text
      
      // Remove icons and extra whitespace
      return text
        .replace(/\s+/g, ' ')
        .split('\n')[0]
        .trim()
    } catch (e) {
      return ''
    }
  }

  extractSkillsFromKeySkillSection() {
    const skills = []
    
    // <div class="styles_key-skill__GIPn_"> 안의 모든 <a> 태그
    const keySkillSection = document.querySelector('.styles_key-skill__GIPn_')
    
    if (keySkillSection) {
      const skillLinks = keySkillSection.querySelectorAll('a.styles_chip__7YCfG')
      skillLinks.forEach(link => {
        const skillText = link.textContent.trim()
        if (skillText && skillText.length > 0) {
          skills.push(skillText)
        }
      })
    }
    
    return skills
  }

  extractJobIdFromURL() {
    // URL: /job-listings-data-science-intern-...-221225907070
    const match = window.location.pathname.match(/-(\d+)$/)
    return match ? match[1] : ''
  }

  extractFromURL() {
    // Fallback: URL 파싱
    const path = window.location.pathname
    const match = path.match(/job-listings-(.+?)-(\d+)/)
    
    if (!match) return null

    const slug = match[1]
    const jobId = match[2]
    const parts = slug.split('-')
    
    return {
      title: this.cleanTitle(parts.slice(0, -3).join(' ')),
      company: this.cleanText(parts.slice(-3, -2)[0] || 'Company'),
      location: this.cleanText(parts.slice(-2, -1)[0] || 'India'),
      description: `Naukri Job ID: ${jobId}\n\n${window.location.href}`,
      url: window.location.href,
      portal_type: 'naukri',
      job_id: jobId
    }
  }

  cleanTitle(text) {
    return text
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim()
  }

  cleanText(text) {
    return text
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  showOverlay() {
    if (this.overlay) this.overlay.remove()

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
          <button class="job-agent-close" id="ja-close">×</button>
        </div>
        <div class="job-agent-content">
          <div class="job-agent-status job-agent-status-info">
            Login to save this job
          </div>
          <button class="job-agent-button job-agent-button-primary" id="ja-login">
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
        <button class="job-agent-close" id="ja-close">×</button>
      </div>
      <div class="job-agent-content">
        <div class="job-agent-job-info">
          <div class="job-agent-job-title">${this.currentJob.title}</div>
          <div class="job-agent-job-company">${this.currentJob.company}</div>
          <div class="job-agent-job-meta">
            ${this.currentJob.location ? `<span>📍 ${this.currentJob.location}</span>` : ''}
            ${this.currentJob.required_experience ? `<span>💼 ${this.currentJob.required_experience}</span>` : ''}
          </div>
          ${this.currentJob.required_skills && this.currentJob.required_skills.length > 0 ? `
            <div class="job-agent-skills">
              ${this.currentJob.required_skills.slice(0, 5).map(skill => 
                `<span class="job-agent-skill-badge">${skill}</span>`
              ).join('')}
            </div>
          ` : ''}
        </div>
        <div id="ja-status"></div>
        <button class="job-agent-button job-agent-button-primary" id="ja-save">
          💾 Save & Analyze Job
        </button>
        <button class="job-agent-button job-agent-button-secondary" id="ja-view">
          👁️ View Dashboard
        </button>
      </div>
    `
  }

  attachEventListeners() {
    const close = document.getElementById('ja-close')
    const login = document.getElementById('ja-login')
    const save = document.getElementById('ja-save')
    const view = document.getElementById('ja-view')

    if (close) close.onclick = () => this.overlay.remove()
    if (login) login.onclick = () => window.open('http://localhost:3000/login', '_blank')
    if (save) save.onclick = () => this.saveJob()
    if (view) view.onclick = () => window.open('http://localhost:3000/jobs', '_blank')
  }

  async saveJob() {
    const btn = document.getElementById('ja-save')
    const status = document.getElementById('ja-status')

    try {
      btn.disabled = true
      btn.innerHTML = '<span class="job-agent-spinner"></span> Saving...'

      const result = await window.apiClient.saveJob(this.currentJob)
      
      status.className = 'job-agent-status job-agent-status-success'
      status.textContent = '✓ Saved successfully!'

      btn.disabled = false
      btn.innerHTML = '✓ View in Dashboard'
      btn.onclick = () => window.open(`http://localhost:3000/jobs/${result.id}`, '_blank')

      setTimeout(() => this.overlay.remove(), 3000)

    } catch (error) {
      status.className = 'job-agent-status job-agent-status-error'
      status.textContent = '✗ ' + error.message

      btn.disabled = false
      btn.innerHTML = '💾 Try Again'
    }
  }
}

new NaukriHandler()