"""
ATS Optimization Service
India-specific: Focus on keyword matching and ATS score
"""

from typing import Dict, List, Any
import re
from collections import Counter

from app.services.openai_service import OpenAIService


class ATSOptimizer:
    """
    Optimize resume/application for ATS (Applicant Tracking System)
    India market priority: Speed > Perfection
    """
    
    def __init__(self):
        self.openai = OpenAIService()
    
    async def optimize_resume(
        self,
        base_resume: str,
        jd_keywords: List[str],
        job_title: str = None
    ) -> Dict[str, Any]:
        """
        Optimize resume for specific job's ATS
        
        Args:
            base_resume: User's original resume text
            jd_keywords: Keywords extracted from JD
            job_title: Job title for context
            
        Returns:
            {
                "optimized_resume": "...",
                "ats_score": 85,
                "matched_keywords": ["python", "aws"],
                "missing_keywords": ["kubernetes"],
                "suggestions": ["Add more project details"]
            }
        """
        
        # Calculate initial ATS score
        initial_score = self._calculate_ats_score(base_resume, jd_keywords)
        
        # If score is already good, return as-is
        if initial_score >= 80:
            return {
                "optimized_resume": base_resume,
                "ats_score": initial_score,
                "matched_keywords": self._extract_matched_keywords(base_resume, jd_keywords),
                "missing_keywords": [],
                "suggestions": []
            }
        
        # Use Claude to optimize
        prompt = self._build_ats_prompt(base_resume, jd_keywords, job_title)
        
        try:
            result = await self.openai.optimize_for_ats(prompt)
            
            # Calculate new score
            new_score = self._calculate_ats_score(
                result.get("optimized_resume", base_resume),
                jd_keywords
            )
            
            return {
                "optimized_resume": result.get("optimized_resume", base_resume),
                "ats_score": new_score,
                "matched_keywords": result.get("matched_keywords", []),
                "missing_keywords": result.get("missing_keywords", []),
                "suggestions": result.get("suggestions", [])
            }
            
        except Exception as e:
            # Fallback: Simple keyword injection
            optimized = self._simple_keyword_optimization(base_resume, jd_keywords)
            new_score = self._calculate_ats_score(optimized, jd_keywords)
            
            return {
                "optimized_resume": optimized,
                "ats_score": new_score,
                "matched_keywords": self._extract_matched_keywords(optimized, jd_keywords),
                "missing_keywords": [],
                "suggestions": ["Auto-optimized with keyword matching"]
            }
    
    def _calculate_ats_score(self, resume_text: str, jd_keywords: List[str]) -> int:
        """
        Calculate ATS score (0-100)
        Simple but effective for India market
        """
        
        if not jd_keywords:
            return 50  # Default neutral score
        
        resume_lower = resume_text.lower()
        matched = sum(1 for kw in jd_keywords if kw.lower() in resume_lower)
        
        # Base score from keyword matching
        keyword_score = (matched / len(jd_keywords)) * 60
        
        # Bonus points for good practices
        bonus = 0
        
        # Has quantifiable achievements (numbers)
        if re.search(r'\d+%|\d+\s*(years?|months?|projects?|users?|customers?)', resume_text):
            bonus += 10
        
        # Has action verbs
        action_verbs = ['led', 'managed', 'developed', 'implemented', 'achieved', 'improved']
        if any(verb in resume_lower for verb in action_verbs):
            bonus += 10
        
        # Has education section
        if re.search(r'(bachelor|master|b\.?tech|m\.?tech|diploma)', resume_lower, re.IGNORECASE):
            bonus += 10
        
        # Has contact info
        if re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text):  # Email
            bonus += 5
        
        if re.search(r'[\+\d\-\(\)\s]{10,}', resume_text):  # Phone
            bonus += 5
        
        total_score = min(100, int(keyword_score + bonus))
        
        return total_score
    
    def _extract_matched_keywords(self, text: str, keywords: List[str]) -> List[str]:
        """Extract which keywords are present in text"""
        text_lower = text.lower()
        return [kw for kw in keywords if kw.lower() in text_lower]
    
    def _simple_keyword_optimization(self, resume: str, keywords: List[str]) -> str:
        """
        Simple keyword injection when AI fails
        India market: This is acceptable and expected
        """
        
        # Find skills section
        skills_match = re.search(
            r'(skills?|technical skills?|expertise)[\s\S]{0,200}',
            resume,
            re.IGNORECASE
        )
        
        if skills_match:
            # Add missing keywords to skills section
            missing = [kw for kw in keywords if kw.lower() not in resume.lower()]
            
            if missing:
                insertion_point = skills_match.end()
                skills_addition = ", " + ", ".join(missing[:10])  # Add up to 10 keywords
                
                optimized = (
                    resume[:insertion_point] +
                    skills_addition +
                    resume[insertion_point:]
                )
                
                return optimized
        
        return resume
    
    def _build_ats_prompt(
        self,
        resume: str,
        keywords: List[str],
        job_title: str = None
    ) -> str:
        """Build prompt for Claude to optimize resume"""
        
        title_context = f" for {job_title}" if job_title else ""
        
        prompt = f"""Optimize this resume{title_context} for ATS (Applicant Tracking System).

Original Resume:
{resume}

Target Keywords (must include):
{', '.join(keywords)}

Instructions:
1. Integrate keywords NATURALLY into existing content
2. Don't fabricate experience - only enhance wording
3. Add keywords to skills section if not present
4. Use action verbs (led, managed, developed, achieved)
5. Include quantifiable metrics where possible
6. Maintain Indian English conventions
7. Keep it concise (1-2 pages max)

Return JSON:
{{
  "optimized_resume": "Enhanced resume text here",
  "matched_keywords": ["keyword1", "keyword2"],
  "missing_keywords": ["keyword3"],
  "suggestions": ["Add more project details", "Quantify achievements"]
}}

Focus: Make it ATS-friendly, not perfect. Speed matters for Indian job market.
"""
        
        return prompt
    
    async def generate_ats_answers(
        self,
        questions: List[Dict[str, str]],
        jd_keywords: List[str],
        user_resume: str
    ) -> Dict[str, str]:
        """
        Generate ATS-optimized answers for application questions
        India-specific: Fast, keyword-rich, minimal fluff
        """
        
        answers = {}
        
        for q in questions:
            question_text = q.get('text', '')
            question_id = q.get('id', '')
            
            # Simple keyword-based answer generation
            answer = await self._generate_quick_answer(
                question=question_text,
                keywords=jd_keywords,
                resume=user_resume
            )
            
            answers[question_id] = answer
        
        return answers
    
    async def _generate_quick_answer(
        self,
        question: str,
        keywords: List[str],
        resume: str
    ) -> str:
        """
        Generate quick, keyword-rich answer
        No need for extensive evidence - just hit keywords
        """
        
        # Check question type
        if any(word in question.lower() for word in ['why', 'motivation', 'interest']):
            # Why this company/role question
            answer = self._generate_motivation_answer(keywords)
        
        elif any(word in question.lower() for word in ['experience', 'project', 'worked']):
            # Experience question
            answer = self._generate_experience_answer(keywords, resume)
        
        elif any(word in question.lower() for word in ['skills', 'technical', 'proficient']):
            # Skills question
            answer = self._generate_skills_answer(keywords, resume)
        
        else:
            # Generic answer
            answer = self._generate_generic_answer(question, keywords, resume)
        
        return answer
    
    def _generate_motivation_answer(self, keywords: List[str]) -> str:
        """Quick motivation answer with keywords"""
        
        top_keywords = keywords[:3] if len(keywords) >= 3 else keywords
        
        return f"""I am excited about this opportunity because it aligns perfectly with my skills in {', '.join(top_keywords)}. I have hands-on experience with these technologies and am eager to contribute to challenging projects. I am a quick learner and team player who thrives in fast-paced environments."""
    
    def _generate_experience_answer(self, keywords: List[str], resume: str) -> str:
        """Quick experience answer"""
        
        # Extract a relevant sentence from resume
        relevant = self._find_relevant_experience(resume, keywords)
        
        if relevant:
            return relevant + f" I have worked extensively with {', '.join(keywords[:3])} and delivered successful projects."
        else:
            return f"I have experience working with {', '.join(keywords[:3])} in various projects. I have successfully delivered solutions and collaborated with cross-functional teams."
    
    def _generate_skills_answer(self, keywords: List[str], resume: str) -> str:
        """Quick skills answer"""
        
        return f"I am proficient in {', '.join(keywords)}. I have practical experience applying these skills in real-world projects and continuously stay updated with latest developments."
    
    def _generate_generic_answer(self, question: str, keywords: List[str], resume: str) -> str:
        """Generic answer for any question"""
        
        return f"Based on my experience with {', '.join(keywords[:3])}, I believe I am well-suited for this role. I have demonstrated ability to deliver results and adapt to new challenges."
    
    def _find_relevant_experience(self, resume: str, keywords: List[str]) -> str:
        """Find most relevant sentence from resume"""
        
        sentences = re.split(r'[.!?]\s+', resume)
        
        # Score each sentence by keyword matches
        scored = []
        for sentence in sentences:
            score = sum(1 for kw in keywords if kw.lower() in sentence.lower())
            if score > 0 and len(sentence) > 50:  # Substantial sentence
                scored.append((score, sentence))
        
        if scored:
            scored.sort(reverse=True)
            return scored[0][1]  # Return highest scoring sentence
        
        return ""


class KeywordExtractor:
    """
    Extract relevant keywords from JD
    India-specific: Focus on technical skills
    """
    
    @staticmethod
    def extract_keywords(jd_text: str, limit: int = 20) -> List[str]:
        """
        Extract top keywords from JD
        """
        
        # Common technical keywords
        tech_patterns = [
            # Programming languages
            r'\b(Java|Python|JavaScript|TypeScript|C\+\+|C#|PHP|Ruby|Go|Rust|Kotlin|Swift)\b',
            
            # Web technologies
            r'\b(React|Angular|Vue|Node\.js|Express|Django|Flask|Spring|ASP\.NET)\b',
            
            # Databases
            r'\b(MySQL|PostgreSQL|MongoDB|Redis|Oracle|SQL Server|DynamoDB)\b',
            
            # Cloud & DevOps
            r'\b(AWS|Azure|GCP|Docker|Kubernetes|Jenkins|CI/CD|Terraform)\b',
            
            # Data & ML
            r'\b(Machine Learning|Deep Learning|AI|Data Science|TensorFlow|PyTorch|Pandas|NumPy)\b',
            
            # Mobile
            r'\b(Android|iOS|React Native|Flutter)\b',
            
            # Other
            r'\b(Git|REST API|GraphQL|Microservices|Agile|Scrum)\b'
        ]
        
        keywords = []
        
        for pattern in tech_patterns:
            matches = re.findall(pattern, jd_text, re.IGNORECASE)
            keywords.extend([m.lower() for m in matches])
        
        # Remove duplicates and get top N by frequency
        counter = Counter(keywords)
        top_keywords = [kw for kw, count in counter.most_common(limit)]
        
        return top_keywords