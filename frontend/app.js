document.addEventListener('DOMContentLoaded', function() {
  const fileInput = document.getElementById('file-input');
  const resumeForm = document.getElementById('resume-form');
  const fileNameDisplay = document.getElementById('fileName');
  const fileUploadArea = document.getElementById('file-upload-area');
  const loader = document.getElementById('loader');
  const feedbackSection = document.getElementById('feedback-section');
  const errorMessage = document.getElementById('errorMessage');
  const apiKeyInput = document.getElementById('api-key');
  const toggleApiKeyBtn = document.getElementById('toggle-api-key');
  const scoreCircle = document.getElementById('overall-score-circle');
  const redFlagsCard = document.getElementById('red-flags-card');

  // Display file name when file is selected
  fileInput.addEventListener('change', function() {
    if (this.files.length > 0) {
      const file = this.files[0];
      fileNameDisplay.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${file.name}`;
      fileUploadArea.classList.add('has-file');
      errorMessage.style.display = 'none';
    } else {
      fileNameDisplay.textContent = '';
      fileUploadArea.classList.remove('has-file');
    }
  });

  // Toggle API key visibility
  toggleApiKeyBtn.addEventListener('click', function() {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyBtn.innerHTML = '<i class="fas fa-eye"></i>';
    }
  });

  // Handle form submission
  resumeForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validate file input
    if (!fileInput.files || fileInput.files.length === 0) {
      showError('Please select a PDF file to analyze');
      return;
    }

    const file = fileInput.files[0];

    // Validate file type
    if (!file.type.includes('pdf')) {
      showError('Only PDF files are supported');
      return;
    }

    // Validate API key
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      showError('Please enter your OpenAI API key');
      return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);

    // Show loading indicator
    loader.style.display = 'block';
    feedbackSection.style.display = 'none';
    errorMessage.style.display = 'none';

    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      loader.style.display = 'none';

      if (data.error) {
        showError(data.error);
        return;
      }

      displayResults(data.feedback);
      
      // Scroll to results
      setTimeout(() => {
        feedbackSection.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      loader.style.display = 'none';
      showError(`Error: ${error.message}`);
      console.error('Error:', error);
    }
  });

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Add animation to error message
    errorMessage.style.animation = 'none';
    setTimeout(() => {
      errorMessage.style.animation = 'fadeIn 0.3s ease';
    }, 10);
  }

  function displayResults(feedback) {
    console.log("Raw feedback data:", JSON.stringify(feedback, null, 2));
    
    // Extract raw resume text if available
    const rawResumeText = feedback.raw_text || feedback.text || '';
    
    // Handle skills assessment
    if (feedback.skills_assessment) {
      document.getElementById('skills-assessment').innerHTML = formatSkillsAssessment(feedback.skills_assessment);
    } else {
      // Try to extract skills from other sections
      let skillsData = {};
      
      // Check if skills are mentioned in other sections
      if (feedback.skills) {
        skillsData = feedback.skills;
      } else if (feedback.technical_skills || feedback.soft_skills) {
        skillsData = {
          technical_skills: feedback.technical_skills,
          soft_skills: feedback.soft_skills
        };
      } else {
        document.getElementById('skills-assessment').innerHTML = 
          '<p>No skills assessment available. Make sure your resume clearly lists your technical and soft skills.</p>';
      }
      
      if (Object.keys(skillsData).length > 0) {
        document.getElementById('skills-assessment').innerHTML = formatSkillsAssessment(skillsData);
      }
    }

    // Handle experience evaluation
    if (feedback.experience_evaluation) {
      document.getElementById('experience-evaluation').innerHTML = formatExperienceEvaluation(feedback.experience_evaluation);
    } else if (feedback.experience) {
      document.getElementById('experience-evaluation').innerHTML = formatExperienceEvaluation(feedback.experience);
    } else {
      // Look for experience information in the raw text
      const experienceSection = extractSectionFromText(rawResumeText, ['experience', 'work history', 'employment']);
      if (experienceSection) {
        document.getElementById('experience-evaluation').innerHTML = 
          '<div class="analysis-category">' +
          '<div class="category-title"><i class="fas fa-briefcase"></i>Experience Summary</div>' +
          `<p>${experienceSection}</p>` +
          '</div>';
      } else {
        document.getElementById('experience-evaluation').innerHTML = 'No experience evaluation available.';
      }
    }

    // Handle education & qualifications - improved detection
    try {
      let educationData = null;
      let educationText = '';
      
      // Extract education section from raw text if available
      const educationSection = extractSectionFromText(rawResumeText, ['education', 'academic', 'qualification', 'degree']);
      
      // Check if education information is in the improvement_suggestions
      let educationFromSuggestions = null;
      if (feedback.improvement_suggestions && Array.isArray(feedback.improvement_suggestions)) {
        for (const suggestion of feedback.improvement_suggestions) {
          if (typeof suggestion === 'string' && 
              (suggestion.toLowerCase().includes('education') || 
               suggestion.toLowerCase().includes('university') ||
               suggestion.toLowerCase().includes('college') ||
               suggestion.toLowerCase().includes('degree'))) {
            educationFromSuggestions = suggestion;
            break;
          }
        }
      }
      
      // Check if any of the format_structure elements contain education info
      let educationFromFormat = null;
      if (feedback.format_structure && typeof feedback.format_structure === 'object') {
        for (const [key, value] of Object.entries(feedback.format_structure)) {
          if (typeof value === 'string' && 
              (value.toLowerCase().includes('education') || 
               value.toLowerCase().includes('university') ||
               value.toLowerCase().includes('college') ||
               value.toLowerCase().includes('degree'))) {
            educationFromFormat = value;
            break;
          }
        }
      }
      
      // Try to find education information in various possible locations
      if (feedback.education_qualifications) {
        educationData = feedback.education_qualifications;
      } else if (feedback.education) {
        educationData = feedback.education;
      } else if (feedback.educational_background) {
        educationData = feedback.educational_background;
      } else if (feedback.qualifications) {
        educationData = feedback.qualifications;
      } else if (educationSection) {
        educationText = educationSection;
      } else if (educationFromSuggestions) {
        educationText = educationFromSuggestions;
      } else if (educationFromFormat) {
        educationText = educationFromFormat;
      } else {
        // Deep search for education information in the feedback object
        const searchForEducation = (obj, depth = 0) => {
          if (depth > 3 || typeof obj !== 'object' || obj === null) return null;
          
          // Check if this object has education-related keys
          const educationKeys = ['degree', 'university', 'college', 'education', 'school', 'qualification', 'b.tech', 'm.tech', 'ph.d', 'bachelor', 'master'];
          
          // Direct key match
          for (const key of Object.keys(obj)) {
            if (educationKeys.some(eduKey => key.toLowerCase().includes(eduKey))) {
              return obj;
            }
          }
          
          // Check values for education-related strings
          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string' && 
                educationKeys.some(eduKey => value.toLowerCase().includes(eduKey))) {
              return { [key]: value };
            }
            
            // Recursive search in nested objects
            if (typeof value === 'object' && value !== null) {
              const result = searchForEducation(value, depth + 1);
              if (result) return result;
            }
          }
          
          return null;
        };
        
        educationData = searchForEducation(feedback);
      }
      
      // Check if we have actual education data
      if (educationData) {
        document.getElementById('education-qualifications').innerHTML = formatEducationQualifications(educationData);
      } else if (educationText) {
        // Display the extracted education text
        document.getElementById('education-qualifications').innerHTML = formatEducationQualifications(educationText);
      } else {
        // If no education data was found, try to extract it from raw text using regex patterns
        const universityRegex = /(?:university|college|institute|school) of ([A-Za-z\s&,]+)/i;
        const degreeRegex = /(?:bachelor|master|phd|ph\.d|b\.s\.|m\.s\.|b\.a\.|m\.a\.|b\.tech|m\.tech) (?:of|in) ([A-Za-z\s&,]+)/i;
        const gpaRegex = /(?:gpa|grade|cgpa)[:\s]*([\d.]+)/i;
        const yearRegex = /(?:20\d{2}|19\d{2})(?:\s*-\s*(?:20\d{2}|19\d{2}|present|current))?/i;
        
        let extractedEducation = {};
        
        const universityMatch = rawResumeText.match(universityRegex);
        if (universityMatch) extractedEducation.university = universityMatch[0];
        
        const degreeMatch = rawResumeText.match(degreeRegex);
        if (degreeMatch) extractedEducation.degree = degreeMatch[0];
        
        const gpaMatch = rawResumeText.match(gpaRegex);
        if (gpaMatch) extractedEducation.gpa = gpaMatch[0];
        
        const yearMatch = rawResumeText.match(yearRegex);
        if (yearMatch) extractedEducation.graduation_year = yearMatch[0];
        
        if (Object.keys(extractedEducation).length > 0) {
          document.getElementById('education-qualifications').innerHTML = formatEducationQualifications(extractedEducation);
        } else {
          document.getElementById('education-qualifications').innerHTML = formatEducationQualifications(null);
        }
      }
    } catch (error) {
      console.error("Error processing education data:", error);
      document.getElementById('education-qualifications').innerHTML = 
        '<div class="analysis-category">' +
        '<div class="category-title"><i class="fas fa-exclamation-triangle"></i>Error Processing Education</div>' +
        '<p>There was an error processing your education information. Please ensure your education section is clearly formatted.</p>' +
        '</div>';
    }

    // Handle format & structure
    if (feedback.format_structure) {
      document.getElementById('format-structure').innerHTML = formatPresentationAnalysis(feedback.format_structure);
    } else {
      document.getElementById('format-structure').innerHTML = 'No format analysis available.';
    }

    // Handle improvement suggestions
    const suggestions = feedback.improvement_suggestions;
    const improvementGrid = document.getElementById('improvement-grid');
    improvementGrid.innerHTML = ''; // Clear previous suggestions

    if (Array.isArray(suggestions) && suggestions.length > 0) {
      suggestions.forEach((suggestion, index) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'improvement-item';
        suggestionItem.innerHTML = `
          <div class="item-title">
            <i class="fas fa-triangle-exclamation"></i>
            Suggestion ${index + 1}
          </div>
          <p class="mb-0">${suggestion}</p>
        `;
        improvementGrid.appendChild(suggestionItem);
      });
    } else {
      improvementGrid.innerHTML = '<p>No improvement suggestions available.</p>';
    }

    // Handle red flags
    if (feedback.red_flags && Array.isArray(feedback.red_flags) && feedback.red_flags.length > 0) {
      const redFlagsContainer = document.getElementById('red-flags');
      redFlagsContainer.innerHTML = '';
      
      feedback.red_flags.forEach((flag, index) => {
        const flagItem = document.createElement('div');
        flagItem.className = 'red-flag-item mb-3';
        flagItem.innerHTML = `
          <div class="item-title">
            <i class="fas fa-circle-exclamation"></i>
            ${flag.title || `Issue ${index + 1}`}
          </div>
          <p class="mb-0">${flag.description || flag}</p>
        `;
        redFlagsContainer.appendChild(flagItem);
      });
      
      redFlagsCard.style.display = 'block';
    } else {
      redFlagsCard.style.display = 'none';
    }

    // Display overall score
    const score = feedback.overall_score;
    let scoreColor = '';
    let scoreDisplay = '-';

    if (score !== undefined && score !== null) {
      scoreDisplay = score;
      
      if (score >= 8) {
        scoreColor = 'var(--success)';
      } else if (score >= 6) {
        scoreColor = 'var(--primary)';
      } else if (score <= 4) {
        scoreColor = 'var(--danger)';
      } else {
        scoreColor = 'var(--warning)';
      }
      
      // Update score circle
      scoreCircle.textContent = score;
      scoreCircle.style.background = `linear-gradient(135deg, ${scoreColor} 0%, ${scoreColor} 100%)`;
    }

    // Animate the appearance of each result card with staggered timing
    const resultCards = document.querySelectorAll('.result-card');
    resultCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, 100 * (index + 1));
    });

    // Show feedback section
    feedbackSection.style.display = 'block';
  }

  // Helper function to extract sections from raw text
  function extractSectionFromText(text, sectionKeywords) {
    if (!text || typeof text !== 'string') return null;
    
    const lines = text.split('\n');
    let inSection = false;
    let sectionContent = [];
    let nextSectionFound = false;
    
    // Common section headers in resumes
    const commonSections = [
      'education', 'experience', 'skills', 'projects', 'work history',
      'employment', 'qualifications', 'certifications', 'publications',
      'awards', 'achievements', 'interests', 'references', 'summary',
      'objective', 'personal information', 'contact'
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();
      
      // Check if this line is a section header we're looking for
      const isSectionHeader = sectionKeywords.some(keyword => 
        line.includes(keyword) && 
        (line.length < 30 || line.startsWith(keyword)) // Likely a header, not content
      );
      
      // Check if this line is the next section header
      const isNextSectionHeader = !isSectionHeader && commonSections.some(section => 
        line.includes(section) && 
        (line.length < 30 || line.startsWith(section)) && 
        !sectionKeywords.some(keyword => section.includes(keyword))
      );
      
      if (isSectionHeader) {
        inSection = true;
        continue; // Skip the header line
      }
      
      if (inSection && isNextSectionHeader) {
        nextSectionFound = true;
        break;
      }
      
      if (inSection && line.length > 0) {
        sectionContent.push(lines[i].trim());
      }
    }
    
    return sectionContent.length > 0 ? sectionContent.join('\n') : null;
  }

  function formatSkillsAssessment(skills) {
    if (typeof skills !== 'object' || skills === null) {
      return skills;
    }

    let html = '<div class="analysis-category">';
    html += '<div class="category-title"><i class="fas fa-check-circle"></i>Relevant Skills</div>';
    
    // Handle relevant skills
    if (skills.relevant_skills) {
      const relevantSkills = Array.isArray(skills.relevant_skills) ? skills.relevant_skills : [skills.relevant_skills];
      html += '<div class="strength-item mb-3">';
      html += '<ul class="mb-0">';
      relevantSkills.forEach(skill => {
        html += `<li>${skill}</li>`;
      });
      html += '</ul>';
      html += '</div>';
    } else if (skills.technical_skills || skills.soft_skills) {
      // If no explicit relevant skills but we have technical/soft skills, show those as relevant
      html += '<div class="strength-item mb-3">';
      html += '<ul class="mb-0">';
      
      if (skills.technical_skills) {
        const techSkills = Array.isArray(skills.technical_skills) 
          ? skills.technical_skills 
          : skills.technical_skills.split(',').map(s => s.trim());
        
        techSkills.forEach(skill => {
          html += `<li>${skill} (Technical)</li>`;
        });
      }
      
      if (skills.soft_skills) {
        const softSkills = Array.isArray(skills.soft_skills) 
          ? skills.soft_skills 
          : skills.soft_skills.split(',').map(s => s.trim());
        
        softSkills.forEach(skill => {
          html += `<li>${skill} (Soft Skill)</li>`;
        });
      }
      
      html += '</ul>';
      html += '</div>';
    } else {
      html += '<p>No specific relevant skills identified. Consider adding more prominent skills to your resume.</p>';
    }
    
    html += '</div>';
    
    // Handle missing skills
    if (skills.missing_skills || skills.skill_gaps) {
      const missingSkills = skills.missing_skills || skills.skill_gaps;
      html += '<div class="analysis-category">';
      html += '<div class="category-title"><i class="fas fa-triangle-exclamation"></i>Skill Gaps</div>';
      html += '<div class="improvement-item">';
      
      if (Array.isArray(missingSkills)) {
        html += '<ul class="mb-0">';
        missingSkills.forEach(skill => {
          html += `<li>${skill}</li>`;
        });
        html += '</ul>';
      } else {
        html += `<p class="mb-0">${missingSkills}</p>`;
      }
      
      html += '</div>';
      html += '</div>';
    }
    
    // Handle technical vs soft skills balance
    if (skills.technical_skills || skills.soft_skills) {
      html += '<div class="analysis-category">';
      html += '<div class="category-title"><i class="fas fa-balance-scale"></i>Skills Balance</div>';
      
      if (skills.technical_skills) {
        html += '<div class="mb-2"><strong>Technical Skills:</strong> ';
        html += Array.isArray(skills.technical_skills) ? skills.technical_skills.join(', ') : skills.technical_skills;
        html += '</div>';
      }
      
      if (skills.soft_skills) {
        html += '<div><strong>Soft Skills:</strong> ';
        html += Array.isArray(skills.soft_skills) ? skills.soft_skills.join(', ') : skills.soft_skills;
        html += '</div>';
      }
      
      html += '</div>';
    }
    
    return html;
  }

  function formatExperienceEvaluation(experience) {
    if (typeof experience !== 'object' || experience === null) {
      return experience;
    }

    let html = '';
    
    // Process all keys in the experience object
    for (const [key, value] of Object.entries(experience)) {
      // Replace underscores with spaces and capitalize for the title
      const formattedKey = capitalize(key.replace(/_/g, ' '));
      
      html += '<div class="analysis-category">';
      
      // Choose appropriate icon based on the key
      let icon = 'fa-briefcase';
      if (key.includes('achievement') || key.includes('impact')) {
        icon = 'fa-trophy';
      } else if (key.includes('progression') || key.includes('growth')) {
        icon = 'fa-chart-line';
      } else if (key.includes('relevance') || key.includes('alignment')) {
        icon = 'fa-bullseye';
      } else if (key.includes('stability') || key.includes('hopping')) {
        icon = 'fa-business-time';
      } else if (key.includes('gap')) {
        icon = 'fa-calendar-times';
      } else if (key.includes('quality')) {
        icon = 'fa-star';
      }
      
      html += `<div class="category-title"><i class="fas ${icon}"></i>${formattedKey}</div>`;
      
      // Format the value based on its type
      if (typeof value === 'string') {
        html += `<p>${value}</p>`;
      } else if (Array.isArray(value)) {
        html += '<ul>';
        value.forEach(item => {
          html += `<li>${item}</li>`;
        });
        html += '</ul>';
      } else if (typeof value === 'object' && value !== null) {
        html += '<ul>';
        for (const [subKey, subValue] of Object.entries(value)) {
          const formattedSubKey = capitalize(subKey.replace(/_/g, ' '));
          if (typeof subValue === 'string') {
            html += `<li><strong>${formattedSubKey}:</strong> ${subValue}</li>`;
          } else if (Array.isArray(subValue)) {
            html += `<li><strong>${formattedSubKey}:</strong> ${subValue.join(', ')}</li>`;
          } else if (typeof subValue === 'object' && subValue !== null) {
            html += `<li><strong>${formattedSubKey}:</strong> `;
            html += Object.entries(subValue)
              .map(([nestedKey, nestedValue]) => {
                const formattedNestedKey = capitalize(nestedKey.replace(/_/g, ' '));
                return `${formattedNestedKey}: ${nestedValue}`;
              })
              .join(', ');
            html += '</li>';
          }
        }
        html += '</ul>';
      }
      
      html += '</div>';
    }
    
    return html || formatFeedback(experience);
  }

  function formatEducationQualifications(education) {
    // Handle all possible input types
    if (education === null || education === undefined) {
      return '<p>No education information found in your resume. Make sure to include your educational background with degrees, institutions, and graduation dates in a clearly labeled section.</p>';
    }

    // If education is a string, display it directly
    if (typeof education === 'string') {
      return '<div class="analysis-category">' +
        '<div class="category-title"><i class="fas fa-graduation-cap"></i>Education Information</div>' +
        `<p>${education}</p>` +
        '</div>';
    }

    // If education is an array, format each item
    if (Array.isArray(education)) {
      let html = '<div class="analysis-category">' +
        '<div class="category-title"><i class="fas fa-graduation-cap"></i>Education Information</div>' +
        '<ul>';
      
      education.forEach(item => {
        if (typeof item === 'string') {
          html += `<li>${item}</li>`;
        } else if (typeof item === 'object' && item !== null) {
          html += `<li>${formatEducationObject(item)}</li>`;
        }
      });
      
      html += '</ul></div>';
      return html;
    }

    // If education is an object, process its properties
    if (typeof education === 'object') {
      let html = '';
      
      // Check for direct education properties (from the new API structure)
      if (education.university || education.degree || education.graduation_year || education.gpa) {
        html += '<div class="analysis-category">';
        html += '<div class="category-title"><i class="fas fa-graduation-cap"></i>Education Details</div>';
        html += '<div class="strength-item mb-3">';
        
        if (education.degree) {
          html += `<p><strong>Degree:</strong> ${education.degree}</p>`;
        }
        
        if (education.university) {
          html += `<p><strong>Institution:</strong> ${education.university}</p>`;
        }
        
        if (education.graduation_year) {
          html += `<p><strong>Graduation:</strong> ${education.graduation_year}</p>`;
        }
        
        if (education.gpa) {
          html += `<p><strong>GPA:</strong> ${education.gpa}</p>`;
        }
        
        html += '</div></div>';
      }
      
      // Check if it's an analysis object with specific education fields
      if (education.relevance || education.alignment || education.certifications || 
          education.continuing_education || education.professional_development) {
        
        // Handle education relevance
        if (education.relevance || education.alignment) {
          html += '<div class="analysis-category">';
          html += '<div class="category-title"><i class="fas fa-bullseye"></i>Education Relevance</div>';
          html += `<p>${education.relevance || education.alignment}</p>`;
          html += '</div>';
        }
        
        // Handle certifications
        if (education.certifications) {
          html += '<div class="analysis-category">';
          html += '<div class="category-title"><i class="fas fa-certificate"></i>Certifications</div>';
          
          if (Array.isArray(education.certifications)) {
            html += '<ul>';
            education.certifications.forEach(cert => {
              html += `<li>${cert}</li>`;
            });
            html += '</ul>';
          } else {
            html += `<p>${education.certifications}</p>`;
          }
          
          html += '</div>';
        }
        
        // Handle continuing education
        if (education.continuing_education || education.professional_development) {
          html += '<div class="analysis-category">';
          html += '<div class="category-title"><i class="fas fa-book-reader"></i>Continuing Education</div>';
          html += `<p>${education.continuing_education || education.professional_development}</p>`;
          html += '</div>';
        }
      } 
      
      // If no specific education fields found, try to format as a generic education object
      if (!html) {
        html += '<div class="analysis-category">';
        html += '<div class="category-title"><i class="fas fa-graduation-cap"></i>Education Information</div>';
        html += formatEducationObject(education);
        html += '</div>';
      }
      
      return html || '<p>Education details are missing or insufficient. Include your degree(s), institution(s), graduation date(s), and any relevant coursework or academic achievements.</p>';
    }
    
    // Fallback for any other data type
    return '<p>Education format is not recognized. Please ensure your education section is clearly formatted.</p>';
  }
  
  // Helper function to format education objects
  function formatEducationObject(edu) {
    if (!edu || typeof edu !== 'object') return '';
    
    let result = '<div>';
    
    // Common education-related keys to look for
    const degreeKeys = ['degree', 'qualification', 'major', 'program', 'course'];
    const institutionKeys = ['university', 'college', 'institution', 'school'];
    const dateKeys = ['graduation_date', 'graduation', 'year', 'completion_date', 'completion'];
    const gradeKeys = ['gpa', 'grade', 'score', 'marks'];
    
    // Extract degree information
    let degree = '';
    for (const key of degreeKeys) {
      if (edu[key]) {
        degree = edu[key];
        break;
      }
    }
    
    // Extract institution information
    let institution = '';
    for (const key of institutionKeys) {
      if (edu[key]) {
        institution = edu[key];
        break;
      }
    }
    
    // Extract date information
    let date = '';
    for (const key of dateKeys) {
      if (edu[key]) {
        date = edu[key];
        break;
      }
    }
    
    // Extract grade information
    let grade = '';
    for (const key of gradeKeys) {
      if (edu[key]) {
        grade = edu[key];
        break;
      }
    }
    
    // Format the education information
    if (degree) {
      result += `<strong>${degree}</strong>`;
      if (institution) result += ` from ${institution}`;
      if (date) result += ` (${date})`;
      if (grade) result += `, GPA/Grade: ${grade}`;
      result += '<br>';
    } else if (institution) {
      result += `<strong>${institution}</strong>`;
      if (date) result += ` (${date})`;
      if (grade) result += `, GPA/Grade: ${grade}`;
      result += '<br>';
    } else {
      // If no structured data is found, display all key-value pairs
      for (const [key, value] of Object.entries(edu)) {
        if (typeof value === 'string' || typeof value === 'number') {
          const formattedKey = capitalize(key.replace(/_/g, ' '));
          result += `<strong>${formattedKey}:</strong> ${value}<br>`;
        }
      }
    }
    
    result += '</div>';
    return result;
  }

  function formatPresentationAnalysis(format) {
    if (typeof format !== 'object' || format === null) {
      return format;
    }

    let html = '';
    
    // Handle organization and clarity
    if (format.organization || format.clarity) {
      html += '<div class="analysis-category">';
      html += '<div class="category-title"><i class="fas fa-th-list"></i>Organization & Clarity</div>';
      html += `<p>${format.organization || format.clarity}</p>`;
      html += '</div>';
    }
    
    // Handle length and conciseness
    if (format.length || format.conciseness) {
      html += '<div class="analysis-category">';
      html += '<div class="category-title"><i class="fas fa-text-width"></i>Length & Conciseness</div>';
      html += `<p>${format.length || format.conciseness}</p>`;
      html += '</div>';
    }
    
    // Handle formatting and readability
    if (format.formatting || format.readability) {
      html += '<div class="analysis-category">';
      html += '<div class="category-title"><i class="fas fa-eye"></i>Formatting & Readability</div>';
      html += `<p>${format.formatting || format.readability}</p>`;
      html += '</div>';
    }
    
    // Handle errors
    if (format.errors || format.grammar_spelling) {
      html += '<div class="analysis-category">';
      html += '<div class="category-title"><i class="fas fa-spell-check"></i>Grammar & Spelling</div>';
      html += `<p>${format.errors || format.grammar_spelling}</p>`;
      html += '</div>';
    }
    
    return html || formatFeedback(format);
  }

  function formatFeedback(feedback) {
    if (typeof feedback === 'object') {
      // Handle nested objects or arrays
      let result = '';
      for (const [key, value] of Object.entries(feedback)) {
        if (typeof value === 'object' && value !== null) {
          // For nested objects, recursively format them
          result += `<div class="mb-3"><strong>${capitalize(key)}:</strong></div>`;
          result += Object.entries(value)
            .map(([subKey, subValue]) => `<div class="ms-3 mb-2"><span class="text-primary">${capitalize(subKey)}:</span> ${subValue}</div>`)
            .join('');
        } else {
          result += `<div class="mb-2"><strong>${capitalize(key)}:</strong> ${value}</div>`;
        }
      }
      return result;
    }

    return feedback;
  }

  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  
  // Add drag and drop functionality
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    fileUploadArea.classList.add('has-file');
  }
  
  function unhighlight() {
    if (!fileInput.files.length) {
      fileUploadArea.classList.remove('has-file');
    }
  }
  
  fileUploadArea.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      fileInput.files = files;
      const file = files[0];
      
      if (file.type.includes('pdf')) {
        fileNameDisplay.innerHTML = `<i class="fas fa-check-circle text-success"></i> ${file.name}`;
        errorMessage.style.display = 'none';
      } else {
        fileNameDisplay.innerHTML = `<i class="fas fa-times-circle text-danger"></i> ${file.name} (Not a PDF)`;
        showError('Only PDF files are supported');
      }
    }
  }
});
