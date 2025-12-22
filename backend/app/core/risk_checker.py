"""
Risk Checker - Validate applications before submission
Identifies potential issues that could lead to rejection
"""

from typing import Dict, List, Any
import re
import logging

from app.models import Application, Job

logger = logging.getLogger(__name__)


class RiskChecker:
    """
    Assesses risk of application submission
    Returns risk score (0-100) and list of issues
    """
    
    def assess_application(
        self,
        application: Application,
        job: Job
    ) -> Dict[str, Any]:
        """
        Comprehensive risk assessment
        
        Args:
            application: Application object with answers
            job: Job object with requirements
            
        Returns:
            {
                "risk_score": 0-100,
                "risk_factors": [{"type": "...", "severity": "...", "description": "..."}],
                "validation_passed": bool,
                "recommendations": ["..."]
            }
        """
        
        risk_factors = []
        recommendations = []
        
        # Check 1: Missing required fields
        missing_fields = self._check_missing_fields(application, job)
        if missing_fields:
            risk_factors.append({
                "type": "missing_required",
                "severity": "high",
                "description": f"Missing required fields: {', '.join(missing_fields)}"
            })
            recommendations.append(f"Add {', '.join(missing_fields)}")
        
        # Check 2: Cover letter requirement
        if job.requires_cover_letter and not application.cover_letter:
            risk_factors.append({
                "type": "missing_cover_letter",
                "severity": "high",
                "description": "Cover letter is required but missing"
            })
            recommendations.append("Write a cover letter")
        
        # Check 3: Answer quality
        weak_answers = self._check_answer_quality(application)
        if weak_answers:
            risk_factors.append({
                "type": "weak_answers",
                "severity": "medium",
                "description": f"{len(weak_answers)} answers need improvement"
            })
            recommendations.append("Improve answer quality")
        
        # Check 4: Answer length
        length_issues = self._check_answer_length(application, job)
        if length_issues:
            risk_factors.append({
                "type": "length_violation",
                "severity": "medium",
                "description": f"{len(length_issues)} answers have length issues"
            })
            recommendations.append("Adjust answer lengths")
        
        # Check 5: Consistency
        inconsistencies = self._check_consistency(application)
        if inconsistencies:
            risk_factors.append({
                "type": "inconsistency",
                "severity": "low",
                "description": "Some inconsistencies detected"
            })
            recommendations.append("Review for consistency")
        
        # Check 6: Spelling and grammar (basic)
        grammar_issues = self._check_basic_grammar(application)
        if grammar_issues > 3:
            risk_factors.append({
                "type": "grammar_errors",
                "severity": "low",
                "description": f"Approximately {grammar_issues} potential grammar issues"
            })
            recommendations.append("Proofread answers")
        
        # Calculate risk score
        risk_score = self._calculate_risk_score(risk_factors)
        
        # Validation passes if risk score < 50
        validation_passed = risk_score < 50
        
        return {
            "risk_score": risk_score,
            "risk_factors": risk_factors,
            "validation_passed": validation_passed,
            "recommendations": recommendations
        }
    
    def _check_missing_fields(
        self,
        application: Application,
        job: Job
    ) -> List[str]:
        """Check for missing required fields"""
        
        missing = []
        
        # Check if custom questions are answered
        if job.custom_questions:
            answered_questions = set(application.answers.keys())
            required_questions = {q.get("id") for q in job.custom_questions if q.get("required", False)}
            
            missing_questions = required_questions - answered_questions
            if missing_questions:
                missing.append("required questions")
        
        return missing
    
    def _check_answer_quality(self, application: Application) -> List[str]:
        """Check answer quality (basic heuristics)"""
        
        weak_answers = []
        
        for question_id, answer in application.answers.items():
            if not answer or len(answer.strip()) < 20:
                weak_answers.append(question_id)
                continue
            
            # Check for generic/weak openings
            weak_starts = [
                "i am writing to",
                "i would like to",
                "i am interested in",
                "i believe i am",
                "in my opinion"
            ]
            
            if any(answer.lower().startswith(start) for start in weak_starts):
                weak_answers.append(question_id)
                continue
            
            # Check for lack of specifics (no numbers/metrics)
            if not any(char.isdigit() for char in answer):
                weak_answers.append(question_id)
        
        return weak_answers
    
    def _check_answer_length(
        self,
        application: Application,
        job: Job
    ) -> List[Dict[str, Any]]:
        """Check if answers violate length limits"""
        
        issues = []
        
        for question_id, answer in application.answers.items():
            word_count = len(answer.split())
            
            # Find question in job.custom_questions
            question = next(
                (q for q in job.custom_questions if q.get("id") == question_id),
                None
            )
            
            if not question:
                continue
            
            word_limit = question.get("word_limit")
            if word_limit and word_count > word_limit:
                issues.append({
                    "question_id": question_id,
                    "word_count": word_count,
                    "limit": word_limit,
                    "excess": word_count - word_limit
                })
        
        return issues
    
    def _check_consistency(self, application: Application) -> List[str]:
        """Check for inconsistencies in answers"""
        
        inconsistencies = []
        
        # Basic check: Look for contradictory statements
        # This is simplified - real implementation would be more sophisticated
        
        all_text = " ".join(application.answers.values())
        
        # Check for contradictory years
        years = re.findall(r'\b(19|20)\d{2}\b', all_text)
        if len(set(years)) > 5:  # Too many different years mentioned
            inconsistencies.append("Multiple years mentioned - verify timeline")
        
        return inconsistencies
    
    def _check_basic_grammar(self, application: Application) -> int:
        """Basic grammar check (count potential issues)"""
        
        issues = 0
        
        for answer in application.answers.values():
            # Check for double spaces
            if '  ' in answer:
                issues += 1
            
            # Check for lowercase i
            if ' i ' in answer.lower():
                issues += answer.lower().count(' i ')
            
            # Check for missing capitalization at start of sentences
            sentences = answer.split('. ')
            for sentence in sentences[1:]:  # Skip first
                if sentence and sentence[0].islower():
                    issues += 1
            
            # Check for repeated words
            words = answer.lower().split()
            for i in range(len(words) - 1):
                if words[i] == words[i + 1]:
                    issues += 1
        
        return issues
    
    def _calculate_risk_score(self, risk_factors: List[Dict[str, Any]]) -> int:
        """
        Calculate overall risk score from factors
        0 = no risk, 100 = maximum risk
        """
        
        severity_weights = {
            "high": 30,
            "medium": 15,
            "low": 5
        }
        
        total_score = 0
        for factor in risk_factors:
            severity = factor.get("severity", "low")
            total_score += severity_weights.get(severity, 5)
        
        # Cap at 100
        return min(total_score, 100)
    
    def quick_check(self, application: Application) -> bool:
        """
        Quick validation - just check critical issues
        Returns True if OK to submit, False otherwise
        """
        
        # Must have at least one answer
        if not application.answers:
            return False
        
        # All answers must be non-empty
        for answer in application.answers.values():
            if not answer or len(answer.strip()) < 10:
                return False
        
        return True


def get_risk_level(score: int) -> str:
    """Convert risk score to level"""
    if score < 30:
        return "low"
    elif score < 60:
        return "medium"
    else:
        return "high"