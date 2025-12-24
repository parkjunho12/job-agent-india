/**
 * LinkedIn Job Handler v3.0
 * Based on real LinkedIn HTML structure analysis
 * 
 * Real HTML Structure (December 2024):
 * - Job Title: .job-details-jobs-unified-top-card__job-title h1 a
 * - Company: .job-details-jobs-unified-top-card__company-name a
 * - Location: .job-details-jobs-unified-top-card__primary-description-container (text content)
 * - Job Type: .job-details-fit-level-preferences button (On-site, Remote, Hybrid, Full-time, Part-time, etc.)
 * - Description: .jobs-description__content .jobs-box__html-content
 * - Company Info: .jobs-company__company-description
 * - Skills: Can be extracted from job description
 * - Benefits: .featured-benefits__benefit-list li
 */

class LinkedInJobHandler {
    constructor() {
      this.isLinkedIn = window.location.hostname.includes('linkedin.com');
      this.jobData = null;
      this.overlayElement = null;
      this.isAuthenticated = false;
      
      if (this.isLinkedIn) {
        console.log('🚀 Job Agent: LinkedIn handler v3.0 loaded');
        this.init();
      }
    }
  
    async init() {
      // Check authentication
      await this.checkAuth();
      
      // Wait for page to load
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupHandler());
      } else {
        this.setupHandler();
      }
    }
  
    async checkAuth() {
      try {
        const result = await chrome.storage.local.get(['auth_token']);
        this.isAuthenticated = !!result.auth_token;
        console.log('✅ Auth status:', this.isAuthenticated);
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        this.isAuthenticated = false;
      }
    }
  
    setupHandler() {
      // LinkedIn is a SPA, so we need to watch for URL changes
      this.observeUrlChanges();
      
      // Try to extract job on initial load
      if (this.isJobPage()) {
        setTimeout(() => this.extractJobDetails(), 2000);
      }
    }
  
    isJobPage() {
      const path = window.location.pathname;
      return path.includes('/jobs/view/') || path.includes('/jobs/collections/');
    }
  
    observeUrlChanges() {
      let lastUrl = location.href;
      
      new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
          lastUrl = url;
          
          // Remove old overlay
          this.removeOverlay();
          
          // Check if it's a job page
          if (this.isJobPage()) {
            setTimeout(() => this.extractJobDetails(), 2000);
          }
        }
      }).observe(document, { subtree: true, childList: true });
    }
  
    async extractJobDetails() {
      console.log('📊 Extracting job from LinkedIn...');
      
      try {
        // Try extraction methods in order
        const jobData = this.extractFromRealDOM() || 
                        this.extractFromURL() || 
                        null;
        
        if (jobData) {
          console.log('✅ Job extracted:', jobData);
          this.jobData = jobData;
          this.showOverlay();
        } else {
          console.warn('⚠️ Could not extract job data');
        }
      } catch (error) {
        console.error('❌ Extraction error:', error);
      }
    }
  
    extractFromRealDOM() {
      console.log('🔍 Extracting from real DOM structure...');
      
      try {
        // Title
        const titleElement = document.querySelector('.job-details-jobs-unified-top-card__job-title h1 a');
        const title = titleElement ? titleElement.textContent.trim() : null;
        
        // Company
        const companyElement = document.querySelector('.job-details-jobs-unified-top-card__company-name a');
        const company = companyElement ? companyElement.textContent.trim() : null;
        
        // Location and other metadata
        const metadata = this.extractMetadata();
        
        // Description
        const description = this.extractDescription();
        
        // Job type (On-site, Remote, Hybrid, Full-time, etc.)
        const jobType = this.extractJobType();
        
        // Benefits
        const benefits = this.extractBenefits();
        
        // Skills (extracted from description)
        const skills = this.extractSkills(description);
        
        // Job ID from URL
        const jobId = this.extractJobIdFromURL();
        
        // Build job object
        if (title && company) {
          return {
            title,
            company,
            location: metadata.location || 'Not specified',
            description: description || window.location.href,
            required_experience: metadata.experience || null,
            salary_range: metadata.salary || null,
            required_skills: skills,
            job_type: jobType,
            benefits: benefits,
            job_id: jobId,
            url: window.location.href,
            portal_type: 'linkedin'
          };
        }
        
        return null;
      } catch (error) {
        console.error('❌ Real DOM extraction failed:', error);
        return null;
      }
    }
  
    extractMetadata() {
      const metadata = {
        location: null,
        experience: null,
        salary: null
      };
      
      try {
        // Location is in the primary description
        const primaryDesc = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container');
        if (primaryDesc) {
          const text = primaryDesc.textContent;
          
          // Extract location (format: "London, England, United Kingdom")
          const locationMatch = text.match(/([^·]+(?:,\s*[^·]+)*)\s*(?:·|\()/);
          if (locationMatch) {
            metadata.location = locationMatch[1].trim();
          }
          
          // Extract salary if present
          const salaryMatch = text.match(/£([\d,]+(?:K)?)\s*(?:\/yr|-)/i) || 
                             text.match(/\$([\d,]+(?:K)?)\s*(?:\/yr|-)/i);
          if (salaryMatch) {
            metadata.salary = salaryMatch[0].trim();
          }
        }
        
        // Experience might be in metadata
        const metadataElements = document.querySelectorAll('.job-details-jobs-unified-top-card__tertiary-description-container span');
        metadataElements.forEach(el => {
          const text = el.textContent;
          if (text.match(/\d+\s*(?:-\s*\d+)?\s*years?/i)) {
            metadata.experience = text.trim();
          }
        });
      } catch (error) {
        console.error('⚠️ Metadata extraction error:', error);
      }
      
      return metadata;
    }
  
    extractDescription() {
      try {
        const descElement = document.querySelector('.jobs-description__content .jobs-box__html-content');
        if (descElement) {
          // Get text content and clean it up
          let description = descElement.textContent;
          
          // Remove "About the job" header
          description = description.replace(/^About the job\s*/i, '');
          
          // Clean up extra whitespace
          description = description.replace(/\s+/g, ' ').trim();
          
          // Limit to 3000 characters
          if (description.length > 3000) {
            description = description.substring(0, 3000) + '...';
          }
          
          return description;
        }
      } catch (error) {
        console.error('⚠️ Description extraction error:', error);
      }
      
      return null;
    }
  
    extractJobType() {
      const jobTypes = [];
      
      try {
        // Extract from fit level preferences
        const fitButtons = document.querySelectorAll('.job-details-fit-level-preferences button');
        fitButtons.forEach(button => {
          const text = button.textContent.trim();
          // Extract job type (On-site, Remote, Hybrid, Full-time, Part-time, etc.)
          const typeMatch = text.match(/(On-site|Remote|Hybrid|Full-time|Part-time|Contract|Temporary|Internship)/i);
          if (typeMatch) {
            jobTypes.push(typeMatch[1]);
          }
        });
      } catch (error) {
        console.error('⚠️ Job type extraction error:', error);
      }
      
      return jobTypes.length > 0 ? jobTypes.join(', ') : null;
    }
  
    extractBenefits() {
      const benefits = [];
      
      try {
        const benefitElements = document.querySelectorAll('.featured-benefits__benefit-list li');
        benefitElements.forEach(el => {
          const benefit = el.textContent.trim();
          if (benefit) {
            benefits.push(benefit);
          }
        });
      } catch (error) {
        console.error('⚠️ Benefits extraction error:', error);
      }
      
      return benefits;
    }
  
    extractSkills(description) {
      const skills = [];
      
      if (!description) return skills;
      
      // Common tech skills to look for
      const skillKeywords = [
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
        'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'laravel',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'terraform', 'ansible',
        'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
        'machine learning', 'deep learning', 'ai', 'nlp', 'computer vision', 'tensorflow', 'pytorch', 'keras',
        'git', 'agile', 'scrum', 'ci/cd', 'devops', 'microservices', 'api', 'rest', 'graphql'
      ];
      
      const lowerDesc = description.toLowerCase();
      
      skillKeywords.forEach(skill => {
        // Use word boundaries to avoid partial matches
        const regex = new RegExp(`\\b${skill}\\b`, 'i');
        if (regex.test(lowerDesc)) {
          // Capitalize first letter
          const capitalizedSkill = skill.charAt(0).toUpperCase() + skill.slice(1);
          skills.push(capitalizedSkill);
        }
      });
      
      return skills;
    }
  
    extractJobIdFromURL() {
      try {
        const urlMatch = window.location.pathname.match(/\/jobs\/view\/(\d+)/);
        return urlMatch ? urlMatch[1] : null;
      } catch (error) {
        console.error('⚠️ Job ID extraction error:', error);
        return null;
      }
    }
  
    extractFromURL() {
      console.log('🔍 Extracting from URL (fallback)...');
      
      try {
        const jobId = this.extractJobIdFromURL();
        
        if (jobId) {
          return {
            title: 'LinkedIn Job',
            company: 'Unknown Company',
            location: 'Not specified',
            description: window.location.href,
            job_id: jobId,
            url: window.location.href,
            portal_type: 'linkedin'
          };
        }
      } catch (error) {
        console.error('❌ URL extraction failed:', error);
      }
      
      return null;
    }
  
    showOverlay() {
      if (this.overlayElement) {
        this.removeOverlay();
      }
  
      const overlay = document.createElement('div');
      overlay.id = 'job-agent-overlay';
      overlay.className = 'job-agent-overlay';
      
      overlay.innerHTML = `
        <div class="job-agent-header">
          <h3>🤖 Job Agent</h3>
          <button class="job-agent-close" onclick="document.getElementById('job-agent-overlay').remove()">×</button>
        </div>
        <div class="job-agent-content">
          <h4>${this.jobData.title}</h4>
          <p class="job-agent-company">${this.jobData.company}</p>
          <p class="job-agent-meta">
            <span>📍 ${this.jobData.location}</span>
            ${this.jobData.job_type ? `<span>💼 ${this.jobData.job_type}</span>` : ''}
          </p>
          ${this.jobData.required_skills && this.jobData.required_skills.length > 0 ? `
            <div class="job-agent-skills">
              ${this.jobData.required_skills.slice(0, 5).map(skill => 
                `<span class="job-agent-skill-badge">${skill}</span>`
              ).join('')}
            </div>
          ` : ''}
          ${this.isAuthenticated ? `
            <button class="job-agent-button job-agent-save-button" id="job-agent-save">
              💾 Save & Analyze Job
            </button>
            <button class="job-agent-button job-agent-dashboard-button">
              👁️ View Dashboard
            </button>
          ` : `
            <p class="job-agent-auth-message">
              🔒 Please login to save jobs
            </p>
            <button class="job-agent-button job-agent-login-button">
              🔑 Go to Login
            </button>
          `}
        </div>
      `;
  
      document.body.appendChild(overlay);
      this.overlayElement = overlay;
  
      // Add event listeners
      this.attachEventListeners();
    }
  
    attachEventListeners() {
      if (!this.overlayElement) return;
  
      // Save button
      const saveButton = this.overlayElement.querySelector('#job-agent-save');
      if (saveButton) {
        saveButton.addEventListener('click', () => this.saveJob());
      }
  
      // Dashboard button
      const dashboardButton = this.overlayElement.querySelector('.job-agent-dashboard-button');
      if (dashboardButton) {
        dashboardButton.addEventListener('click', () => {
          window.open('http://localhost:3000/dashboard', '_blank');
        });
      }
  
      // Login button
      const loginButton = this.overlayElement.querySelector('.job-agent-login-button');
      if (loginButton) {
        loginButton.addEventListener('click', () => {
          window.open('http://localhost:3000/login', '_blank');
        });
      }
    }
  
    async saveJob() {
      const saveButton = this.overlayElement.querySelector('#job-agent-save');
      if (!saveButton) return;
  
      saveButton.disabled = true;
      saveButton.textContent = '⏳ Saving...';
  
      try {
        const result = await chrome.storage.local.get(['auth_token']);
        const token = result.auth_token;
  
        if (!token) {
          throw new Error('No authentication token found');
        }
  
        const response = await fetch('http://localhost:8000/api/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(this.jobData)
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('✅ Job saved:', data);
  
        saveButton.textContent = '✅ Saved!';
        saveButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        
        setTimeout(() => {
          saveButton.disabled = false;
          saveButton.textContent = '💾 Save & Analyze Job';
          saveButton.style.background = '';
        }, 2000);
        
      } catch (error) {
        console.error('❌ Save failed:', error);
        saveButton.textContent = '❌ Failed';
        saveButton.style.background = '#dc3545';
        
        setTimeout(() => {
          saveButton.disabled = false;
          saveButton.textContent = '💾 Save & Analyze Job';
          saveButton.style.background = '';
        }, 2000);
      }
    }
  
    removeOverlay() {
      if (this.overlayElement) {
        this.overlayElement.remove();
        this.overlayElement = null;
      }
    }
  }
  
  // Initialize handler
  const linkedInHandler = new LinkedInJobHandler();