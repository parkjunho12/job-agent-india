import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.jobagent-career.com/api/v1',
  withCredentials: true, // For HttpOnly cookies (refresh token)
})

function ensureContentType(config) {
  const headers = config.headers ?? {}
  
  // Already has Content-Type
  if (headers['Content-Type'] || headers['content-type']) {
    config.headers = headers
    return config
  }

  const data = config.data

  // URLSearchParams -> x-www-form-urlencoded
  if (typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }
  // FormData -> Let browser set boundary
  else if (typeof FormData !== 'undefined' && data instanceof FormData) {
    // do nothing
  }
  // Object/Array -> JSON
  else if (data && typeof data === 'object') {
    headers['Content-Type'] = 'application/json'
  }

  config.headers = headers
  return config
}

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return ensureContentType(config)
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors & token refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    const url = error.config?.url || ''
    const isAuth = url.includes('/auth/login') || url.includes('/auth/register')

    // Handle 401 - Unauthorized
    if (error.response?.status === 401 && !isAuth && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh token
        const response = await api.post('/auth/refresh')
        const newToken = response.data.access_token

        // Update token in store
        useAuthStore.getState().setToken(newToken)

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - logout
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// ============================================
// Auth API - Enhanced with OAuth
// ============================================
export const authApi = {
  // Email/Password Login
  login: (email, password) =>
    api.post('/auth/login', {
      email,
      password
    }),

  // Register with email/password
  register: (email, password, fullName) =>
    api.post('/auth/register', {
      email,
      password,
      full_name: fullName
    }),

  // OAuth - Google
  oauthGoogleLogin: (code, redirectUri) =>
    api.post('/auth/oauth/google', {
      provider: 'google',
      code,
      redirect_uri: redirectUri
    }),

  // OAuth - GitHub
  oauthGitHubLogin: (code, redirectUri) =>
    api.post('/auth/oauth/github', {
      provider: 'github',
      code,
      redirect_uri: redirectUri
    }),

  // Email Verification
  verifyEmail: (token) =>
    api.post('/auth/verify-email', { token }),

  resendVerification: (email) =>
    api.post('/auth/resend-verification', { email }),

  // Password Management
  forgotPassword: (email) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', {
      token,
      new_password: newPassword
    }),

  changePassword: (oldPassword, newPassword) =>
    api.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    }),

  // Token Management
  refreshToken: () =>
    api.post('/auth/refresh'),

  logout: () =>
    api.post('/auth/logout'),

  // Current User
  me: () =>
    api.get('/auth/me'),

  getMe: (token) =>
    api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }),

  // Profile Update
  updateProfile: (data) =>
    api.put('/auth/me', data),
}

// ============================================
// Jobs API
// ============================================
export const jobsApi = {
  list: (params) =>
    api.get('/jobs', { params }),

  get: (id) =>
    api.get(`/jobs/${id}`),

  create: (jobData) =>
    api.post('/jobs', jobData),

  update: (id, jobData) =>
    api.put(`/jobs/${id}`, jobData),

  delete: (id) =>
    api.delete(`/jobs/${id}`),

  reanalyze: (id) =>
    api.post(`/jobs/${id}/reanalyze`),
  getCount: () => api.get('/jobs/stats/count'),
  updateQuestions: (id, questions) => 
    api.patch(`/jobs/${id}/questions`, questions),
}

// ============================================
// Applications API
// ============================================
export const applicationsApi = {
  list: (params) =>
    api.get('/applications', { params }),

  get: (id) =>
    api.get(`/applications/${id}`),

  create: (appData) =>
    api.post('/applications', appData),

  update: (id, appData) =>
    api.put(`/applications/${id}`, appData),

  delete: (id) =>
    api.delete(`/applications/${id}`),

  submit: (id) =>
    api.post(`/applications/${id}/submit`),
}

// ============================================
// Experiences API
// ============================================
export const experiencesApi = {
  list: () =>
    api.get('/experiences'),

  getAll: () =>
    api.get('/experiences'),

  get: (id) =>
    api.get(`/experiences/${id}`),

  create: (expData) =>
    api.post('/experiences', expData),

  update: (id, expData) =>
    api.put(`/experiences/${id}`, expData),

  delete: (id) =>
    api.delete(`/experiences/${id}`),

  getStats: () =>
    api.get('/experiences/stats/summary'),
}

// ============================================
// CV API
// ============================================
export const cvApi = {
  upload: async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    return api.post('/cv/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  parseAndSave: async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    return api.post('/cv/parse-and-save', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// ============================================
// Generation API
// ============================================
export const generationApi = {
  generateAnswers: (jobId, questions) =>
    api.post('/generation/answers', {
      job_id: jobId,
      questions
    }),

  generateCoverLetter: (jobId) =>
    api.post('/generation/cover-letter', {
      job_id: jobId
    }),

  matchExperiences: (jobId) =>
    api.post('/generation/match-experiences', {
      job_id: jobId
    }),
}

// ============================================
// Automation API
// ============================================
export const automationApi = {
  detectPortal: (url) =>
    api.post('/automation/detect-portal', { url }),

  extractForm: (portalType, formData) =>
    api.post('/automation/extract-form', {
      portal_type: portalType,
      form_data: formData
    }),

  assessRisk: (applicationId) =>
    api.post('/automation/assess-risk', {
      application_id: applicationId
    }),
}

// ============================================
// Billing API
// ============================================

export const billingApi = {
  // Get available plans
  getPlans: () => api.get('/billing/plans'),
  
  // Get current subscription
  getSubscription: () => api.get('/billing/subscription'),
  
  // Get usage stats
  getUsage: () => api.get('/billing/usage'),
  
  // Get credits
  getCredits: () => api.get('/billing/credits'),
  
  // Check if can analyze
  canAnalyze: () => api.get('/billing/can-analyze'),
  
  // Buy credits (one-time payment)
  buyCredit: (quantity = 1) => {
    const request_id = crypto.randomUUID()
    return api.post('/billing/buy-credit', null, { params: { quantity, request_id } })
  },
  
  // Subscribe to Basic
  subscribeBasic: () => api.post('/billing/subscribe-basic'),
  
  // Subscribe to Pro
  subscribePro: () => api.post('/billing/subscribe-pro'),
  
  // Cancel subscription
  cancelSubscription: () => api.post('/billing/cancel'),
  
  // Resume subscription
  resumeSubscription: () => api.post('/billing/resume'),
  
  // Get customer portal
  getPortal: () => api.post('/billing/portal'),
  
  // Get payment history
  getTransactions: (limit = 20) => 
    api.get('/billing/transactions', { params: { limit } }),
}


export const analysisApi = {
  /**
   * Run analysis (consumes quota)
   * POST /analysis/{job_id}/analyze
   */
  analyzeJob: (jobId) =>
    api.post(`/analysis/${jobId}/analyze`).then(res => res.data),

  /**
   * Get cached verdict (no quota)
   * GET /analysis/{job_id}/verdict
   */
  getVerdict: (jobId) =>
    api.get(`/analysis/${jobId}/verdict`).then(res => res.data),

  /**
   * Mark user decision
   * decision: 'applied' | 'skipped' | 'saved'
   * POST /analysis/{job_id}/mark-decision?decision=
   */
  markDecision: (jobId, decision) =>
    api.post(`/analysis/${jobId}/mark-decision`, null, {
      params: { decision }
    }).then(res => res.data),

  /**
   * Get decision statistics
   * GET /analysis/stats/decisions
   */
  getDecisionStats: () =>
    api.get('/analysis/stats/decisions').then(res => res.data),
}

export default api