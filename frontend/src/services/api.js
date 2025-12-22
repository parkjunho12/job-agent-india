import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - logout user
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email, password) => 
    api.post('/auth/login', { username: email, password }),
  
  register: (userData) => 
    api.post('/auth/register', userData),
  
  getMe: () => 
    api.get('/auth/me'),
  
  logout: () => 
    api.post('/auth/logout'),
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
    api.put(`/jobs/${id}`, jobData),
  
  delete: (id) => 
    api.delete(`/jobs/${id}`),
  
  reanalyze: (id) => 
    api.post(`/jobs/${id}/reanalyze`),
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
  
  submit: (id) => 
    api.post(`/applications/${id}/submit`),
}

// Experiences API
export const experiencesApi = {
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
}

// Generation API
export const generationApi = {
  generateAnswers: (jobId, questions) => 
    api.post('/generation/answers', { job_id: jobId, questions }),
  
  generateCoverLetter: (jobId) => 
    api.post('/generation/cover-letter', { job_id: jobId }),
  
  matchExperiences: (jobId) => 
    api.post('/generation/match', { job_id: jobId }),
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