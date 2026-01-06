/**
 * Workday Portal Handler
 * Handles Workday-specific job application portals
 */

(function() {
    'use strict';
    
    console.log('[UK Job Agent] Workday handler initialized');
    
    // Workday portal detection
    const isWorkdayPortal = () => {
      return window.location.hostname.includes('myworkdayjobs.com') ||
             document.querySelector('[data-automation-id="jobPostingHeader"]') !== null;
    };
    
    if (!isWorkdayPortal()) {
      console.log('[UK Job Agent] Not a Workday portal');
      return;
    }
    
    // Notify background that portal is detected
    chrome.runtime.sendMessage({
      action: 'PORTAL_DETECTED',
      data: {
        portalType: 'workday',
        url: window.location.href
      }
    });
    
    /**
     * Extract job description from Workday page
     */
    function extractJobDescription() {
      const jobData = {
        title: '',
        company: '',
        location: '',
        description: '',
        url: window.location.href,
        portal_type: 'workday',
        portal_metadata: {}
      };
      
      // Extract title
      const titleEl = document.querySelector('[data-automation-id="jobPostingHeader"]') ||
                     document.querySelector('h2[data-automation-id="job-title"]');
      if (titleEl) {
        jobData.title = titleEl.textContent.trim();
      }
      
      // Extract company
      const companyEl = document.querySelector('[data-automation-id="company"]') ||
                       document.querySelector('.company-name');
      if (companyEl) {
        jobData.company = companyEl.textContent.trim();
      }
      
      // Extract location
      const locationEl = document.querySelector('[data-automation-id="locations"]') ||
                        document.querySelector('.job-location');
      if (locationEl) {
        jobData.location = locationEl.textContent.trim();
      }
      
      // Extract full description
      const descEl = document.querySelector('[data-automation-id="jobPostingDescription"]') ||
                    document.querySelector('.job-description');
      if (descEl) {
        jobData.description = descEl.innerText.trim();
      }
      
      // Extract posted date
      const postedEl = document.querySelector('[data-automation-id="postedOn"]');
      if (postedEl) {
        jobData.portal_metadata.posted_date = postedEl.textContent.trim();
      }
      
      // Extract job ID
      const urlParams = new URLSearchParams(window.location.search);
      const jobId = urlParams.get('job');
      if (jobId) {
        jobData.portal_metadata.workday_job_id = jobId;
      }
      
      return jobData;
    }
    
    /**
     * Extract application form structure
     */
    function extractFormStructure() {
      const form = document.querySelector('form[data-automation-id="applyForm"]') ||
                  document.querySelector('form.application-form');
      
      if (!form) {
        console.log('[UK Job Agent] No application form found');
        return null;
      }
      
      const questions = [];
      
      // Find all form fields
      const formGroups = form.querySelectorAll('[data-automation-id*="formField"]') ||
                        form.querySelectorAll('.form-group, .field-wrapper');
      
      formGroups.forEach((group, index) => {
        const label = group.querySelector('label');
        const input = group.querySelector('input, textarea, select');
        
        if (!label || !input) return;
        
        const questionId = input.id || `workday_q${index}`;
        const questionText = label.textContent.trim();
        const isRequired = label.classList.contains('required') ||
                          label.textContent.includes('*') ||
                          input.hasAttribute('required');
        
        let questionType = 'short_text';
        if (input.tagName === 'TEXTAREA') {
          questionType = 'long_text';
        } else if (input.tagName === 'SELECT') {
          questionType = 'multiple_choice';
        } else if (input.type === 'file') {
          questionType = 'file_upload';
        }
        
        questions.push({
          id: questionId,
          text: questionText,
          type: questionType,
          required: isRequired,
          element_selector: getSelector(input)
        });
      });
      
      return {
        questions,
        form_selector: getSelector(form)
      };
    }
    
    /**
     * Auto-fill form with provided answers
     */
    async function autoFillForm(answers) {
      console.log('[UK Job Agent] Auto-filling form with', answers.length, 'answers');
      
      let filledCount = 0;
      
      for (const answer of answers) {
        try {
          const element = document.querySelector(answer.element_selector);
          if (!element) {
            console.warn('[UK Job Agent] Element not found:', answer.element_selector);
            continue;
          }
          
          // Fill based on type
          if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            element.value = answer.answer;
            
            // Trigger input event for React/Angular forms
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Highlight filled field
            element.style.backgroundColor = '#e8f5e9';
            setTimeout(() => {
              element.style.backgroundColor = '';
            }, 2000);
            
            filledCount++;
          } else if (element.tagName === 'SELECT') {
            // Find matching option
            const options = Array.from(element.options);
            const match = options.find(opt => 
              opt.text.toLowerCase().includes(answer.answer.toLowerCase())
            );
            
            if (match) {
              element.value = match.value;
              element.dispatchEvent(new Event('change', { bubbles: true }));
              filledCount++;
            }
          }
          
          // Add small delay between fields
          await sleep(300);
          
        } catch (error) {
          console.error('[UK Job Agent] Error filling field:', error);
        }
      }
      
      console.log('[UK Job Agent] Auto-filled', filledCount, 'fields');
      
      // Show notification
      showNotification(`✓ Filled ${filledCount} fields. Please review before submitting.`);
      
      return filledCount;
    }
    
    /**
     * Inject "UK Job Agent" button into page
     */
    function injectAgentButton() {
      // Check if already injected
      if (document.getElementById('uk-job-agent-btn')) {
        return;
      }
      
      const button = document.createElement('button');
      button.id = 'uk-job-agent-btn';
      button.innerHTML = '🤖 UK Job Agent';
      button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        padding: 12px 24px;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
        transition: all 0.3s;
      `;
      
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
        button.style.boxShadow = '0 6px 16px rgba(33, 150, 243, 0.5)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.4)';
      });
      
      button.addEventListener('click', handleAgentButtonClick);
      
      document.body.appendChild(button);
    }
    
    /**
     * Handle agent button click
     */
    async function handleAgentButtonClick() {
      const menu = createMenu();
      document.body.appendChild(menu);
    }
    
    /**
     * Create action menu
     */
    function createMenu() {
      const overlay = document.createElement('div');
      overlay.id = 'uk-job-agent-menu';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      const menu = document.createElement('div');
      menu.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 12px;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      `;
      
      menu.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #333;">UK Job Agent</h3>
        <button id="save-job-btn" style="
          width: 100%;
          padding: 12px;
          margin-bottom: 12px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        ">💾 Save Job & Analyze</button>
        <button id="autofill-btn" style="
          width: 100%;
          padding: 12px;
          margin-bottom: 12px;
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        ">✨ Auto-Fill Application</button>
        <button id="close-menu-btn" style="
          width: 100%;
          padding: 12px;
          background: #f5f5f5;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        ">Cancel</button>
      `;
      
      overlay.appendChild(menu);
      
      // Event listeners
      overlay.querySelector('#save-job-btn').addEventListener('click', handleSaveJob);
      overlay.querySelector('#autofill-btn').addEventListener('click', handleAutoFill);
      overlay.querySelector('#close-menu-btn').addEventListener('click', () => {
        overlay.remove();
      });
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.remove();
        }
      });
      
      return overlay;
    }
    
    /**
     * Handle save job action
     */
    async function handleSaveJob() {
      showNotification('Saving job...');
      
      const jobData = extractJobDescription();
      
      const response = await chrome.runtime.sendMessage({
        action: 'SAVE_JOB',
        data: jobData
      });
      
      if (response.error) {
        showNotification('❌ Error: ' + response.error, true);
      } else {
        showNotification('✓ Job saved successfully!');
      }
      
      document.getElementById('uk-job-agent-menu')?.remove();
    }
    
    /**
     * Handle auto-fill action
     */
    async function handleAutoFill() {
      showNotification('Fetching answers...');
      
      const formStructure = extractFormStructure();
      if (!formStructure) {
        showNotification('❌ No application form found', true);
        return;
      }
      
      // Get job ID from storage or URL
      const urlParams = new URLSearchParams(window.location.search);
      const jobId = urlParams.get('job');
      
      const response = await chrome.runtime.sendMessage({
        action: 'GET_ANSWERS',
        data: {
          jobId: jobId,
          questions: formStructure.questions
        }
      });
      
      if (response.error) {
        showNotification('❌ Error: ' + response.error, true);
      } else {
        await autoFillForm(response.answers);
      }
      
      document.getElementById('uk-job-agent-menu')?.remove();
    }
    
    // Utility functions
    
    function getSelector(element) {
      if (element.id) return `#${element.id}`;
      if (element.className) return `.${element.className.split(' ')[0]}`;
      return element.tagName.toLowerCase();
    }
    
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    function showNotification(message, isError = false) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10001;
        padding: 16px 24px;
        background: ${isError ? '#f44336' : '#4CAF50'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
    
    // Initialize
    setTimeout(() => {
      injectAgentButton();
    }, 1000);
    
  })();