
import React from 'react';
import { Loader, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Analyzing your resume with AI..." 
}) => {
  return (
    <Card className="rajasthani-border mandala-pattern p-12 text-center">
      <div className="space-y-6">
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">
            AI Analysis in Progress
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {message}
          </p>
        </div>
        
        <div className="flex justify-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 bg-primary rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            ></div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default LoadingSpinner;
