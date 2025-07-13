import React, { useState } from 'react';
import { Crown, FileText, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import FileUpload from '@/components/FileUpload';
import ApiKeyInput from '@/components/ApiKeyInput';
import AnalysisResults from '@/components/AnalysisResults';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AnalysisSection {
  title: string;
  content: string;
  score?: number;
  suggestions?: string[];
}

interface AnalysisResults {
  overallScore: number;
  sections: AnalysisSection[];
  timestamp: string;
}

const Index = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('groq_api_key') || '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    localStorage.setItem('groq_api_key', key);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    toast.success(`Resume "${file.name}" uploaded successfully!`);
  };

  const handleAnalyze = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your Groq API key first.');
      return;
    }

    if (!selectedFile) {
      toast.error('Please upload a resume file first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('api_key', apiKey);

      const apiUrl = 'https://ai-resume-analyzer-backend-iwpf.onrender.com';
      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Map backend response to frontend format
      const feedback = data.feedback;
      if (!feedback) {
        toast.error('No feedback received from backend.');
        return;
      }

      // Convert backend JSON to AnalysisResults format
      const sections: AnalysisSection[] = [
        feedback.skills_assessment && {
          title: 'Skills Assessment',
          content: [
            `Technical Skills: ${(feedback.skills_assessment.technical_skills || []).join(', ')}`,
            `Soft Skills: ${(feedback.skills_assessment.soft_skills || []).join(', ')}`,
            `Relevant Skills: ${(feedback.skills_assessment.relevant_skills || []).join(', ')}`,
            `Skill Gaps: ${(feedback.skills_assessment.skill_gaps || []).join(', ')}`,
          ].join('\n'),
          score: undefined,
          suggestions: undefined,
        },
        feedback.experience_evaluation && {
          title: 'Experience Evaluation',
          content: Object.entries(feedback.experience_evaluation)
            .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: ${v}`)
            .join('\n'),
          score: undefined,
          suggestions: undefined,
        },
        feedback.education_qualifications && {
          title: 'Education Qualifications',
          content: (Array.isArray(feedback.education_qualifications)
            ? feedback.education_qualifications.map((entry) => {
                const lines = [
                  entry.University ? `University: ${entry.University}` : null,
                  entry.Degree ? `Degree: ${entry.Degree}` : null,
                  entry['Graduation Year'] ? `Graduation Year: ${entry['Graduation Year']}` : null,
                  entry.GPA ? `GPA: ${entry.GPA}` : null,
                ].filter(Boolean);
                return lines.join('\n');
              }).join('\n\n')
            : ''),
          score: undefined,
          suggestions: undefined,
        },
        feedback.format_structure && {
          title: 'Format & Structure',
          content: Object.entries(feedback.format_structure)
            .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: ${v}`)
            .join('\n'),
          score: undefined,
          suggestions: undefined,
        },
      ].filter(Boolean) as AnalysisSection[];

      // Add improvement suggestions if present
      if (feedback.improvement_suggestions) {
        const improvementSection: AnalysisSection = {
          title: 'Improvement Suggestions',
          content: '',
          score: undefined,
          suggestions: feedback.improvement_suggestions,
        };
        sections.push(improvementSection);
      }

      setAnalysisResults({
        overallScore: feedback.overall_score || 0,
        sections,
        timestamp: new Date().toISOString(),
      });
      toast.success('Resume analysis completed!');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedFile(null);
    setAnalysisResults(null);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-royal-bronze flex items-center justify-center float-animation">
              <Crown className="w-8 h-8 text-royal-cream" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-royal-bronze">
            AI Resume Analyzer
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Transform your resume with AI-powered insights. Get personalized feedback on skills, experience, and formatting to land your dream job.
          </p>
          
          <div className="royal-divider max-w-md mx-auto"></div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: <FileText className="w-6 h-6" />,
              title: 'Smart Analysis',
              description: 'AI-powered analysis of your resume content, structure, and impact'
            },
            {
              icon: <Zap className="w-6 h-6" />,
              title: 'Instant Results',
              description: 'Get detailed feedback and improvement suggestions in seconds'
            },
            {
              icon: <Shield className="w-6 h-6" />,
              title: 'Privacy First',
              description: 'Your resume data is processed securely and never stored'
            }
          ].map((feature, index) => (
            <Card key={index} className="rajasthani-border mandala-pattern p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="w-12 h-12 rounded-full bg-royal-beige flex items-center justify-center mx-auto mb-4">
                <div className="text-royal-bronze">
                  {feature.icon}
                </div>
              </div>
              <h3 className="font-semibold mb-2 text-royal-bronze">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Main Interface */}
        <div className="space-y-8">
          {/* API Key Input */}
          <ApiKeyInput apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />

          {/* File Upload or Results */}
          {!analysisResults ? (
            <>
              <FileUpload onFileSelect={handleFileSelect} isAnalyzing={isAnalyzing} />
              
              {selectedFile && (
                <Card className="rajasthani-border mandala-pattern p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-royal-bronze" />
                      <div>
                        <p className="font-semibold text-royal-bronze">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-x-3">
                      <Button variant="outline" onClick={resetAnalysis}>
                        Remove
                      </Button>
                      <Button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !apiKey.trim()}
                        className="bg-royal-bronze hover:bg-royal-bronze/90 text-royal-cream"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Analyze Resume
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
              
              {isAnalyzing && <LoadingSpinner />}
            </>
          ) : (
            <>
              <AnalysisResults results={analysisResults} />
              
              <div className="text-center">
                <Button 
                  onClick={resetAnalysis}
                  variant="outline"
                  size="lg"
                  className="px-8 border-royal-bronze text-royal-bronze hover:bg-royal-beige"
                >
                  Analyze Another Resume
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 py-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Built with AI-powered analysis • Your privacy is our priority
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
