"""
Automation API Router - ATS Portal Auto-fill and Submission
Handles form detection, mapping, validation, and risk assessment
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Optional, Any
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.models import User, Application, Job
from app.core.risk_checker import RiskChecker
from app.api.auth import get_current_user

router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class PortalDetectionRequest(BaseModel):
    """Request to detect ATS portal type"""
    url: str
    html_snippet: Optional[str] = None
    form_classes: List[str] = []
    form_ids: List[str] = []


class PortalDetectionResponse(BaseModel):
    """Response with detected portal information"""
    portal_type: str  # workday, greenhouse, lever, taleo, icims, bamboohr, custom
    confidence: float  # 0.0 - 1.0
    detected_features: List[str]
    recommendations: List[str]
    supports_autofill: bool


class FormField(BaseModel):
    """Individual form field"""
    field_id: str
    field_name: str
    field_type: str  # text, textarea, select, radio, checkbox, file
    label: str
    required: bool
    options: Optional[List[str]] = None  # For select/radio
    current_value: Optional[str] = None
    placeholder: Optional[str] = None


class FormStructureRequest(BaseModel):
    """Request to analyze form structure"""
    url: str
    portal_type: str
    fields: List[FormField]


class FormStructureResponse(BaseModel):
    """Response with analyzed form structure"""
    total_fields: int
    required_fields: int
    optional_fields: int
    field_categories: Dict[str, List[str]]  # {category: [field_ids]}
    completion_estimate: str  # "2-3 minutes"


class AnswerMapping(BaseModel):
    """Mapping of application answers to form fields"""
    field_id: str
    answer_source: str  # cover_letter, answer_1, experience_title, etc.
    mapped_value: str
    confidence: float


class FormMappingRequest(BaseModel):
    """Request to map application data to form fields"""
    application_id: int
    fields: List[FormField]


class FormMappingResponse(BaseModel):
    """Response with field mappings"""
    mappings: List[AnswerMapping]
    unmapped_fields: List[str]
    coverage: float  # Percentage of fields mapped
    ready_to_submit: bool


class RiskAssessmentRequest(BaseModel):
    """Request for submission risk assessment"""
    application_id: int
    portal_type: str
    mappings: List[AnswerMapping]
    fields: List[FormField]


class RiskFactor(BaseModel):
    """Individual risk factor"""
    severity: str  # low, medium, high, critical
    category: str  # missing_required, field_mismatch, validation_error, etc.
    field_id: Optional[str] = None
    description: str
    recommendation: str


class RiskAssessmentResponse(BaseModel):
    """Response with risk assessment"""
    overall_risk: str  # low, medium, high, critical
    risk_score: int  # 0-100
    risk_factors: List[RiskFactor]
    can_proceed: bool
    requires_review: List[str]  # Field IDs requiring manual review
    estimated_success_rate: float


class AutofillRequest(BaseModel):
    """Request to generate autofill data"""
    application_id: int
    portal_type: str
    fields: List[FormField]


class AutofillResponse(BaseModel):
    """Response with autofill data for extension"""
    application_id: int
    portal_type: str
    field_values: Dict[str, str]  # {field_id: value}
    file_uploads: Dict[str, str]  # {field_id: file_path}
    risk_assessment: RiskAssessmentResponse
    validation_rules: Dict[str, Any]  # Additional validation rules


# ============================================================================
# Portal Detection
# ============================================================================

PORTAL_SIGNATURES = {
    "workday": {
        "url_patterns": ["myworkdayjobs.com", "wd1.myworkdayjobs.com", "wd5.myworkdayjobs.com"],
        "class_patterns": ["workday", "wd-", "WORKDAY"],
        "id_patterns": ["wd-", "workday"],
        "features": ["Workday logo", "wd-commands", "wd-content"]
    },
    "greenhouse": {
        "url_patterns": ["greenhouse.io", "boards.greenhouse.io"],
        "class_patterns": ["greenhouse", "application-form"],
        "id_patterns": ["greenhouse"],
        "features": ["Powered by Greenhouse", "application_form"]
    },
    "lever": {
        "url_patterns": ["lever.co", "jobs.lever.co"],
        "class_patterns": ["lever-", "application"],
        "id_patterns": ["lever"],
        "features": ["Lever logo", "application-card"]
    },
    "taleo": {
        "url_patterns": ["taleo.net", "tbe.taleo.net"],
        "class_patterns": ["taleo", "ftl-"],
        "id_patterns": ["taleo"],
        "features": ["Oracle Taleo", "requisitionDescriptionInterface"]
    },
    "icims": {
        "url_patterns": ["icims.com", "careers.icims.com"],
        "class_patterns": ["icims", "iCIMS"],
        "id_patterns": ["icims"],
        "features": ["iCIMS", "job-description"]
    },
    "bamboohr": {
        "url_patterns": ["bamboohr.com", "careers-page.bamboohr.com"],
        "class_patterns": ["bamboo", "BambooHR"],
        "id_patterns": ["bamboo"],
        "features": ["BambooHR", "careers-page"]
    }
}


@router.post("/detect-portal", response_model=PortalDetectionResponse)
async def detect_portal(
    request: PortalDetectionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Detect ATS portal type from URL and page structure
    Used by Chrome Extension to identify the portal
    """
    url = request.url.lower()
    detected_features = []
    scores = {}
    
    for portal_name, signatures in PORTAL_SIGNATURES.items():
        score = 0
        
        # Check URL patterns
        for pattern in signatures["url_patterns"]:
            if pattern in url:
                score += 40
                detected_features.append(f"URL matches {portal_name}")
        
        # Check class patterns
        for pattern in signatures["class_patterns"]:
            if any(pattern.lower() in cls.lower() for cls in request.form_classes):
                score += 20
                detected_features.append(f"Class pattern matches {portal_name}")
        
        # Check ID patterns
        for pattern in signatures["id_patterns"]:
            if any(pattern.lower() in id_str.lower() for id_str in request.form_ids):
                score += 20
                detected_features.append(f"ID pattern matches {portal_name}")
        
        # Check HTML snippet if provided
        if request.html_snippet:
            for feature in signatures["features"]:
                if feature.lower() in request.html_snippet.lower():
                    score += 10
                    detected_features.append(f"Found {feature}")
        
        scores[portal_name] = score
    
    # Determine best match
    if not scores or max(scores.values()) == 0:
        return PortalDetectionResponse(
            portal_type="custom",
            confidence=0.0,
            detected_features=detected_features,
            recommendations=[
                "Unable to detect known ATS portal",
                "Manual form filling recommended",
                "Use semi-automatic mode with review"
            ],
            supports_autofill=False
        )
    
    best_match = max(scores.items(), key=lambda x: x[1])
    portal_type = best_match[0]
    confidence = min(best_match[1] / 100, 1.0)
    
    recommendations = []
    if confidence >= 0.8:
        recommendations.append(f"High confidence detection of {portal_type}")
        recommendations.append("Automatic form filling available")
        recommendations.append("Risk assessment recommended before submission")
    elif confidence >= 0.5:
        recommendations.append(f"Moderate confidence detection of {portal_type}")
        recommendations.append("Semi-automatic mode recommended")
        recommendations.append("Manual review required")
    else:
        recommendations.append(f"Low confidence detection of {portal_type}")
        recommendations.append("Manual form filling recommended")
    
    return PortalDetectionResponse(
        portal_type=portal_type,
        confidence=confidence,
        detected_features=list(set(detected_features)),
        recommendations=recommendations,
        supports_autofill=confidence >= 0.5
    )


# ============================================================================
# Form Structure Analysis
# ============================================================================

@router.post("/analyze-form", response_model=FormStructureResponse)
async def analyze_form_structure(
    request: FormStructureRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze form structure to categorize fields and estimate completion time
    """
    total_fields = len(request.fields)
    required_fields = sum(1 for f in request.fields if f.required)
    optional_fields = total_fields - required_fields
    
    # Categorize fields
    field_categories = {
        "personal_info": [],
        "contact_info": [],
        "education": [],
        "experience": [],
        "skills": [],
        "documents": [],
        "questions": [],
        "other": []
    }
    
    for field in request.fields:
        label_lower = field.label.lower()
        field_name_lower = field.field_name.lower()
        combined = label_lower + " " + field_name_lower
        
        if any(kw in combined for kw in ["name", "first", "last", "middle"]):
            field_categories["personal_info"].append(field.field_id)
        elif any(kw in combined for kw in ["email", "phone", "address", "linkedin", "portfolio", "website"]):
            field_categories["contact_info"].append(field.field_id)
        elif any(kw in combined for kw in ["education", "degree", "university", "college", "school", "gpa"]):
            field_categories["education"].append(field.field_id)
        elif any(kw in combined for kw in ["experience", "work", "employment", "company", "position", "job"]):
            field_categories["experience"].append(field.field_id)
        elif any(kw in combined for kw in ["skill", "proficiency", "technology", "language"]):
            field_categories["skills"].append(field.field_id)
        elif any(kw in combined for kw in ["resume", "cv", "upload", "file", "document", "attachment"]):
            field_categories["documents"].append(field.field_id)
        elif field.field_type in ["textarea"] or "question" in combined or "why" in combined:
            field_categories["questions"].append(field.field_id)
        else:
            field_categories["other"].append(field.field_id)
    
    # Estimate completion time (rough heuristic)
    time_per_field = 5  # seconds
    time_per_question = 120  # 2 minutes for essay questions
    
    total_seconds = (total_fields * time_per_field) + (len(field_categories["questions"]) * time_per_question)
    minutes = total_seconds // 60
    
    if minutes < 2:
        completion_estimate = "1-2 minutes"
    elif minutes < 5:
        completion_estimate = "2-5 minutes"
    elif minutes < 10:
        completion_estimate = "5-10 minutes"
    elif minutes < 20:
        completion_estimate = "10-20 minutes"
    else:
        completion_estimate = "20+ minutes"
    
    return FormStructureResponse(
        total_fields=total_fields,
        required_fields=required_fields,
        optional_fields=optional_fields,
        field_categories=field_categories,
        completion_estimate=completion_estimate
    )


# ============================================================================
# Answer Mapping
# ============================================================================

@router.post("/map-answers", response_model=FormMappingResponse)
async def map_answers_to_form(
    request: FormMappingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Map application answers to form fields
    Returns field mappings with confidence scores
    """
    # Get application
    app = db.query(Application).filter(
        Application.id == request.application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Get job for additional context
    job = db.query(Job).filter(Job.id == app.job_id).first()
    
    mappings = []
    unmapped_fields = []
    
    # Get user experiences for additional data
    from app.models import Experience
    experiences = db.query(Experience).filter(
        Experience.user_id == current_user.id
    ).all()
    
    # Build data sources
    data_sources = {
        "cover_letter": app.cover_letter or "",
        "user_email": current_user.email,
    }
    
    # Add answers
    if app.answers:
        for key, value in app.answers.items():
            if isinstance(value, dict):
                data_sources[f"answer_{key}"] = value.get("answer", "")
            else:
                data_sources[f"answer_{key}"] = str(value)
    
    # Add experience data
    if experiences:
        latest_exp = experiences[0]
        data_sources["company"] = latest_exp.company or ""
        data_sources["position"] = latest_exp.title or ""
    
    # Map each field
    for field in request.fields:
        label_lower = field.label.lower()
        field_name_lower = field.field_name.lower()
        mapped = False
        
        # Email field
        if any(kw in label_lower or kw in field_name_lower for kw in ["email"]):
            mappings.append(AnswerMapping(
                field_id=field.field_id,
                answer_source="user_email",
                mapped_value=current_user.email,
                confidence=1.0
            ))
            mapped = True
        
        # Cover letter / Why this company
        elif any(kw in label_lower for kw in ["cover letter", "why", "interest", "motivation"]):
            if app.cover_letter:
                mappings.append(AnswerMapping(
                    field_id=field.field_id,
                    answer_source="cover_letter",
                    mapped_value=app.cover_letter,
                    confidence=0.95
                ))
                mapped = True
        
        # Try to match with answers
        elif app.answers:
            for key, value in app.answers.items():
                answer_text = value.get("answer", "") if isinstance(value, dict) else str(value)
                # Simple keyword matching (can be improved with NLP)
                if answer_text and len(answer_text) > 20:  # Only use substantial answers
                    mappings.append(AnswerMapping(
                        field_id=field.field_id,
                        answer_source=f"answer_{key}",
                        mapped_value=answer_text,
                        confidence=0.7
                    ))
                    mapped = True
                    break
        
        if not mapped:
            unmapped_fields.append(field.field_id)
    
    total_fields = len(request.fields)
    mapped_count = len(mappings)
    coverage = (mapped_count / total_fields * 100) if total_fields > 0 else 0
    
    # Consider ready if >80% coverage and all required fields mapped
    required_field_ids = {f.field_id for f in request.fields if f.required}
    mapped_field_ids = {m.field_id for m in mappings}
    required_mapped = required_field_ids.issubset(mapped_field_ids)
    
    ready_to_submit = coverage >= 80 and required_mapped
    
    return FormMappingResponse(
        mappings=mappings,
        unmapped_fields=unmapped_fields,
        coverage=coverage,
        ready_to_submit=ready_to_submit
    )


# ============================================================================
# Risk Assessment
# ============================================================================

@router.post("/assess-risk", response_model=RiskAssessmentResponse)
async def assess_submission_risk(
    request: RiskAssessmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Assess risk of automated submission
    Checks for missing fields, validation errors, and potential issues
    """
    # Get application
    app = db.query(Application).filter(
        Application.id == request.application_id,
        Application.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    risk_factors = []
    requires_review = []
    
    # Check 1: Missing required fields
    required_fields = {f.field_id for f in request.fields if f.required}
    mapped_fields = {m.field_id for m in request.mappings}
    missing_required = required_fields - mapped_fields
    
    if missing_required:
        for field_id in missing_required:
            field = next((f for f in request.fields if f.field_id == field_id), None)
            if field:
                risk_factors.append(RiskFactor(
                    severity="critical",
                    category="missing_required",
                    field_id=field_id,
                    description=f"Required field '{field.label}' is not mapped",
                    recommendation="Provide value for this required field"
                ))
                requires_review.append(field_id)
    
    # Check 2: Low confidence mappings
    low_confidence_mappings = [m for m in request.mappings if m.confidence < 0.6]
    for mapping in low_confidence_mappings:
        field = next((f for f in request.fields if f.field_id == mapping.field_id), None)
        if field:
            risk_factors.append(RiskFactor(
                severity="medium",
                category="low_confidence",
                field_id=mapping.field_id,
                description=f"Low confidence mapping ({mapping.confidence:.0%}) for '{field.label}'",
                recommendation="Review and verify the mapped value"
            ))
            requires_review.append(mapping.field_id)
    
    # Check 3: File upload fields
    file_fields = [f for f in request.fields if f.field_type == "file"]
    file_field_ids = {f.field_id for f in file_fields}
    mapped_file_fields = {m.field_id for m in request.mappings if m.field_id in file_field_ids}
    missing_files = file_field_ids - mapped_file_fields
    
    if missing_files:
        for field_id in missing_files:
            field = next((f for f in file_fields if f.field_id == field_id), None)
            if field and field.required:
                risk_factors.append(RiskFactor(
                    severity="critical",
                    category="missing_file",
                    field_id=field_id,
                    description=f"Required file upload '{field.label}' is missing",
                    recommendation="Upload required file before submission"
                ))
                requires_review.append(field_id)
            elif field:
                risk_factors.append(RiskFactor(
                    severity="low",
                    category="missing_file",
                    field_id=field_id,
                    description=f"Optional file upload '{field.label}' is missing",
                    recommendation="Consider uploading additional documents"
                ))
    
    # Check 4: Portal-specific risks
    if request.portal_type == "workday":
        # Workday has strict validation
        risk_factors.append(RiskFactor(
            severity="medium",
            category="portal_specific",
            description="Workday portals have strict validation rules",
            recommendation="Review all fields before submission"
        ))
    
    # Calculate overall risk
    critical_count = sum(1 for r in risk_factors if r.severity == "critical")
    high_count = sum(1 for r in risk_factors if r.severity == "high")
    medium_count = sum(1 for r in risk_factors if r.severity == "medium")
    
    if critical_count > 0:
        overall_risk = "critical"
        risk_score = 90 + critical_count * 5
        can_proceed = False
    elif high_count > 2:
        overall_risk = "high"
        risk_score = 70 + high_count * 5
        can_proceed = False
    elif high_count > 0 or medium_count > 3:
        overall_risk = "medium"
        risk_score = 40 + high_count * 10 + medium_count * 5
        can_proceed = True
    else:
        overall_risk = "low"
        risk_score = medium_count * 5
        can_proceed = True
    
    # Estimate success rate
    if critical_count > 0:
        estimated_success_rate = 0.0
    elif high_count > 2:
        estimated_success_rate = 0.3
    elif high_count > 0:
        estimated_success_rate = 0.6
    elif medium_count > 3:
        estimated_success_rate = 0.8
    else:
        estimated_success_rate = 0.95
    
    return RiskAssessmentResponse(
        overall_risk=overall_risk,
        risk_score=min(risk_score, 100),
        risk_factors=risk_factors,
        can_proceed=can_proceed,
        requires_review=list(set(requires_review)),
        estimated_success_rate=estimated_success_rate
    )


# ============================================================================
# Autofill Data Generation
# ============================================================================

@router.post("/generate-autofill", response_model=AutofillResponse)
async def generate_autofill_data(
    request: AutofillRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate complete autofill data for Chrome Extension
    Combines mapping + risk assessment in one call
    """
    # First, map answers to fields
    mapping_request = FormMappingRequest(
        application_id=request.application_id,
        fields=request.fields
    )
    
    mapping_response = await map_answers_to_form(mapping_request, current_user, db)
    
    # Then assess risk
    risk_request = RiskAssessmentRequest(
        application_id=request.application_id,
        portal_type=request.portal_type,
        mappings=mapping_response.mappings,
        fields=request.fields
    )
    
    risk_response = await assess_submission_risk(risk_request, current_user, db)
    
    # Build field values dictionary
    field_values = {
        mapping.field_id: mapping.mapped_value 
        for mapping in mapping_response.mappings
    }
    
    # File uploads (to be implemented)
    file_uploads = {}
    
    # Validation rules based on portal type
    validation_rules = {}
    if request.portal_type == "workday":
        validation_rules = {
            "max_retries": 3,
            "wait_after_fill": 500,  # ms
            "validate_before_submit": True
        }
    elif request.portal_type == "greenhouse":
        validation_rules = {
            "max_retries": 2,
            "wait_after_fill": 300,
            "validate_before_submit": False
        }
    else:
        validation_rules = {
            "max_retries": 2,
            "wait_after_fill": 200,
            "validate_before_submit": True
        }
    
    return AutofillResponse(
        application_id=request.application_id,
        portal_type=request.portal_type,
        field_values=field_values,
        file_uploads=file_uploads,
        risk_assessment=risk_response,
        validation_rules=validation_rules
    )