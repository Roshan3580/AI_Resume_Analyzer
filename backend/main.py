from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader
import openai
import os
from typing import Dict, Any, Optional
import json

app = FastAPI()

# Configure CORS to allow frontend to communicate with the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "AI Resume Analyzer API is running"}


@app.post("/analyze")
async def analyze_resume(
        file: UploadFile = File(...),
        api_key: Optional[str] = Form(None)
) -> Dict[str, Any]:
    """
    Analyze a resume uploaded as a PDF file.

    Args:
        file: The uploaded PDF resume
        api_key: Optional OpenAI API key to use for this request

    Returns:
        Dict containing analysis results with feedback on different aspects of the resume
    """
    # Set API key for this request if provided
    if api_key:
        openai.api_key = api_key
    else:
        # Try to get API key from environment variable as fallback
        env_api_key = os.getenv("OPENAI_API_KEY")
        if env_api_key:
            openai.api_key = env_api_key
        else:
            return {"error": "No API key provided. Please enter your OpenAI API key."}
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        # Extract text from PDF
        content = await file.read()
        pdf_reader = PdfReader(file.file)
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:  # Only add if text was extracted
                text += page_text + "\n"

        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        # Define analysis prompts
        analysis_prompt = """
        You are an expert resume reviewer. Analyze the following resume and provide comprehensive, constructive feedback.
        Focus on these key areas:
        
        1. Skills Assessment:
           - Identify all technical skills present (programming languages, tools, frameworks, etc.)
           - Identify soft skills demonstrated in the resume
           - Note any missing skills that are typically expected for the positions implied by the resume
           - Categorize skills as "relevant_skills" and "skill_gaps"
        
        2. Experience Evaluation:
           - Assess the quality of experience descriptions (achievements vs responsibilities)
           - Evaluate career progression and growth
           - Analyze the relevance and impact of the experience
           - Identify any employment gaps or job-hopping concerns
        
        3. Education & Qualifications:
           - Extract and assess all education information (degrees, institutions, graduation dates, GPA)
           - Evaluate relevance of education to career path
           - Note any certifications or continuing education
           - Provide specific details about university names, degree programs, and graduation years
        
        4. Format and Structure:
           - Comment on overall organization, clarity, and readability
           - Assess appropriate length and conciseness
           - Evaluate formatting consistency and visual appeal
           - Note any spelling or grammar issues
        
        5. Improvement Suggestions:
           - Provide 3-5 specific, actionable suggestions to improve this resume
           - Focus on high-impact changes that would most improve the candidate's chances

        Resume text:
        {resume_text}

        Provide your analysis in JSON format with these keys:
        - skills_assessment: Object with technical_skills (array), soft_skills (array), relevant_skills (array), and skill_gaps (array)
        - experience_evaluation: Object with achievements_vs_responsibilities, quality_of_experience, and other relevant fields
        - education_qualifications: Object with all education details including university, degree, graduation_year, and gpa if available
        - format_structure: Object with organization_clarity, length_conciseness, formatting_readability
        - improvement_suggestions: Array of 3-5 specific suggestions
        - overall_score: Integer from 1-10 reflecting the overall quality
        
        IMPORTANT: Always include complete education information with specific details about university names, degree programs, and graduation years.
        """

        # Use OpenAI API for analysis
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system",
                 "content": "You are a professional resume analyzer that provides detailed, structured feedback. Always extract and include complete education information in your analysis."},
                {"role": "user", "content": analysis_prompt.format(resume_text=text[:4000])}  # Limit text to 4000 chars
            ],
            temperature=0.7,
            max_tokens=1500
        )

        # Extract and parse the response
        analysis_text = response.choices[0].message.content

        # Try to extract JSON from the response
        try:
            # Find JSON content if it's within a code block or mixed with text
            import re
            json_match = re.search(r'({[\s\S]*})', analysis_text)
            if json_match:
                try:
                    analysis_json = json.loads(json_match.group(0))
                except:
                    # If parsing the matched pattern fails, return the raw text
                    return {"feedback": analysis_text}
            else:
                # If no JSON pattern found, try parsing the whole text
                try:
                    analysis_json = json.loads(analysis_text)
                except:
                    # If all JSON parsing fails, return the raw text
                    return {"feedback": analysis_text}

            return {"feedback": analysis_json}
        except Exception as e:
            # If JSON parsing fails, return the raw text
            return {"feedback": analysis_text}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"An error occurred: {str(e)}"}