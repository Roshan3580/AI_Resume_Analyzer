
import React from 'react';
import { CheckCircle, AlertTriangle, TrendingUp, User, GraduationCap, FileText, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnalysisSection {
  title: string;
  content: string;
  score?: number;
  suggestions?: string[];
}

interface AnalysisResultsProps {
  results: {
    overallScore: number;
    sections: AnalysisSection[];
    timestamp: string;
  };
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5" />;
    return <TrendingUp className="w-5 h-5" />;
  };

  const sectionIcons: Record<string, React.ReactNode> = {
    'Skills Assessment': <Sparkles className="w-5 h-5" />,
    'Experience Evaluation': <User className="w-5 h-5" />,
    'Education Qualifications': <GraduationCap className="w-5 h-5" />,
    'Format & Structure': <FileText className="w-5 h-5" />,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Overall Score */}
      <Card className="rajasthani-border p-6 text-center">
        <div className="royal-shimmer p-4 rounded-lg mb-4">
          <h2 className="text-2xl font-bold mb-2">Overall Resume Score</h2>
          <div className={`text-6xl font-bold mb-2 ${getScoreColor(results.overallScore)}`}>
            {results.overallScore}%
          </div>
          <div className="flex items-center justify-center space-x-2">
            {getScoreIcon(results.overallScore)}
            <span className="text-muted-foreground">
              Analyzed on {new Date(results.timestamp).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="royal-divider"></div>
      </Card>

      {/* Analysis Sections */}
      <div className="grid gap-6">
        {results.sections.map((section, index) => (
          <Card key={index} className="rajasthani-border mandala-pattern p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                {sectionIcons[section.title] || <FileText className="w-5 h-5 text-white" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-foreground">
                    {section.title}
                  </h3>
                  {section.score && (
                    <Badge 
                      variant="secondary" 
                      className={`${getScoreColor(section.score)} bg-background border-2`}
                    >
                      {section.score}%
                    </Badge>
                  )}
                </div>
                
                <div className="prose prose-sm max-w-none mb-4">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {section.content}
                  </p>
                </div>
                
                {section.suggestions && section.suggestions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2 text-foreground">Recommendations:</h4>
                    <ul className="space-y-2">
                      {section.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-muted-foreground">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnalysisResults;
