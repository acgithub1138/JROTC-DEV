import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { JsonFieldBuilder } from './JsonFieldBuilder';

interface ScoreBuilderProps {
  useBuilder: boolean;
  formData: {
    scores: Record<string, any>;
  };
  updateFormData: (field: string, value: any) => void;
  jsonText: string;
  jsonError: string | null;
  handleJsonTextChange: (value: string) => void;
}

export const ScoreBuilder: React.FC<ScoreBuilderProps> = ({
  useBuilder,
  formData,
  updateFormData,
  jsonText,
  jsonError,
  handleJsonTextChange
}) => {
  return (
    <div className="space-y-2">        
      {useBuilder ? (
        <JsonFieldBuilder 
          value={formData.scores} 
          onChange={scores => updateFormData('scores', scores)} 
        />
      ) : (
        <div className="space-y-2">
          <Label>Score Sheet Structure</Label>
          <Textarea 
            value={jsonText} 
            onChange={e => handleJsonTextChange(e.target.value)} 
            rows={10} 
            className="font-mono text-sm" 
            placeholder={`{
  "criteria": [
    {
      "name": "Uniform Inspection",
      "type": "text",
      "maxLength": 100,
      "penalty": false
    }
  ]
}`} 
          />
          {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}
          <p className="text-sm text-muted-foreground">
            Define the JSON structure for this score sheet template.
          </p>
        </div>
      )}
    </div>
  );
};