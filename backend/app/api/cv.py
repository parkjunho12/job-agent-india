"""
CV Upload and Parsing API
Handles PDF/DOCX CV upload, parsing, and auto-population of experiences
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import PyPDF2
import docx
import io
import json
from datetime import datetime
import re

from app.db.database import get_db
from app.models.user import User
from app.models.experience import Experience, ExperienceType
from app.api.auth import get_current_user
from app.services.openai_service import OpenAIService

router = APIRouter(prefix="/api/v1/cv", tags=["cv"])


@router.post("/upload")
async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and parse CV (PDF or DOCX)
    Returns extracted text and suggested experiences
    """
    # Validate file type
    if not file.filename.endswith(('.pdf', '.docx', '.doc')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are supported"
        )
    
    # Read file content
    content = await file.read()
    
    # Extract text based on file type
    if file.filename.endswith('.pdf'):
        text = extract_text_from_pdf(content)
    else:
        text = extract_text_from_docx(content)
    
    if not text or len(text.strip()) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract sufficient text from CV. Please check the file."
        )
    
    # Parse CV using OpenAI
    openai_service = OpenAIService()
    parsed_data = await parse_cv_with_ai(text, openai_service)
    
    return {
        "filename": file.filename,
        "text_length": len(text),
        "extracted_text": text[:1000] + "..." if len(text) > 1000 else text,
        "parsed_data": parsed_data,
        "message": "CV parsed successfully. Review the extracted experiences below."
    }


@router.post("/parse-and-save")
async def parse_and_save_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload CV, parse it, and automatically save experiences to database
    """
    # Upload and parse
    result = await upload_cv(file, current_user, db)
    parsed_data = result["parsed_data"]
    
    saved_experiences = []
    
    # Save work experiences
    for exp_data in parsed_data.get("work_experience", []):
        try:
            experience = create_experience_from_parsed_data(
                exp_data, 
                ExperienceType.WORK, 
                current_user.id
            )
            db.add(experience)
            saved_experiences.append({
                "type": "work",
                "title": exp_data.get("title", "Unknown"),
                "organization": exp_data.get("company", "Unknown")
            })
        except Exception as e:
            print(f"Error saving work experience: {e}")
    
    # Save education
    for edu_data in parsed_data.get("education", []):
        try:
            experience = create_experience_from_parsed_data(
                edu_data, 
                ExperienceType.EDUCATION, 
                current_user.id
            )
            db.add(experience)
            saved_experiences.append({
                "type": "education",
                "title": edu_data.get("degree", "Unknown"),
                "organization": edu_data.get("institution", "Unknown")
            })
        except Exception as e:
            print(f"Error saving education: {e}")
    
    # Save projects
    for proj_data in parsed_data.get("projects", []):
        try:
            experience = create_experience_from_parsed_data(
                proj_data, 
                ExperienceType.PROJECT, 
                current_user.id
            )
            db.add(experience)
            saved_experiences.append({
                "type": "project",
                "title": proj_data.get("title", "Unknown"),
                "organization": proj_data.get("organization", "Personal")
            })
        except Exception as e:
            print(f"Error saving project: {e}")
    
    db.commit()
    
    return {
        "message": f"Successfully saved {len(saved_experiences)} experiences from CV",
        "saved_experiences": saved_experiences,
        "skills_detected": parsed_data.get("skills", [])
    }


# Helper Functions

def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        pdf_file = io.BytesIO(content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading PDF: {str(e)}"
        )


def extract_text_from_docx(content: bytes) -> str:
    """Extract text from DOCX file"""
    try:
        docx_file = io.BytesIO(content)
        doc = docx.Document(docx_file)
        
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        
        return text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading DOCX: {str(e)}"
        )


async def parse_cv_with_ai(text: str, openai_service: OpenAIService) -> Dict[str, Any]:
    """
    Parse CV text using OpenAI to extract structured data
    """
    prompt = f"""
You are a CV parsing assistant. Extract structured information from the following CV text.

Return a JSON object with this structure:
{{
  "personal_info": {{
    "name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null"
  }},
  "work_experience": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "location": "Location",
      "start_date": "YYYY-MM or YYYY",
      "end_date": "YYYY-MM or YYYY or Present",
      "is_current": boolean,
      "description": "Brief description",
      "achievements": ["achievement 1", "achievement 2"],
      "skills": ["skill1", "skill2"]
    }}
  ],
  "education": [
    {{
      "degree": "Degree Name",
      "institution": "University Name",
      "location": "Location",
      "start_date": "YYYY-MM or YYYY",
      "end_date": "YYYY-MM or YYYY",
      "description": "Brief description"
    }}
  ],
  "projects": [
    {{
      "title": "Project Name",
      "organization": "Organization or Personal",
      "start_date": "YYYY-MM or YYYY",
      "end_date": "YYYY-MM or YYYY",
      "description": "Brief description",
      "skills": ["skill1", "skill2"]
    }}
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "certifications": ["cert1", "cert2"]
}}

CV Text:
{text}

Return ONLY the JSON object, no additional text.
"""
    
    try:
        response = await openai_service.chat_completion(
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1
        )
        
        # Parse JSON response
        json_str = response.strip()
        
        # Remove markdown code blocks if present
        if json_str.startswith("```json"):
            json_str = json_str[7:]
        if json_str.startswith("```"):
            json_str = json_str[3:]
        if json_str.endswith("```"):
            json_str = json_str[:-3]
        
        parsed_data = json.loads(json_str.strip())
        return parsed_data
        
    except json.JSONDecodeError as e:
        # If JSON parsing fails, return basic structure
        print(f"JSON parsing error: {e}")
        return {
            "personal_info": {},
            "work_experience": [],
            "education": [],
            "projects": [],
            "skills": [],
            "certifications": []
        }
    except Exception as e:
        print(f"CV parsing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing CV: {str(e)}"
        )


def create_experience_from_parsed_data(
    data: Dict[str, Any], 
    exp_type: ExperienceType, 
    user_id: int
) -> Experience:
    """
    Create Experience object from parsed data
    """
    # Parse dates
    start_date = parse_date_string(data.get("start_date", "2020-01"))
    end_date = parse_date_string(data.get("end_date")) if data.get("end_date") and data.get("end_date") != "Present" else None
    
    # Determine title and organization based on type
    if exp_type == ExperienceType.WORK:
        title = data.get("title", "Unknown Position")
        organization = data.get("company", "Unknown Company")
    elif exp_type == ExperienceType.EDUCATION:
        title = data.get("degree", "Unknown Degree")
        organization = data.get("institution", "Unknown Institution")
    else:  # PROJECT
        title = data.get("title", "Unknown Project")
        organization = data.get("organization", "Personal")
    
    # Extract keywords
    keywords = extract_keywords_from_data(data)
    
    return Experience(
        user_id=user_id,
        type=exp_type,
        title=title,
        organization=organization,
        location=data.get("location"),
        start_date=start_date,
        end_date=end_date,
        is_current=data.get("is_current", False),
        description=data.get("description", ""),
        achievements=data.get("achievements", []),
        skills_used=data.get("skills", []),
        keywords=keywords
    )


def parse_date_string(date_str: str) -> datetime:
    """
    Parse various date string formats to datetime
    Handles: YYYY-MM, YYYY, MM/YYYY, etc.
    """
    if not date_str:
        return datetime.utcnow()
    
    date_str = str(date_str).strip()
    
    # Try different formats
    formats = [
        "%Y-%m",      # 2020-01
        "%Y",         # 2020
        "%m/%Y",      # 01/2020
        "%B %Y",      # January 2020
        "%b %Y",      # Jan 2020
    ]
    
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    
    # If no format matches, return current date
    return datetime.utcnow()


def extract_keywords_from_data(data: Dict[str, Any]) -> List[str]:
    """
    Extract keywords from parsed experience data
    """
    keywords = set()
    
    # Add skills
    if "skills" in data:
        keywords.update([s.lower() for s in data["skills"]])
    
    # Add from description
    if "description" in data:
        words = data["description"].lower().split()
        keywords.update([w for w in words if len(w) > 3])
    
    # Add from achievements
    if "achievements" in data:
        for achievement in data["achievements"]:
            words = achievement.lower().split()
            keywords.update([w for w in words if len(w) > 3])
    
    return sorted(list(keywords))[:50]