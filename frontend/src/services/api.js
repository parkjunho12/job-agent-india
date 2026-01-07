import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.jobagent-career.com/api/v1',
  
})

function ensureContentType(config) {
const headers = config.headers ?? {}
  
    // 이미 호출부에서 Content-Type을 명시했다면 존중
if (headers['Content-Type'] || headers['content-type']) {
    config.headers = headers
    return config
}

const data = config.data

 // URLSearchParams -> x-www-form-urlencoded
 if (typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }
  // FormData -> 브라우저가 boundary 포함해서 자동 지정해야 함 (설정하지 않음)
  else if (typeof FormData !== 'undefined' && data instanceof FormData) {
    // do nothing
  }
  // 객체/배열 -> JSON
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

// Response interceptor - Handle errors
api.interceptors.response.use(
    (res) => res,
    (error) => {
      const url = error.config?.url || ''
      const isAuth = url.includes('/auth/login') || url.includes('/auth/register')
  
      if (error.response?.status === 401 && !isAuth) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )


const toForm = (obj) =>
  new URLSearchParams(
    Object.entries(obj ?? {}).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null) acc[k] = v
      return acc
    }, {})
  )
  

// Auth API
export const authApi = {
    login: (email, password) =>
        api.post(
          '/auth/login',
          new URLSearchParams({
            username: email,
            password,
            // grant_type: 'password', // 필요하면 추가
          })
        ),

        
  
  register: (userData) =>
    api.post('/auth/register', userData),
  
  getMe: (token) => 
    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),

  updateProfile: (data) => api.put('/auth/me', data),
  
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { 
      current_password: currentPassword,
      new_password: newPassword
    }),
  
  logout: () =>
    api.post('/auth/logout', toForm({}))
}

// Jobs API
export const jobsApi = {
  list: (params) => 
    api.get('/jobs', { params }),
  
  get: (id) => 
    api.get(`/jobs/${id}`),
  
  create: (jobData) => 
    api.post('/jobs', jobData),
  
  update: (id, jobData) => 
    api.put(`/jobs/${id}`, toForm(jobData)),
  
  delete: (id) => 
    api.delete(`/jobs/${id}`),
  
  reanalyze: (id) => 
    api.post(`/jobs/${id}/reanalyze`, toForm({})),
}

// Applications API
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
  

// Experiences API
export const experiencesApi = {
    getAll: () => 
        api.get('/experiences'),
  list: () => 
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
  
  // CV API
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

// Generation API
export const generationApi = {
    generateAnswers: (jobId, questions) => 
      api.post('/generation/answers', { job_id: jobId, questions }),
    
    generateCoverLetter: (jobId) => 
      api.post('/generation/cover-letter', { job_id: jobId }),
    
    matchExperiences: (jobId) => 
      api.post('/generation/match-experiences', { job_id: jobId } ),
  }
  
  // Automation API
  export const automationApi = {
    detectPortal: (url) => 
      api.post('/automation/detect-portal', { url }),
    
    extractForm: (portalType, formData) => 
      api.post('/automation/extract-form', { portal_type: portalType, form_data: formData }),
    
    assessRisk: (applicationId) => 
      api.post(`/automation/assess-risk`, { application_id: applicationId }),
  }
export default api
