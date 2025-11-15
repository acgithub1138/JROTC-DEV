import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { JsonFieldBuilder } from './JsonFieldBuilder';
import { AiTemplateGeneratorModal } from './AiTemplateGeneratorModal';
import { toast } from 'sonner';

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
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const handleTemplateGenerated = (template: Record<string, any>) => {
    updateFormData('scores', template);
    setAiModalOpen(false);
    toast.success('Template generated successfully!');
  };

  return (
    <div className="space-y-2">        
      {useBuilder ? (
        <JsonFieldBuilder 
          value={formData.scores} 
          onChange={scores => updateFormData('scores', scores)} 
        />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Score Sheet Structure</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAiModalOpen(true)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate with AI
            </Button>
          </div>
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

      <AiTemplateGeneratorModal
        open={aiModalOpen}
        onOpenChange={setAiModalOpen}
        onTemplateGenerated={handleTemplateGenerated}
      />
    </div>
  );
};