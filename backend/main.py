from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from PyPDF2 import PdfReader
from groq import Groq
import os
from typing import Dict, Any, Optional
import json

app = FastAPI()

# Allow CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    Analyze a resume uploaded as a PDF file using Groq API.
    """
    # Set API key for this request if provided
    if api_key:
        groq_api_key = api_key
    else:
        env_api_key = os.getenv("GROQ_API_KEY")
        if env_api_key:
            groq_api_key = env_api_key
        else:
            return {"error": "No API key provided. Please enter your Groq API key."}
    try:
        # Validate file type
        if not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")

        # Extract text from PDF
        pdf_reader = PdfReader(file.file)
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")

        # Define analysis prompt
        analysis_prompt = f"""
        You are an expert resume reviewer. Analyze the following resume and provide comprehensive, constructive feedback.
        Focus on these key areas:
        1. Skills Assessment: Identify technical and soft skills, note missing skills, categorize as relevant_skills and skill_gaps.
        2. Experience Evaluation: Assess achievements vs responsibilities, career progression, relevance, and gaps.
        3. Education & Qualifications: Extract all education info (degrees, institutions, graduation dates, GPA), note certifications.
           IMPORTANT: For education_qualifications, you MUST return an array of objects. Each object MUST have the keys: University, Degree, Graduation Year, GPA. If Honors is present, include it as a key in the SAME object. DO NOT use arrays of strings. DO NOT mix objects and strings. DO NOT use numeric keys or indices. DO NOT use separate objects or strings for honors. All values must be strings. Repeat: education_qualifications must be an array of objects, each with University, Degree, Graduation Year, GPA, and Honors (if present, in the same object). No arrays of strings, no mixed types, no numeric keys, no separate objects or strings for honors.
        4. Format and Structure: Comment on organization, clarity, length, formatting, and grammar.
        5. Improvement Suggestions: Provide 3-5 actionable suggestions to improve the resume.
        Resume text:
        {text[:4000]}
        Provide your analysis in JSON format with these keys:
        - skills_assessment: Object with technical_skills (array), soft_skills (array), relevant_skills (array), and skill_gaps (array)
        - experience_evaluation: Object with labeled string values for each field (do not use numbers only)
        - education_qualifications: Array of objects, each with University, Degree, Graduation Year, GPA (all as strings, no nested objects, no numeric keys). If Honors is present, include it as a key in the same object. No arrays of strings, no mixed types, no numeric keys, no separate objects or strings for honors.
        - format_structure: Object with labeled string values for each field
        - improvement_suggestions: Array of 3-5 specific suggestions
        - overall_score: Integer from 1-10 reflecting the overall quality
        IMPORTANT: All values must be strings. Do not return nested objects. Do not use [object Object]. Do not use numeric keys or indices in the output. Do not use arrays of strings. Do not mix objects and strings. Do not use separate objects or strings for honors. Only include 'Honors' if present in the resume, and include it as a key in the same object. Repeat: education_qualifications must be an array of objects, each with University, Degree, Graduation Year, GPA, and Honors (if present, in the same object). No arrays of strings, no mixed types, no numeric keys, no separate objects or strings for honors.
        """

        # Use Groq API for analysis
        client = Groq(api_key=groq_api_key)
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[
                {"role": "system", "content": "You are a professional resume analyzer that provides detailed, structured feedback. Always extract and include complete education information in your analysis."},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )

        analysis_text = response.choices[0].message.content

        # Try to extract JSON from the response
        try:
            import re
            print('RAW ANALYSIS TEXT:')
            print(analysis_text)
            json_match = re.search(r'({[\s\S]*})', analysis_text)
            if json_match:
                try:
                    analysis_json = json.loads(json_match.group(0))
                    print('PARSED ANALYSIS JSON:')
                    print(analysis_json)
                    if "overall_score" in analysis_json:
                        try:
                            score = float(analysis_json["overall_score"])
                            analysis_json["overall_score"] = round(score * 10)
                        except Exception as e:
                            print("Error scaling overall_score:", e)
                except Exception as e:
                    print('JSON PARSE ERROR:', e)
                    return {"feedback": analysis_text}
            else:
                try:
                    analysis_json = json.loads(analysis_text)
                    print('PARSED ANALYSIS JSON (no regex):')
                    print(analysis_json)
                    if "overall_score" in analysis_json:
                        try:
                            score = float(analysis_json["overall_score"])
                            analysis_json["overall_score"] = round(score * 10)
                        except Exception as e:
                            print("Error scaling overall_score:", e)
                except Exception as e:
                    print('JSON PARSE ERROR (no regex):', e)
                    return {"feedback": analysis_text}
            return {"feedback": analysis_json}
        except Exception as e:
            print('FINAL JSON PARSE ERROR:', e)
            return {"feedback": analysis_text}

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": f"An error occurred: {str(e)}"} 