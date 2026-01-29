"""
Enhanced CV Upload and Parsing API
Now saves skills, certifications, and projects properly
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import PyPDF2
import docx
import io
import json
from datetime import datetime

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
    Returns extracted text and parsed data including skills and certifications
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
    
    # Parse CV using OpenAI with enhanced prompt
    openai_service = OpenAIService()
    parsed_data = await parse_cv_enhanced(text, openai_service)
    
    return {
        "filename": file.filename,
        "text_length": len(text),
        "parsed_data": parsed_data,
        "summary": {
            "work_experience": len(parsed_data.get("work_experience", [])),
            "education": len(parsed_data.get("education", [])),
            "projects": len(parsed_data.get("projects", [])),
            "skills": len(parsed_data.get("all_skills_flat", [])),
            "certifications": len(parsed_data.get("certifications", []))
        },
        "message": "CV parsed successfully"
    }


@router.post("/parse-and-save")
async def parse_and_save_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload CV, parse it, and save EVERYTHING to database
    Including skills, certifications, and projects
    """
    # Validate file type
    if not file.filename.endswith(('.pdf', '.docx', '.doc')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are supported"
        )
    
    # Read and extract text
    content = await file.read()
    
    if file.filename.endswith('.pdf'):
        text = extract_text_from_pdf(content)
    else:
        text = extract_text_from_docx(content)
    
    if not text or len(text.strip()) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract sufficient text from CV"
        )
    
    # Parse with OpenAI
    openai_service = OpenAIService()
    parsed_data = await parse_cv_enhanced(text, openai_service)
    
    # Save CV metadata to user
    current_user.cv_filename = file.filename
    current_user.cv_uploaded_at = datetime.utcnow()
    current_user.cv_text = text[:10000]  # Store first 10k chars
    
    saved_items = {
        "work_experience": [],
        "education": [],
        "projects": [],
        "skills": [],
        "certifications": []
    }
    
    # Save work experiences
    for exp_data in parsed_data.get("work_experience", []):
        try:
            experience = create_experience_from_parsed_data(
                exp_data, 
                ExperienceType.WORK, 
                current_user.id
            )
            db.add(experience)
            saved_items["work_experience"].append({
                "title": exp_data.get("title"),
                "company": exp_data.get("company"),
                "skills": exp_data.get("skills", [])
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
            saved_items["education"].append({
                "degree": edu_data.get("degree"),
                "institution": edu_data.get("institution")
            })
        except Exception as e:
            print(f"Error saving education: {e}")
    
    # Save projects (NOW INCLUDED!)
    for proj_data in parsed_data.get("projects", []):
        try:
            # Map 'technologies' to 'skills' for consistency
            if "technologies" in proj_data:
                proj_data["skills"] = proj_data["technologies"]
            
            experience = create_experience_from_parsed_data(
                proj_data, 
                ExperienceType.PROJECT, 
                current_user.id
            )
            db.add(experience)
            saved_items["projects"].append({
                "title": proj_data.get("title"),
                "organization": proj_data.get("organization", "Personal"),
                "technologies": proj_data.get("skills", [])
            })
        except Exception as e:
            print(f"Error saving project: {e}")
    
    # Save skills to user (FLATTENED LIST)
    all_skills = parsed_data.get("all_skills_flat", [])
    current_user.all_skills = all_skills
    saved_items["skills"] = all_skills
    
    # Save certifications to user (FULL OBJECTS)
    certifications = parsed_data.get("certifications", [])
    current_user.certifications = certifications
    saved_items["certifications"] = certifications
    
    db.commit()
    
    # Update user's aggregated skills from experiences
    current_user.update_skills_from_experiences(db)
    
    return {
        "message": "CV parsed and saved successfully! 🎉",
        "summary": {
            "work_experience": len(saved_items["work_experience"]),
            "education": len(saved_items["education"]),
            "projects": len(saved_items["projects"]),
            "skills": len(saved_items["skills"]),
            "certifications": len(saved_items["certifications"])
        },
        "experiences": {
            "work": saved_items["work_experience"],
            "education": saved_items["education"],
            "projects": saved_items["projects"]
        },
        "skills_preview": all_skills[:20],  # First 20 skills
        "certifications_preview": [c.get("name") for c in certifications]
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


async def parse_cv_enhanced(text: str, openai_service: OpenAIService) -> Dict[str, Any]:
    """
    Parse CV text using OpenAI with enhanced prompt for skills and certifications
    """
    prompt = f"""
    Extract structured information from this CV.
    Return ONLY a JSON object with this EXACT structure:

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
                "start_date": "YYYY-MM",
                "end_date": "YYYY-MM or Present",
                "is_current": true/false,
                "description": "Brief description",
                "achievements": ["achievement 1", "achievement 2"],
                "skills": ["Python", "JavaScript", "AWS"]
            }}
        ],
        "education": [
            {{
                "degree": "Bachelor of Science in Computer Science",
                "institution": "University Name",
                "location": "Location",
                "start_date": "YYYY-MM",
                "end_date": "YYYY-MM",
                "grade": "3.8 GPA or First Class",
                "description": "Relevant coursework"
            }}
        ],
        "projects": [
            {{
                "title": "Project Name",
                "organization": "Company or Personal",
                "start_date": "YYYY-MM",
                "end_date": "YYYY-MM",
                "description": "What you built",
                "technologies": ["React", "Node.js", "MongoDB"],
                "url": "github.com/... or null",
                "achievements": ["Served 10k users"]
            }}
        ],
        "skills": {{
            "programming_languages": ["Python", "JavaScript"],
            "frameworks": ["React", "Django"],
            "tools": ["Git", "Docker", "AWS"],
            "databases": ["PostgreSQL", "MongoDB"],
            "other": ["Agile", "Team Leadership"]
        }},
        "certifications": [
            {{
                "name": "AWS Certified Solutions Architect",
                "issuer": "Amazon Web Services",
                "issue_date": "2023-06",
                "expiry_date": "2026-06 or null",
                "credential_id": "ABC123 or null"
            }}
        ]
    }}

    CRITICAL INSTRUCTIONS:
    1. Extract ALL skills mentioned ANYWHERE in the CV
    2. Categorize skills into proper categories
    3. Include ALL certifications with full details
    4. For each work experience, list specific skills/technologies used
    5. For each project, list technologies used
    6. Return ONLY the JSON object, no markdown formatting

    CV Text:
    {text}
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
        
        # Flatten skills from categorized structure
        all_skills = []
        if "skills" in parsed_data and isinstance(parsed_data["skills"], dict):
            for category, skills_list in parsed_data["skills"].items():
                if isinstance(skills_list, list):
                    all_skills.extend(skills_list)
        
        # Add flattened skills list for easy access
        parsed_data["all_skills_flat"] = sorted(list(set(all_skills)))
        
        return parsed_data
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        # Return basic structure on error
        return {
            "personal_info": {},
            "work_experience": [],
            "education": [],
            "projects": [],
            "skills": {},
            "certifications": [],
            "all_skills_flat": []
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
    Handles work, education, and projects
    """
    # Parse dates
    start_date = parse_date_string(data.get("start_date", "2020-01"))
    end_date = parse_date_string(data.get("end_date")) if data.get("end_date") and data.get("end_date") != "Present" else None
    
    # Determine title and organization based on type
    if exp_type == ExperienceType.WORK:
        title = data.get("title", "Unknown Position")
        organization = data.get("company", "Unknown Company")
        skills = data.get("skills", [])
        achievements = data.get("achievements", [])
        
    elif exp_type == ExperienceType.EDUCATION:
        title = data.get("degree", "Unknown Degree")
        organization = data.get("institution", "Unknown Institution")
        skills = []
        achievements = [data.get("grade", "")] if data.get("grade") else []
        
    else:  # PROJECT
        title = data.get("title", "Unknown Project")
        organization = data.get("organization", "Personal")
        # Projects use 'technologies' field
        skills = data.get("technologies", data.get("skills", []))
        achievements = data.get("achievements", [])
    
    # Extract keywords
    keywords = extract_keywords_from_data(data, skills)
    
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
        achievements=achievements,
        skills_used=skills,
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


def extract_keywords_from_data(data: Dict[str, Any], skills: List[str]) -> List[str]:
    """
    Extract keywords from parsed experience data
    """
    keywords = set()
    
    # Add skills
    keywords.update([s.lower() for s in skills])
    
    # Add from description
    if "description" in data:
        words = data["description"].lower().split()
        keywords.update([w for w in words if len(w) > 3])
    
    # Add from achievements
    if "achievements" in data:
        for achievement in data["achievements"]:
            if isinstance(achievement, str):
                words = achievement.lower().split()
                keywords.update([w for w in words if len(w) > 3])
    
    return sorted(list(keywords))[:50]  # Limit to 50 keywords