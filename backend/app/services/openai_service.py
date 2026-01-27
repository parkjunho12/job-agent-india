"""
OpenAI GPT API Service - Enhanced for Analysis Engine
Replaces Anthropic Claude API for cost optimization
96% cost savings for India market

New additions:
- analyze_cv_match() - Main analysis endpoint
- generate_cover_letter() - Full cover letter generation
- generate_interview_qa() - Interview Q&A generation
- generate_rewritten_bullets() - Resume bullet optimization
"""

from typing import Dict, Any, List, Optional
import json
import re
import logging
from openai import AsyncOpenAI, OpenAIError, RateLimitError
from app.models.user import User

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
    
    # ============================================
    # NEW: Analysis Engine Methods
    # ============================================
    
    async def analyze_cv_match(self, prompt: str) -> Dict[str, Any]:
        """
        Main analysis method for AnalysisEngine
        
        Analyzes CV-to-Job match and returns structured verdict
        
        Args:
            prompt: Complete analysis prompt (built by AnalysisEngine)
        
        Returns:
            {
                "match_score": 78,
                "ats_score": 85,
                "risk_score": 22,
                "verdict_type": "good_match",
                "top_fixes": [
                    {"title": "...", "example": "..."},
                    ...
                ],
                "strong_matches": [...],
                "missing_skills": [...],
                "action_plan": [...]
            }
        """
        
        system_prompt = """You are an expert ATS analyzer and career coach.

        You MUST return ONLY valid JSON (no markdown, no commentary).
        The JSON MUST follow the EXACT schema below and include ALL required keys.

        Scoring guidelines:
        - match_score (0-100): 80-100 strong_match, 60-79 good_match, 40-59 needs_work, <40 high_risk
        - ats_score (0-100): keyword coverage + ATS friendliness
        - risk_score (0-100): rejection risk (LOWER is better)

        Required JSON schema:
        {
        "match_score": <integer 0-100>,
        "ats_score": <integer 0-100>,
        "risk_score": <integer 0-100>,
        "verdict_type": <one of: "strong_match","good_match","needs_work","high_risk">,

        "top_fixes": [
            {"title": <string>, "example": <string>}
        ],

        "strong_matches": [<string>],
        "missing_skills": [<string>],
        "action_plan": [<string>],

        "cover_letter_preview": {
            "visible_sentences": [<string>, <string>, <string>]
        }
        }

        Rules:
        - top_fixes must contain exactly 3 items.
        - cover_letter_preview.visible_sentences must contain 5 to 10 sentences (max 10).
        - Keep sentences concise and tailored to the job.
        - Be honest but constructive; focus on actionable improvements."""

        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.3,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            
            
            # Validate and set defaults
            result.setdefault("match_score", 50)
            result.setdefault("ats_score", 50)
            result.setdefault("risk_score", 50)
            result.setdefault("verdict_type", "needs_work")
            result.setdefault("top_fixes", [])
            result.setdefault("strong_matches", [])
            result.setdefault("missing_skills", [])
            result.setdefault("action_plan", [])
            result.setdefault("cover_letter_preview", {
                "visible_sentences": [
                    "I am writing to express my strong interest in this position.",
                    "My background and experience align well with the requirements.",
                    "I am confident I can make valuable contributions to your team."
                ]
            })
            
            # Ensure top_fixes has exactly 3 items
            while len(result["top_fixes"]) < 3:
                result["top_fixes"].append({
                    "title": "Review application",
                    "example": "Carefully review all requirements"
                })
            result["top_fixes"] = result["top_fixes"][:3]
            
            return result
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse CV match analysis: {e}")
            return self._get_default_match_result()
        
        except Exception as e:
            logger.error(f"Error in analyze_cv_match: {e}")
            return self._get_default_match_result()
    
    async def generate_cover_letter(
        self,
        cv_text: str,
        job_description: str,
        job_title: str,
        company: str
    ) -> str:
        """
        Generate full cover letter (300-400 words)
        
        Args:
            cv_text: Formatted CV text
            job_description: Full JD
            job_title: Job title
            company: Company name
        
        Returns:
            Complete cover letter text
        """
        
        prompt = f"""Write a professional cover letter for this job application.

Job Title: {job_title}
Company: {company}

Job Description:
{job_description[:1000]}  # Limit to avoid token limits

Candidate CV:
{cv_text[:1500]}

Requirements:
- 300-400 words (3-4 paragraphs)
- Professional tone
- Highlight relevant skills and experience
- Show genuine interest
- Match keywords from job description
- No placeholder text like [Your Name] - write as if candidate is writing
- Use Indian English conventions

Structure:
1. Opening: Express interest and mention how you found the position
2. Body (1-2 paragraphs): Match your experience to key requirements
3. Closing: Express enthusiasm and call to action

Return ONLY the cover letter text (no JSON, no markdown).
"""
        
        system_prompt = """You are an expert cover letter writer for the Indian job market.
        Write compelling, professional cover letters that highlight relevant qualifications.
        Keep it concise but impactful."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=800,  # ~400 words
                temperature=0.7,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            letter = response.choices[0].message.content.strip()
            
            # Clean up any markdown or formatting
            letter = letter.replace("```", "").strip()
            
            return letter
            
        except Exception as e:
            logger.error(f"Error generating cover letter: {e}")
            return self._get_fallback_cover_letter(job_title, company)
    
    async def generate_interview_qa(
        self,
        cv_text: str,
        job_description: str,
        job_title: str,
        num_questions: int = 10,
        custom_questions: Optional[List[str]] = None
    ) -> List[Dict[str, str]]:
        """
        Generate interview questions with STAR-method answers
        
        Args:
            cv_text: Formatted CV
            job_description: Full JD
            job_title: Job title
            num_questions: Number of Q&A pairs (default 10)
        
        Returns:
            [
                {"question": "Tell me about...", "answer": "In my role at..."},
                ...
            ]
        """
        # 1) normalize: accept both dict and str
        normalized: list[str] = []

        for q in (custom_questions or []):
            text = None

            if isinstance(q, str):
                text = q.strip()
            elif isinstance(q, dict):
                text = str(q.get("text", "")).strip()

            if text:
                normalized.append(text)

        # 2) dedup (case-insensitive)
        seen = set()
        deduped: list[str] = []
        for q in normalized:
            key = q.lower()
            if key not in seen:
                seen.add(key)
                deduped.append(q)

        custom_questions = deduped

        # 3) targets
        custom_target = min(len(custom_questions), num_questions)
        auto_target = max(0, num_questions - custom_target)

        
        prompt = f"""Generate {num_questions} common interview questions for this job, with prepared answers based on the candidate's CV.

STRICT OUTPUT REQUIREMENTS:
- Output ONLY valid JSON (no markdown, no prose).
- The JSON must contain ONLY this top-level key: "qa_pairs".
- "qa_pairs" must be a list of EXACTLY {num_questions} objects.
- Each object MUST have exactly two string keys: "question", "answer".
- Do NOT include any extra keys.
- Do NOT include nulls.
- Do NOT repeat questions.

GROUNDING RULES (IMPORTANT):
- Answers must be grounded in the provided CV. Do NOT invent companies, roles, or achievements.
- If the CV lacks specifics, write a plausible but generic STAR answer WITHOUT fabricating facts.
- Each answer must be 80–120 words.
- Use STAR method where appropriate.

ORDER RULES:
- First {custom_target} items MUST correspond to the Custom Questions below, in the same order.
- For these custom items:
  - "question" must be EXACTLY the same text as the custom question (verbatim).
  - Provide the best possible answer based on the CV.
- Remaining {auto_target} items:
  - Generate common interview questions relevant to the job title and job description.
  - Include a mix: behavioral, technical/domain, situational, cultural fit.
  - Always include "Tell me about yourself" if it is not already in the custom questions.

JOB CONTEXT
Job Title: {job_title}

Job Description (truncated):
{job_description[:1200]}

Candidate CV (truncated):
{cv_text[:1800]}

Custom Questions (PRIORITY, use verbatim for the first {custom_target} items):
{json.dumps(custom_questions[:custom_target], ensure_ascii=False)}

Return JSON ONLY in this format:
{{
  "qa_pairs": [
    {{"question": "...", "answer": "..."}},
    ...
  ]
}}
"""
        
        system_prompt = """You are an interview preparation coach.
        Generate realistic interview questions and strong STAR-method answers.
        Answers should be specific, concise, and based on actual CV experience."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=3000,
                temperature=0.6,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
        
            content = response.choices[0].message.content
            result = json.loads(content)
            
            qa_pairs = result.get("qa_pairs", [])
            
            # Ensure we have exactly num_questions
            while len(qa_pairs) < num_questions:
                qa_pairs.append({
                    "question": "What are your strengths?",
                    "answer": "Based on my experience..."
                })
            
            return qa_pairs[:num_questions]
            
        except Exception as e:
            logger.error(f"Error generating interview Q&A: {e}")
            return self._get_fallback_qa(num_questions)
    
    async def generate_rewritten_bullets(
        self,
        cv_text: str,
        job_description: str,
        num_bullets: int = 8
    ) -> List[Dict[str, str]]:
        """
        Rewrite resume bullets with metrics and keywords
        
        Args:
            cv_text: Original CV text
            job_description: Target JD
            num_bullets: Number of bullets to generate
        
        Returns:
            [
                {
                    "original": "Managed team",
                    "rewritten": "Led 5-person engineering team to deliver $2M revenue feature, reducing deployment time by 40%"
                },
                ...
            ]
        """
        
        prompt = f"""Rewrite {num_bullets} resume bullets to be more impactful and keyword-rich.

Target Job Description:
{job_description[:800]}

Current CV:
{cv_text[:1200]}

For each bullet, provide:
1. Original version (extract from CV)
2. Improved version with:
   - Action verb start
   - Quantified metrics (numbers, %, $)
   - Relevant keywords from job description
   - Impact/result oriented
   - 15-25 words

Return ONLY valid JSON:
{{
  "bullets": [
    {{
      "original": "Managed development team",
      "rewritten": "Led 5-person engineering team to deliver $2M revenue feature, reducing deployment time by 40% through CI/CD automation"
    }},
    ...
  ]
}}
"""
        
        system_prompt = """You are a professional resume writer specializing in ATS optimization.
        Rewrite bullets to be impactful, quantified, and keyword-rich.
        Use strong action verbs and specific achievements."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=1500,
                temperature=0.4,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            
            bullets = result.get("bullets", [])
            
            # Ensure we have exactly num_bullets
            while len(bullets) < num_bullets:
                bullets.append({
                    "original": "Worked on projects",
                    "rewritten": "Contributed to high-impact projects"
                })
            
            return bullets[:num_bullets]
            
        except Exception as e:
            logger.error(f"Error generating rewritten bullets: {e}")
            return self._get_fallback_bullets(num_bullets)
    
    # ============================================
    # Fallback Methods
    # ============================================
    
    def _get_default_match_result(self) -> Dict[str, Any]:
        """Default match result on error"""
        return {
            "match_score": 50,
            "ats_score": 50,
            "risk_score": 50,
            "verdict_type": "needs_work",
            "top_fixes": [
                {
                    "title": "Review job requirements",
                    "example": "Carefully compare your experience to required skills"
                },
                {
                    "title": "Add relevant keywords",
                    "example": "Include technical terms from the job description"
                },
                {
                    "title": "Quantify achievements",
                    "example": "Add specific numbers and metrics to your experience"
                }
            ],
            "strong_matches": [],
            "missing_skills": [],
            "action_plan": [
                "Review job requirements carefully",
                "Update CV with relevant keywords",
                "Highlight matching experience"
            ]
        }
    
    def _get_fallback_cover_letter(self, job_title: str, company: str) -> str:
        """Fallback cover letter template"""
        return f"""Dear Hiring Manager,

I am writing to express my strong interest in the {job_title} position at {company}. With my background in technology and proven track record of delivering results, I am confident I can make valuable contributions to your team.

Throughout my career, I have developed strong skills in problem-solving, teamwork, and technical execution. I am particularly drawn to {company}'s commitment to innovation and excellence in the industry.

I am excited about the opportunity to bring my experience and enthusiasm to your organization. I would welcome the chance to discuss how my qualifications align with your team's needs.

Thank you for considering my application. I look forward to speaking with you soon.

Best regards"""
    
    def _get_fallback_qa(self, num_questions: int) -> List[Dict[str, str]]:
        """Fallback Q&A pairs"""
        fallback = [
            {
                "question": "Tell me about yourself.",
                "answer": "I have several years of experience in my field, with a strong background in technical skills and problem-solving. I'm passionate about continuous learning and delivering high-quality work."
            },
            {
                "question": "What are your strengths?",
                "answer": "My key strengths include technical expertise, strong communication skills, and the ability to work effectively in team environments. I'm also highly adaptable and committed to achieving results."
            },
            {
                "question": "Why do you want to work here?",
                "answer": "I'm impressed by your company's reputation in the industry and commitment to innovation. I believe my skills and experience align well with your team's goals, and I'm excited about the opportunity to contribute."
            }
        ]
        
        # Duplicate if needed
        while len(fallback) < num_questions:
            fallback.extend(fallback[:min(3, num_questions - len(fallback))])
        
        return fallback[:num_questions]
    
    def _get_fallback_bullets(self, num_bullets: int) -> List[Dict[str, str]]:
        """Fallback rewritten bullets"""
        fallback = [
            {
                "original": "Worked on projects",
                "rewritten": "Led cross-functional projects delivering measurable business impact"
            },
            {
                "original": "Managed team",
                "rewritten": "Managed team of 3-5 professionals, improving productivity by 20%"
            }
        ]
        
        # Duplicate if needed
        while len(fallback) < num_bullets:
            fallback.extend(fallback[:min(2, num_bullets - len(fallback))])
        
        return fallback[:num_bullets]
    
    # ============================================
    # Original Methods (Preserved)
    # ============================================
    
    async def parse_job_description(self, prompt: str) -> Dict[str, Any]:
        """
        Parse job description using GPT
        
        Args:
            prompt: Parsing prompt with JD text
            
        Returns:
            Parsed job data as dict
        """
        
        system_prompt = """You are an expert ATS (Applicant Tracking System) analyzer.
        Your job is to extract structured information from job descriptions for the Indian job market.
        Always return valid JSON with the exact structure requested.
        Focus on technical keywords and skills that ATS systems look for."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.3,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.choices[0].message.content
            parsed_data = json.loads(content)
            
            return parsed_data
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
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
            max_tokens: Max tokens to generate
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
                temperature=0.7,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
                
        except json.JSONDecodeError:
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
    
    async def optimize_for_ats(self, prompt: str) -> Dict[str, Any]:
        """
        Optimize resume/content for ATS
        India-specific: keyword matching focus
        
        Args:
            prompt: ATS optimization prompt
            
        Returns:
            Optimized content with ATS score
        """
        
        system_prompt = """You are an ATS optimization expert for Indian job portals.
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
                temperature=0.4,
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

    def parse_matches(self, raw):
        if raw is None:
            return []

        # 1) strip + BOM 제거
        s = raw.strip().lstrip("\ufeff")

        # 2) 제어문자 제거(탭/개행은 남김)
        s = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F]", "", s)

        # 3) 코드블록 제거
        if s.startswith("```"):
            s = re.sub(r"^```(?:json)?\s*", "", s, flags=re.IGNORECASE)
            s = re.sub(r"\s*```$", "", s)

        # 4) JSON 객체만 추출
        m = re.search(r"\{[\s\S]*\}", s)
        if not m:
            raise ValueError(f"No JSON object found. Head={repr(s[:120])}")

        json_str = m.group(0)

        # 5) 파싱
        obj = json.loads(json_str)
        return obj.get("matches", [])

    
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
            matches = result["matches"]
            
           
            return matches
            
        except Exception as e:
            logger.error(f"Error matching experiences: {e}")
            return [
                {
                    "experience_id": exp["id"],
                    "relevance_score": 0.5,
                    "matching_skills": [],
                    "relevant_achievements": []
                }
                for exp in experiences
            ]
    
    async def build_candidate_profile(
        self,
        experiences: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Build candidate profile from experiences
        
        Args:
            experiences: List of experience dicts
        
        Returns:
            {
                "skills": [...],
                "experience_years": 5,
                "education": "...",
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
            
            # Validate structure
            result.setdefault("skills", [])
            result.setdefault("experience_years", 0)
            result.setdefault("education", None)
            result.setdefault("work_history", [])
            
            if not isinstance(result["skills"], list):
                result["skills"] = []
            if not isinstance(result["work_history"], list):
                result["work_history"] = []
            
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
        
        prompt = f"""Assess the risk of submitting this job application.

        Job Requirements:
        {json.dumps(job_data, indent=2)}

        Application Content:
        {json.dumps(application_data, indent=2)}

        Check for:
        1. Missing required information
        2. Answers that don't address questions
        3. Length violations
        4. Inconsistencies
        5. Weak content
        6. Major errors

        Return JSON:
        {{
        "risk_score": 0-100,
        "risk_factors": [...],
        "validation_passed": true/false,
        "recommendations": [...]
        }}
        """
        
        system_prompt = """You are a quality control expert for job applications.
        Identify risks that could lead to rejection.
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
                "recommendations": ["Manual review recommended"]
            }
    
    async def analyze_jd_match(
        self,
        job_description: str, 
        user_cv: str, 
        job_metadata: Dict,
        user: User
    ) -> Dict:
        """
        Analyze job match (original method)
        """
        
        user_profile = {
            "all_skills": user.all_skills,
            "certifications": [c.get("name") for c in user.certifications],
            "experiences": [
                {
                    "title": exp.title,
                    "company": exp.organization,
                    "duration_months": exp.duration_months,
                    "key_skills": exp.skills_used
                }
                for exp in user.experiences
            ]
        }
        
        prompt = f"""
        Analyze job match for this candidate.
        
        Job Requirements:
        {job_description}
        
        Required Skills: {', '.join(job_metadata.get('required_skills', []))}
        Preferred Skills: {', '.join(job_metadata.get('preferred_skills', []))}
        
        Candidate Profile:
        Skills: {', '.join(user_cv.get('skills', []))}
        Experience: {user_cv.get('experience_years', 0)} years
        
        Work History:
        {self._format_work_history(user_cv.get('work_history', []))}
        
        User Profile: {json.dumps(user_profile, indent=2)}
        
        Return JSON with match analysis.
        """
        
        system_prompt = """You are an ATS analyzer.
        Provide accurate match assessments.
        Always return valid JSON."""
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.3,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ]
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            
            # Validate
            if "match_score" not in result:
                result["match_score"] = 50.0
            if "ats_score" not in result:
                result["ats_score"] = 50.0
            
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing JD match: {e}")
            return self._get_empty_match_analysis()
    
    # ============================================
    # Helper Methods
    # ============================================
    
    def _build_profile_prompt(self, experiences: List[Dict[str, Any]]) -> str:
        """Build profile prompt"""
        experiences_json = json.dumps(experiences, ensure_ascii=False, indent=2)
        
        return f"""
        Transform this experience data into structured profile:
        
        {experiences_json}
        
        Return JSON:
        {{
          "skills": [...],
          "experience_years": number,
          "education": string | null,
          "work_history": [...]
        }}
        """.strip()
    
    def _build_matching_prompt(
        self,
        job_requirements: Dict[str, Any],
        experiences: List[Dict[str, Any]]
    ) -> str:
        exp_text = "\n\n".join([
            f"Experience {exp['id']}:\n"
            f"Title: {exp['title']}\n"
            f"Skills: {', '.join(exp.get('skills_used', []))}"
            for exp in experiences
        ])

        return f"""
        You are an expert recruiter.

        Match EACH experience to the job requirements.

        Job:
        - Title: {job_requirements['title']}
        - Required Skills: {', '.join(job_requirements.get('required_skills', []))}
        - Preferred Skills: {', '.join(job_requirements.get('preferred_skills', []))}
        - Key Responsibilities: {', '.join(job_requirements.get('key_responsibilities', []))}

        Scoring rules:
        - relevance_score is between 0.0 and 1.0
        - 1.0 = strong direct match; 0.0 = no match

        Experiences:
        {exp_text}

        Return ONLY valid JSON (no markdown, no extra text) with EXACT keys:

        {{
        "matches": [
            {{
            "experience_id": <integer>,
            "relevance_score": <float>,
            "matching_skills": <list of strings>,
            "relevant_achievements": <list of strings>
            }}
        ]
        }}
        """

    
    def _format_work_history(self, work_history: List[Dict[str, Any]]) -> str:
        """Format work history"""
        if not work_history:
            return "No work history"
        
        formatted = []
        for job in work_history[:3]:
            title = job.get('title', 'Unknown')
            company = job.get('company', 'Unknown')
            formatted.append(f"{title} at {company}")
        
        return "\n".join(formatted)
    
    def _get_empty_jd_structure(self) -> Dict[str, Any]:
        """Empty JD structure"""
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
    
    def _get_empty_match_analysis(self) -> Dict[str, Any]:
        """Empty match analysis"""
        return {
            "match_score": 50.0,
            "ats_score": 50.0,
            "gaps": [],
            "strengths": [],
            "tips": ["Unable to complete analysis"],
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


# Backward compatibility
AnthropicService = OpenAIService


async def analyze_jd_match(
    job_description: str,
    user_cv: Dict[str, Any],
    job_metadata: Dict[str, Any],
    user: User
) -> Dict[str, Any]:
    """Module-level function for backward compatibility"""
    service = OpenAIService()
    return await service.analyze_jd_match(job_description, user_cv, job_metadata, user)