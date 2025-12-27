"""
OpenAI GPT API Service
Replaces Anthropic Claude API for cost optimization
96% cost savings for India market
"""

from typing import Dict, Any, List, Optional
import json
import logging
from openai import AsyncOpenAI, OpenAIError, RateLimitError

from app.utils.config import settings

logger = logging.getLogger(__name__)


class OpenAIService:
    """
    Service for interacting with OpenAI GPT API
    Optimized for Job Agent India use case
    """
    
    def __init__(self):
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not set - AI features will not work")
        
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL  # "gpt-4o-mini"
        self.max_tokens = settings.OPENAI_MAX_TOKENS  # 4000
    
    async def parse_job_description(self, prompt: str) -> Dict[str, Any]:
        """
        Parse job description using GPT
        
        Args:
            prompt: Parsing prompt with JD text
            
        Returns:
            Parsed job data as dict
        """
        
        # System prompt for consistent behavior
        system_prompt = """You are an expert ATS (Applicant Tracking System) analyzer.
Your job is to extract structured information from job descriptions for the Indian job market.
Always return valid JSON with the exact structure requested.
Focus on technical keywords and skills that ATS systems look for."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.3,  # Lower for structured output
                response_format={"type": "json_object"},  # Force JSON
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            # Extract JSON from response
            content = response.choices[0].message.content
            
            # Parse JSON (should be valid due to json_object mode)
            parsed_data = json.loads(content)
            
            return parsed_data
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.debug(f"Raw response: {content}")
            
            # Return empty structure
            return self._get_empty_jd_structure()
        
        except RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise
        
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise
        
        except Exception as e:
            logger.error(f"Unexpected error calling GPT API: {e}")
            raise
        
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        json_mode: bool = False
    ) -> str:
        """
        Generic chat completion method
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Temperature for generation (0-1)
            max_tokens: Max tokens to generate (defaults to self.max_tokens)
            json_mode: Force JSON output
            
        Returns:
            Response text
        """
        
        try:
            kwargs = {
                "model": self.model,
                "max_tokens": max_tokens or self.max_tokens,
                "temperature": temperature,
                "messages": messages
            }
            
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            
            response = await self.client.chat.completions.create(**kwargs)
            
            return response.choices[0].message.content
            
        except RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise
        
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise
        
        except Exception as e:
            logger.error(f"Unexpected error in chat completion: {e}")
            raise        


    
    async def generate_answer(self, prompt: str) -> Dict[str, Any]:
        """
        Generate answer to application question
        
        Args:
            prompt: Answer generation prompt
            
        Returns:
            Generated answer data
        """
        
        system_prompt = """You are an expert resume and application writer for the Indian job market.
Your answers should be:
- Keyword-rich for ATS optimization
- Concise and direct (150-250 words)
- Include specific skills and technologies
- Use active voice and action verbs
Always return valid JSON."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.7,  # Slightly higher for creative answers
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
                
        except json.JSONDecodeError:
            # Fallback: treat whole response as answer
            return {
                "answer": content,
                "evidence": [],
                "confidence": 0.7
            }
        
        except RateLimitError as e:
            logger.error(f"Rate limit error: {e}")
            raise
        
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
        
        system_prompt = """You are an expert cover letter writer for Indian job applications.
Write professional yet concise cover letters that:
- Highlight relevant skills and experience
- Match job requirements with keywords
- Show genuine interest in the role
- Keep it to 200-300 words (Indian standard)
- Use Indian English conventions"""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.7,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            return response.choices[0].message.content
        
        except Exception as e:
            logger.error(f"Error generating cover letter: {e}")
            raise
    
    async def optimize_for_ats(self, prompt: str) -> Dict[str, Any]:
        """
        Optimize resume/content for ATS
        India-specific: keyword matching focus
        
        Args:
            prompt: ATS optimization prompt
            
        Returns:
            Optimized content with ATS score
        """
        
        system_prompt = """You are an ATS optimization expert for Indian job portals (Naukri, LinkedIn, Shine).
Your job is to:
- Integrate keywords naturally into content
- Optimize for ATS scanning
- Keep content concise and keyword-rich
- Focus on technical skills and tools
- Use Indian English
Always return valid JSON with optimized content and ATS score."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.4,  # Balanced for optimization
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"Error optimizing for ATS: {e}")
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
        
        system_prompt = """You are an expert at matching candidate experience to job requirements.
Analyze each experience and score its relevance (0-1) based on:
- Skills overlap
- Relevant achievements
- Industry/domain match
- Seniority level match
Return valid JSON with scored matches."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=2000,
                temperature=0.3,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            
            # Ensure it returns a list
            matches = result.get("matches", [])
            return matches
            
        except Exception as e:
            logger.error(f"Error matching experiences: {e}")
            # Fallback: return all with medium scores
            return [
                {
                    "experience_id": exp["id"],
                    "relevance_score": 0.5,
                    "matching_skills": [],
                    "relevant_achievements": []
                }
                for exp in experiences
            ]
    
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
6. Major spelling/grammar issues

Return JSON with this exact structure:
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
        
        system_prompt = """You are a quality control expert for job applications.
Identify risks and issues that could lead to rejection.
Be thorough but practical - focus on critical issues.
Return valid JSON."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=2000,
                temperature=0.3,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
            
        except Exception as e:
            logger.error(f"Error assessing risk: {e}")
            return {
                "risk_score": 50,
                "risk_factors": [],
                "validation_passed": False,
                "recommendations": ["Manual review recommended due to error"]
            }
    
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

Return JSON with this structure:
{{
  "matches": [
    {{
      "experience_id": 1,
      "relevance_score": 0.95,
      "matching_skills": ["skill1", "skill2"],
      "relevant_achievements": ["achievement1", "achievement2"]
    }},
    ...
  ]
}}

Order by relevance (highest first).
"""
        
        return prompt
    
    def _get_empty_jd_structure(self) -> Dict[str, Any]:
        """Return empty JD structure on parsing failure"""
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


# Backward compatibility: alias for existing code
AnthropicService = OpenAIService