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
            
    def _build_profile_prompt(self, experiences: List[Dict[str, Any]]) -> str:
        """
        LLM에 넣을 user prompt 생성.
        - experiences는 이미 너가 만든 experiences_data 형태를 그대로 넣으면 됨.
        """
        # 경험 데이터는 길 수 있으니 json 문자열로 넣는 방식이 가장 안정적
        experiences_json = json.dumps(experiences, ensure_ascii=False, indent=2)

        return f"""
        Given the following candidate experience data (JSON array):

        {experiences_json}

        Transform it into the following structured JSON format:

        {{
        "skills": string[],
        "experience_years": number,
        "education": string | null,
        "work_history": [
            {{
            "title": string,
            "company": string,
            "duration": string,
            "responsibilities": string[]
            }}
        ]
        }}

        Guidelines:
        - Output MUST be valid JSON only (no explanations, no markdown).
        - Do NOT invent information that is not present.
        - "skills": extract and deduplicate all skills used across experiences (skills_used).
        - "experience_years": estimate total professional experience in years using duration_months when available (sum months across professional/work experiences only, then floor(months/12)).
        If duration_months is missing, estimate conservatively (e.g., 0) rather than guessing.
        - "education": include only if explicitly present in the experience data (e.g., experience type indicates education or description contains degree keywords). Otherwise return null.
        - "work_history":
        - Include only professional/work experiences (exclude projects if clearly not work unless it is clearly relevant).
        - Use "title" and "organization" fields.
        - Convert duration_months into a human-readable string: "X years", "Y months", or "X years Y months".
        - "responsibilities" must be derived from achievements and description, rewritten as concise action bullets.
        Return ONLY the JSON object.
        """.strip()
    
    
    
    async def build_candidate_profile(
        self,
        experiences: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Raw experiences_data를 recruiter-friendly profile JSON으로 변환.

        Args:
            experiences: experiences_data 형태의 리스트

        Returns:
            {
              "skills": [...],
              "experience_years": ...,
              "education": ...,
              "work_history": [...]
            }
        """
        prompt = self._build_profile_prompt(experiences)

        system_prompt = (
            "You are an expert career analyst and recruiter.\n"
            "Convert raw candidate experience records into a concise structured profile.\n"
            "Follow the required JSON schema strictly. Output JSON only."
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=1200,
                temperature=0.2,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
            )

            content = response.choices[0].message.content
            result = json.loads(content)

            # 최소 스키마 보정 (프론트 크래시 방지)
            result.setdefault("skills", [])
            result.setdefault("experience_years", 0)
            result.setdefault("education", None)
            result.setdefault("work_history", [])

            if not isinstance(result["skills"], list):
                result["skills"] = []
            if not isinstance(result["work_history"], list):
                result["work_history"] = []

            # 경험년수는 int로
            try:
                result["experience_years"] = int(result.get("experience_years") or 0)
            except Exception:
                result["experience_years"] = 0

            return result

        except Exception as e:
            logger.error(f"Error building candidate profile: {e}")
            raise
    
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

    async def analyze_jd_match(
        self,
        job_description: str,
        user_cv: Dict[str, Any],
        job_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Analyze job description match with user CV
        Phase 2: Returns data for verdict calculation
        
        Args:
            job_description: Full job description text
            user_cv: User CV data (skills, experience, etc.)
            job_metadata: Job metadata (title, company, requirements)
            
        Returns:
            Match analysis with scores and gaps
        """
        
        # Build analysis prompt
        prompt = f"""Analyze how well this candidate matches this job posting.

        Job Title: {job_metadata.get('title', 'Unknown')}
        Company: {job_metadata.get('company', 'Unknown')}

        Job Description:
        {job_description}

        Required Skills: {', '.join(job_metadata.get('required_skills', []))}
        Preferred Skills: {', '.join(job_metadata.get('preferred_skills', []))}
        Required Experience: {job_metadata.get('required_experience', 'Not specified')}

        Candidate Profile:
        Skills: {', '.join(user_cv.get('skills', []))}
        Experience: {user_cv.get('experience_years', 0)} years
        Education: {user_cv.get('education', 'Not specified')}

        Work History:
        {self._format_work_history(user_cv.get('work_history', []))}

        Provide a comprehensive match analysis with:
        1. Overall match score (0-100)
        2. ATS keyword match score (0-100)
        3. Skill gaps (missing required skills)
        4. Experience gaps (seniority, years, domain)
        5. Candidate strengths (matching qualifications)
        6. Specific recommendations

        Return JSON with this exact structure:
        {{
        "match_score": 75.5,
        "ats_score": 82.0,
        "gaps": [
            {{
            "skill": "Python",
            "required_level": "Expert",
            "has_experience": false,
            "missing_keyword": true,
            "note": "Required skill not found in CV"
            }}
        ],
        "strengths": [
            "5 years JavaScript experience matches requirement",
            "Strong background in React ecosystem",
            "Previous leadership role aligns with seniority"
        ],
        "tips": [
            "Add Python project examples to CV",
            "Emphasize team leadership experience",
            "Highlight API development work"
        ],
        "experience_match": {{
            "years_required": 5,
            "years_candidate": 3,
            "seniority_match": "partial",
            "domain_match": "strong"
        }},
        "keyword_analysis": {{
            "total_keywords": 15,
            "matched_keywords": 12,
            "missing_keywords": ["Python", "Docker", "Kubernetes"],
            "matched_keywords_list": ["JavaScript", "React", "Node.js"]
        }}
        }}
        """
        
        system_prompt = """You are an expert ATS and recruiter analyzer.
        Provide honest, accurate match assessments.
        Identify real gaps and genuine strengths.
        Be specific with recommendations.
        Consider:
        - ATS keyword matching
        - Experience level fit
        - Skill overlap
        - Seniority alignment
        Always return valid JSON."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.3,  # Lower for consistent analysis
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            
            # Validate required fields
            if "match_score" not in result:
                result["match_score"] = 50.0
            if "ats_score" not in result:
                result["ats_score"] = 50.0
            if "gaps" not in result:
                result["gaps"] = []
            if "strengths" not in result:
                result["strengths"] = []
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse match analysis JSON: {e}")
            return self._get_empty_match_analysis()
        
        except Exception as e:
            logger.error(f"Error analyzing JD match: {e}")
            return self._get_empty_match_analysis()
    
    def _format_work_history(self, work_history: List[Dict[str, Any]]) -> str:
        """Format work history for prompt"""
        if not work_history:
            return "No work history provided"
        
        formatted = []
        for job in work_history[:3]:  # Limit to 3 most recent
            title = job.get('title', 'Unknown')
            company = job.get('company', 'Unknown')
            duration = job.get('duration', 'Unknown duration')
            responsibilities = job.get('responsibilities', [])
            
            job_text = f"{title} at {company} ({duration})"
            if responsibilities:
                job_text += "\n  Responsibilities: " + ", ".join(responsibilities[:3])
            
            formatted.append(job_text)
        
        return "\n\n".join(formatted)
    
    def _get_empty_match_analysis(self) -> Dict[str, Any]:
        """Return empty match analysis on error"""
        return {
            "match_score": 50.0,
            "ats_score": 50.0,
            "gaps": [],
            "strengths": [],
            "tips": ["Unable to complete analysis - please try again"],
            "experience_match": {
                "years_required": 0,
                "years_candidate": 0,
                "seniority_match": "unknown",
                "domain_match": "unknown"
            },
            "keyword_analysis": {
                "total_keywords": 0,
                "matched_keywords": 0,
                "missing_keywords": [],
                "matched_keywords_list": []
            }
        }
    
# Backward compatibility: alias for existing code
AnthropicService = OpenAIService

async def analyze_jd_match(
    job_description: str,
    user_cv: Dict[str, Any],
    job_metadata: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Module-level function for backward compatibility
    Matches the import pattern: from app.services.openai_service import analyze_jd_match
    """
    service = OpenAIService()
    return await service.analyze_jd_match(job_description, user_cv, job_metadata)