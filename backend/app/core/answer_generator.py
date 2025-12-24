"""
Answer Generator - generates tailored answers to application questions
Uses Claude API and matches with user's experience
"""

from typing import List, Dict, Optional, Any
import logging

from app.services.openai_service import AnthropicService
from app.models.experience import Experience, ExperienceMatch

logger = logging.getLogger(__name__)


class AnswerGenerator:
    """
    Generates tailored answers to job application questions
    """
    
    def __init__(self):
        self.anthropic = AnthropicService()
    
    async def generate_answer(
        self,
        question: str,
        question_type: str,
        job_context: Dict[str, Any],
        matched_experiences: List[ExperienceMatch],
        word_limit: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate tailored answer to a question
        
        Args:
            question: The application question
            question_type: short_text, long_text, etc.
            job_context: Job details (title, company, JD, etc.)
            matched_experiences: Relevant experiences
            word_limit: Optional word limit for answer
            
        Returns:
            {
                "answer": "Generated answer text",
                "evidence": ["bullet1", "bullet2"],
                "experiences_used": [exp_id1, exp_id2],
                "confidence": 0.85
            }
        """
        
        prompt = self._build_answer_prompt(
            question=question,
            question_type=question_type,
            job_context=job_context,
            experiences=matched_experiences,
            word_limit=word_limit
        )
        
        try:
            result = await self.anthropic.generate_answer(prompt)
            
            # Extract experience IDs used
            exp_ids = [exp.experience_id for exp in matched_experiences]
            
            return {
                "answer": result["answer"],
                "evidence": result.get("evidence", []),
                "experiences_used": exp_ids[:3],  # Top 3 most relevant
                "confidence": result.get("confidence", 0.8)
            }
            
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            raise
    
    async def generate_cover_letter(
        self,
        job_context: Dict[str, Any],
        user_profile: Dict[str, Any],
        matched_experiences: List[ExperienceMatch]
    ) -> str:
        """
        Generate tailored cover letter
        
        Args:
            job_context: Job details
            user_profile: User's basic info
            matched_experiences: Relevant experiences
            
        Returns:
            Cover letter text
        """
        
        prompt = self._build_cover_letter_prompt(
            job_context=job_context,
            user_profile=user_profile,
            experiences=matched_experiences
        )
        
        try:
            cover_letter = await self.anthropic.generate_cover_letter(prompt)
            return cover_letter
            
        except Exception as e:
            logger.error(f"Error generating cover letter: {e}")
            raise
    
    def _build_answer_prompt(
        self,
        question: str,
        question_type: str,
        job_context: Dict[str, Any],
        experiences: List[ExperienceMatch],
        word_limit: Optional[int] = None
    ) -> str:
        """
        Build prompt for answer generation
        """
        
        # Format experiences
        exp_text = "\n\n".join([
            f"Experience {i+1}: {exp.title} at {exp.organization}\n" +
            f"Relevant skills: {', '.join(exp.matching_skills)}\n" +
            f"Achievements:\n" + 
            "\n".join([f"- {ach}" for ach in exp.relevant_achievements[:3]])
            for i, exp in enumerate(experiences[:3])
        ])
        
        prompt = f"""You are helping a UK job applicant answer an application question.

Job: {job_context.get('title', 'N/A')} at {job_context.get('company', 'N/A')}

Question: {question}
Question Type: {question_type}
{f'Word Limit: {word_limit} words' if word_limit else 'Word Limit: None'}

Candidate's Relevant Experience:
{exp_text if exp_text else "No specific experience provided"}

Instructions:
1. Write a compelling, specific answer that directly addresses the question
2. Use concrete examples and metrics from the candidate's experience
3. Match the company's culture and values (if mentioned in JD)
4. Be authentic and avoid clichés
5. Use British English spelling and conventions
6. {f'Keep within {word_limit} words' if word_limit else 'Aim for 100-200 words for short answers, 300-500 for long answers'}

Provide your response in JSON format:
{{
  "answer": "Your generated answer here",
  "evidence": ["Key achievement 1", "Key achievement 2"],
  "confidence": 0.85
}}

The answer should:
- Start strong with a direct response
- Include specific examples with metrics where possible
- Show genuine interest in the role
- End with forward-looking statement
"""
        
        return prompt
    
    def _build_cover_letter_prompt(
        self,
        job_context: Dict[str, Any],
        user_profile: Dict[str, Any],
        experiences: List[ExperienceMatch]
    ) -> str:
        """
        Build prompt for cover letter generation
        """
        
        # Format experiences
        exp_text = "\n\n".join([
            f"{exp.title} at {exp.organization}\n" +
            f"Relevant skills: {', '.join(exp.matching_skills)}\n" +
            f"Key achievements:\n" + 
            "\n".join([f"- {ach}" for ach in exp.relevant_achievements[:3]])
            for exp in experiences[:3]
        ])
        
        prompt = f"""Write a compelling cover letter for a UK job application.

Job Details:
- Title: {job_context.get('title')}
- Company: {job_context.get('company')}
- Location: {job_context.get('location', 'UK')}

Key Requirements:
{chr(10).join([f"- {skill}" for skill in job_context.get('required_skills', [])[:5]])}

Candidate Profile:
- Name: {user_profile.get('full_name')}
- Location: {user_profile.get('location', 'UK')}

Relevant Experience:
{exp_text}

Instructions:
1. Write a professional UK-style cover letter (no more than 1 page)
2. Structure: Opening (why you're excited) → Body (3-4 key points with evidence) → Closing
3. Match specific requirements to candidate's experience
4. Show genuine enthusiasm for the role and company
5. Use British English spelling and professional tone
6. Avoid generic phrases - be specific and authentic
7. Include metrics and concrete achievements
8. Keep paragraphs concise (3-4 sentences max)

Format:
Dear Hiring Manager,

[Your cover letter here]

Yours sincerely,
{user_profile.get('full_name')}
"""
        
        return prompt
    
    async def batch_generate_answers(
        self,
        questions: List[Dict[str, Any]],
        job_context: Dict[str, Any],
        matched_experiences: List[ExperienceMatch]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Generate answers for multiple questions in batch
        
        Args:
            questions: List of {id, text, type, word_limit}
            job_context: Job details
            matched_experiences: Relevant experiences
            
        Returns:
            Dict mapping question IDs to answers
        """
        
        results = {}
        
        for question in questions:
            try:
                answer = await self.generate_answer(
                    question=question["text"],
                    question_type=question["type"],
                    job_context=job_context,
                    matched_experiences=matched_experiences,
                    word_limit=question.get("word_limit")
                )
                results[question["id"]] = answer
                
            except Exception as e:
                logger.error(f"Error generating answer for question {question['id']}: {e}")
                results[question["id"]] = {
                    "answer": "",
                    "error": str(e),
                    "confidence": 0.0
                }
        
        return results


class AnswerOptimizer:
    """
    Optimizes and refines generated answers
    """
    
    @staticmethod
    def check_word_count(text: str, limit: int) -> Dict[str, Any]:
        """
        Check if text is within word limit
        """
        word_count = len(text.split())
        
        return {
            "word_count": word_count,
            "limit": limit,
            "within_limit": word_count <= limit,
            "excess": max(0, word_count - limit)
        }
    
    @staticmethod
    def check_character_count(text: str, limit: int) -> Dict[str, Any]:
        """
        Check if text is within character limit
        """
        char_count = len(text)
        
        return {
            "character_count": char_count,
            "limit": limit,
            "within_limit": char_count <= limit,
            "excess": max(0, char_count - limit)
        }
    
    @staticmethod
    def suggest_improvements(answer: str) -> List[str]:
        """
        Suggest improvements to answer
        """
        suggestions = []
        
        # Check for weak opening
        weak_starts = ["I am", "I would", "I think", "I believe", "In my opinion"]
        if any(answer.startswith(start) for start in weak_starts):
            suggestions.append("Consider starting with a stronger, more direct statement")
        
        # Check for metrics
        has_numbers = any(char.isdigit() for char in answer)
        if not has_numbers:
            suggestions.append("Consider adding specific metrics or numbers to strengthen your answer")
        
        # Check for passive voice (basic)
        if " was " in answer or " were " in answer or " been " in answer:
            suggestions.append("Consider using active voice for stronger impact")
        
        # Check length
        word_count = len(answer.split())
        if word_count < 50:
            suggestions.append("Answer may be too brief - consider adding more detail")
        elif word_count > 300:
            suggestions.append("Answer may be too long - consider being more concise")
        
        return suggestions
