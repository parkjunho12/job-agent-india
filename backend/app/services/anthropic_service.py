"""
Anthropic Claude API Service
Wrapper for all Claude API interactions
"""

from typing import Dict, Any, List, Optional
import json
import logging
from anthropic import Anthropic, AsyncAnthropic

from app.utils.config import settings

logger = logging.getLogger(__name__)


class AnthropicService:
    """
    Service for interacting with Anthropic Claude API
    """
    
    def __init__(self):
        if not settings.ANTHROPIC_API_KEY:
            logger.warning("ANTHROPIC_API_KEY not set - AI features will not work")
        
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = settings.ANTHROPIC_MODEL
        self.max_tokens = settings.ANTHROPIC_MAX_TOKENS
    
    async def parse_job_description(self, prompt: str) -> Dict[str, Any]:
        """
        Parse job description using Claude
        
        Args:
            prompt: Parsing prompt with JD text
            
        Returns:
            Parsed job data as dict
        """
        
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.3,  # Lower temperature for structured output
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            # Extract JSON from response
            content = response.content[0].text
            
            # Try to parse JSON
            try:
                # Remove markdown code blocks if present
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                parsed_data = json.loads(content)
                return parsed_data
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON response: {e}")
                logger.debug(f"Raw response: {content}")
                
                # Return empty structure
                return {
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
        
        except Exception as e:
            logger.error(f"Error calling Claude API: {e}")
            raise
    
    async def generate_answer(self, prompt: str) -> Dict[str, Any]:
        """
        Generate answer to application question
        
        Args:
            prompt: Answer generation prompt
            
        Returns:
            Generated answer data
        """
        
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.7,  # Higher temperature for creative answers
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            content = response.content[0].text
            
            # Try to parse JSON response
            try:
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0].strip()
                
                return json.loads(content)
                
            except json.JSONDecodeError:
                # If not JSON, treat whole response as answer
                return {
                    "answer": content,
                    "evidence": [],
                    "confidence": 0.7
                }
        
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            raise
    
    async def generate_cover_letter(self, prompt: str) -> str:
        """
        Generate cover letter
        
        Args:
            prompt: Cover letter generation prompt
            
        Returns:
            Cover letter text
        """
        
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.7,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            return response.content[0].text
        
        except Exception as e:
            logger.error(f"Error generating cover letter: {e}")
            raise
    
    async def match_experiences(
        self, 
        job_requirements: Dict[str, Any],
        experiences: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Match user experiences to job requirements
        
        Args:
            job_requirements: Parsed job requirements
            experiences: List of user experiences
            
        Returns:
            List of matched experiences with relevance scores
        """
        
        prompt = self._build_matching_prompt(job_requirements, experiences)
        
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                temperature=0.3,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            content = response.content[0].text
            
            # Parse JSON response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            matches = json.loads(content)
            return matches
            
        except Exception as e:
            logger.error(f"Error matching experiences: {e}")
            # Return all experiences with low scores as fallback
            return [
                {
                    "experience_id": exp["id"],
                    "relevance_score": 0.5,
                    "matching_skills": [],
                    "relevant_achievements": []
                }
                for exp in experiences
            ]
    
    def _build_matching_prompt(
        self, 
        job_requirements: Dict[str, Any],
        experiences: List[Dict[str, Any]]
    ) -> str:
        """
        Build prompt for experience matching
        """
        
        exp_text = "\n\n".join([
            f"Experience {exp['id']}:\n" +
            f"Title: {exp['title']}\n" +
            f"Organization: {exp['organization']}\n" +
            f"Skills: {', '.join(exp.get('skills_used', []))}\n" +
            f"Achievements:\n" +
            "\n".join([f"- {ach}" for ach in exp.get('achievements', [])])
            for exp in experiences
        ])
        
        prompt = f"""Match these experiences to the job requirements and rank by relevance.

Job Requirements:
Required Skills: {', '.join(job_requirements.get('required_skills', []))}
Preferred Skills: {', '.join(job_requirements.get('preferred_skills', []))}
Key Responsibilities: {', '.join(job_requirements.get('key_responsibilities', [])[:5])}

Candidate Experiences:
{exp_text}

For each experience, provide:
1. Relevance score (0-1, where 1 is perfect match)
2. Matching skills
3. Most relevant achievements (max 3)

Return JSON array ordered by relevance (highest first):
[
  {{
    "experience_id": 1,
    "relevance_score": 0.95,
    "matching_skills": ["skill1", "skill2"],
    "relevant_achievements": ["achievement1", "achievement2"]
  }},
  ...
]
"""
        
        return prompt
    
    async def assess_risk(
        self,
        application_data: Dict[str, Any],
        job_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Assess risk of application before submission
        
        Args:
            application_data: Generated answers and content
            job_data: Job requirements and details
            
        Returns:
            Risk assessment with score and factors
        """
        
        prompt = f"""Assess the risk of submitting this job application. Identify any potential issues.

Job Requirements:
{json.dumps(job_data, indent=2)}

Application Content:
{json.dumps(application_data, indent=2)}

Check for:
1. Missing required information
2. Answers that don't address questions properly
3. Length violations (too short/long)
4. Inconsistencies or contradictions
5. Weak or generic content
6. Spelling/grammar issues

Return JSON:
{{
  "risk_score": 0-100 (0=safe, 100=high risk),
  "risk_factors": [
    {{"type": "missing_info", "severity": "high", "description": "Cover letter required but missing"}},
    ...
  ],
  "validation_passed": true/false,
  "recommendations": ["Fix X", "Improve Y"]
}}
"""
        
        try:
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                temperature=0.3,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            content = response.content[0].text
            
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
            
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"Error assessing risk: {e}")
            return {
                "risk_score": 50,
                "risk_factors": [],
                "validation_passed": False,
                "recommendations": ["Manual review recommended due to error"]
            }
