// API Client for communicating with backend
class APIClient {
    constructor() {
      this.baseURL = 'http://localhost:8000/api/v1'
      this.token = null
    }
  
    async init() {
      // Get token from storage
      const result = await chrome.storage.local.get(['auth_token'])
      this.token = result.auth_token
    }
  
    async setToken(token) {
      this.token = token
      await chrome.storage.local.set({ auth_token: token })
    }
  
    async clearToken() {
      this.token = null
      await chrome.storage.local.remove(['auth_token'])
    }
  
    getHeaders() {
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`
      }
      
      return headers
    }
  
    async request(endpoint, options = {}) {
      const url = `${this.baseURL}${endpoint}`
      
      const config = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      }
  
      try {
        const response = await fetch(url, config)
        
        if (response.status === 401) {
          // Unauthorized - clear token
          await this.clearToken()
          throw new Error('Authentication required. Please login.')
        }
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.detail || 'Request failed')
        }
        
        return await response.json()
      } catch (error) {
        console.error('API Request failed:', error)
        throw error
      }
    }
  
    // Auth endpoints
    async login(email, password) {
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)
  
      const response = await this.request('/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData
      })
      
      await this.setToken(response.access_token)
      return response
    }
  
    async getCurrentUser() {
      return await this.request('/auth/me')
    }
  
    // Jobs endpoints
    async saveJob(jobData) {
      return await this.request('/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData)
      })
    }
  
    async getJobs() {
      return await this.request('/jobs')
    }
  
    async analyzeJob(jobId) {
      return await this.request(`/jobs/${jobId}/reanalyze`, {
        method: 'POST'
      })
    }
  
    // Applications endpoints
    async createApplication(applicationData) {
      return await this.request('/applications', {
        method: 'POST',
        body: JSON.stringify(applicationData)
      })
    }
  
    // Generation endpoints
    async generateAnswers(jobId, questions) {
      return await this.request('/generation/answers', {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId, questions })
      })
    }
  
    async generateCoverLetter(jobId) {
      return await this.request('/generation/cover-letter', {
        method: 'POST',
        body: JSON.stringify({ job_id: jobId })
      })
    }
  
    // Check authentication status
    async isAuthenticated() {
      if (!this.token) {
        await this.init()
      }
      
      if (!this.token) {
        return false
      }
  
      try {
        await this.getCurrentUser()
        return true
      } catch (error) {
        return false
      }
    }
  }
  
  // Create singleton instance
  const apiClient = new APIClient()
  apiClient.init()
  
  // Make it available globally in content scripts
  window.apiClient = apiClient