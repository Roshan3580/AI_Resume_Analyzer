
import React, { useState } from 'react';
import { Key, Eye, EyeOff, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, onApiKeyChange }) => {
  const [showKey, setShowKey] = useState(false);

  return (
    <Card className="rajasthani-border p-6 mb-6">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-royal-burgundy to-royal-gold flex items-center justify-center flex-shrink-0">
          <Key className="w-6 h-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2 text-foreground">
            Groq API Key
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your Groq API key to enable AI-powered resume analysis. Your key is stored locally and never sent to our servers.
          </p>
          
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              placeholder="Enter your Groq API key..."
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              className="pr-12 h-12 text-base border-2 focus:border-primary"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <div className="mt-3 flex items-center text-xs text-muted-foreground">
            <Shield className="w-3 h-3 mr-1" />
            <span>Your API key is stored securely in your browser and never shared</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ApiKeyInput;
