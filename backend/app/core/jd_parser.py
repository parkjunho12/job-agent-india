"""
Job Description Parser - extracts structured data from JD text
Uses Claude API for intelligent parsing
"""

from typing import Dict, List, Optional, Any
import re
from datetime import datetime
import logging

from app.services.openai_service import AnthropicService
from app.models.job import JobAnalysis

logger = logging.getLogger(__name__)


class JDParser:
    """
    Parses job descriptions into structured format
    """
    
    def __init__(self):
        self.anthropic = AnthropicService()
    
    async def parse_jd(self, jd_text: str, metadata: Dict[str, Any] = None) -> JobAnalysis:
        """
        Parse job description into structured format
        
        Args:
            jd_text: Raw job description text
            metadata: Optional metadata (company, title, etc.)
            
        Returns:
            JobAnalysis object with parsed fields
        """
        
        # Quick extraction of obvious patterns first
        quick_analysis = self._quick_extract(jd_text)
        
        # Use Claude for intelligent parsing
        prompt = self._build_parsing_prompt(jd_text, metadata)
        
        try:
            ai_analysis = await self.anthropic.parse_job_description(prompt)
            
            # Merge quick analysis with AI analysis
            final_analysis = self._merge_analyses(quick_analysis, ai_analysis)
            
            return JobAnalysis(**final_analysis)
            
        except Exception as e:
            logger.error(f"Error parsing JD with AI: {e}")
            # Fallback to quick analysis only
            return JobAnalysis(**quick_analysis)
    
    def _quick_extract(self, text: str) -> Dict[str, Any]:
        """
        Quick regex-based extraction for obvious patterns
        """
        result = {
            "required_skills": [],
            "preferred_skills": [],
            "required_experience": None,
            "key_responsibilities": [],
            "company_culture": [],
            "salary_range": None,
            "requires_cover_letter": False,
            "requires_portfolio": False,
            "custom_questions": []
        }
        
        # Salary patterns
        salary_patterns = [
            r'£\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*-\s*£?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)',
            r'£\s*(\d+)k?\s*-\s*£?\s*(\d+)k?',
        ]
        
        for pattern in salary_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                result["salary_range"] = match.group(0)
                break
        
        # Experience requirements
        exp_patterns = [
            r'(\d+)\+?\s*years?\s+(?:of\s+)?experience',
            r'(\d+)-(\d+)\s*years?\s+experience',
        ]
        
        for pattern in exp_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                if len(match.groups()) == 2:
                    result["required_experience"] = f"{match.group(1)}-{match.group(2)} years"
                else:
                    result["required_experience"] = f"{match.group(1)}+ years"
                break
        
        # Cover letter requirement
        if re.search(r'cover\s+letter|covering\s+letter', text, re.IGNORECASE):
            result["requires_cover_letter"] = True
        
        # Portfolio requirement
        if re.search(r'portfolio|work\s+samples', text, re.IGNORECASE):
            result["requires_portfolio"] = True
        
        return result
    
    def _build_parsing_prompt(self, jd_text: str, metadata: Optional[Dict] = None) -> str:
        """
        Build prompt for Claude API
        """
        
        prompt = f"""Analyze this UK job description and extract structured information.

Job Description:
{jd_text}

Please provide a JSON response with the following structure:
{{
  "required_skills": ["skill1", "skill2", ...],
  "preferred_skills": ["skill1", "skill2", ...],
  "required_experience": "X years" or "X-Y years" or null,
  "key_responsibilities": ["responsibility1", "responsibility2", ...],
  "company_culture": ["keyword1", "keyword2", ...],
  "salary_range": "£XX,XXX - £XX,XXX" or null,
  "requires_cover_letter": true/false,
  "requires_portfolio": true/false,
  "custom_questions": [
    {{"id": "q1", "text": "Question text?", "type": "short_text"}},
    ...
  ]
}}

Guidelines:
- Extract ALL technical skills mentioned
- Distinguish between required (must-have) and preferred (nice-to-have) skills
- List 5-10 key responsibilities in order of importance
- Identify cultural keywords (e.g., "collaborative", "fast-paced", "innovative")
- Detect any custom application questions
- For question types: short_text, long_text, multiple_choice, file_upload

Be thorough and accurate. This will be used to match candidates to jobs."""

        return prompt
    
    def _merge_analyses(
        self, 
        quick: Dict[str, Any], 
        ai: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Merge quick regex analysis with AI analysis
        AI takes precedence, but quick analysis fills gaps
        """
        
        result = ai.copy()
        
        # Fill in gaps from quick analysis
        for key, value in quick.items():
            if not result.get(key) or (isinstance(value, list) and not result[key]):
                result[key] = value
        
        return result
    
    def extract_questions_from_portal(
        self, 
        portal_type: str, 
        form_data: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """
        Extract application questions from portal-specific form data
        
        Args:
            portal_type: workday, greenhouse, lever, etc.
            form_data: Portal-specific form structure
            
        Returns:
            List of questions with IDs and types
        """
        
        questions = []
        
        if portal_type == "workday":
            questions = self._extract_workday_questions(form_data)
        elif portal_type == "greenhouse":
            questions = self._extract_greenhouse_questions(form_data)
        elif portal_type == "lever":
            questions = self._extract_lever_questions(form_data)
        
        return questions
    
    def _extract_workday_questions(self, form_data: Dict) -> List[Dict]:
        """Extract questions from Workday portal"""
        # TODO: Implement based on Workday DOM structure
        return []
    
    def _extract_greenhouse_questions(self, form_data: Dict) -> List[Dict]:
        """Extract questions from Greenhouse portal"""
        # TODO: Implement based on Greenhouse DOM structure
        return []
    
    def _extract_lever_questions(self, form_data: Dict) -> List[Dict]:
        """Extract questions from Lever portal"""
        # TODO: Implement based on Lever DOM structure
        return []


# Utility functions

def extract_company_name(text: str) -> Optional[str]:
    """
    Try to extract company name from JD text
    """
    patterns = [
        r'(?:at|@|join)\s+([A-Z][A-Za-z\s&]+?)(?:\s+is|\s+are|\.|\,)',
        r'([A-Z][A-Za-z\s&]+?)\s+is\s+(?:seeking|looking|hiring)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    
    return None


def extract_job_title(text: str) -> Optional[str]:
    """
    Try to extract job title from JD text
    """
    # Usually in first line or first paragraph
    lines = text.split('\n')
    for line in lines[:5]:
        line = line.strip()
        if len(line) > 10 and len(line) < 100:
            # Could be title
            return line
    
    return None
