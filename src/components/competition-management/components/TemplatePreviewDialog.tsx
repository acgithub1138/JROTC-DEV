import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';
import { CompetitionTemplate } from '../types';

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: CompetitionTemplate | null;
}

export const TemplatePreviewDialog: React.FC<TemplatePreviewDialogProps> = ({
  open,
  onOpenChange,
  template,
}) => {
  if (!template) return null;

  const renderScoreField = (field: any, index: number) => {
    const fieldType = field.type || 'text';
    const fieldName = field.name || `Field ${index + 1}`;
    const isRequired = field.required || false;
    const maxLength = field.maxLength;
    const isPenalty = field.penalty || false;

    return (
      <div key={index} className="space-y-2">
        <Label htmlFor={`field-${index}`} className="flex items-center gap-2">
          {fieldName}
          {isRequired && <span className="text-red-500">*</span>}
          {isPenalty && (
            <Badge variant="destructive" className="text-xs">
              Penalty
            </Badge>
          )}
        </Label>
        
        {fieldType === 'textarea' ? (
          <Textarea
            id={`field-${index}`}
            placeholder={field.placeholder || `Enter ${fieldName.toLowerCase()}`}
            disabled
            rows={3}
          />
        ) : fieldType === 'number' ? (
          <Input
            id={`field-${index}`}
            type="number"
            placeholder={field.placeholder || "0"}
            min={field.min}
            max={field.max}
            step={field.step}
            disabled
          />
        ) : (
          <Input
            id={`field-${index}`}
            type="text"
            placeholder={field.placeholder || `Enter ${fieldName.toLowerCase()}`}
            maxLength={maxLength}
            disabled
          />
        )}
        
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        
        {maxLength && fieldType === 'text' && (
          <p className="text-xs text-muted-foreground">
            Maximum {maxLength} characters
          </p>
        )}
      </div>
    );
  };

  const renderScoreSection = (section: any, sectionIndex: number) => {
    if (!section.fields || !Array.isArray(section.fields)) {
      return null;
    }

    return (
      <Card key={sectionIndex} className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{section.name || `Section ${sectionIndex + 1}`}</CardTitle>
          {section.description && (
            <p className="text-sm text-muted-foreground">{section.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {section.fields.map((field: any, fieldIndex: number) => 
            renderScoreField(field, fieldIndex)
          )}
        </CardContent>
      </Card>
    );
  };

  const renderScoreStructure = () => {
    if (!template.scores || typeof template.scores !== 'object') {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No score structure defined for this template</p>
        </div>
      );
    }

    // Handle different score structure formats
    if (template.scores.sections && Array.isArray(template.scores.sections)) {
      // Sectioned format
      return (
        <div className="space-y-4">
          {template.scores.sections.map((section: any, index: number) => 
            renderScoreSection(section, index)
          )}
        </div>
      );
    } else if (template.scores.criteria && Array.isArray(template.scores.criteria)) {
      // Simple criteria format
      return (
        <Card>
          <CardHeader>
            <CardTitle>Score Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {template.scores.criteria.map((field: any, index: number) => 
              renderScoreField(field, index)
            )}
          </CardContent>
        </Card>
      );
    } else {
      // Custom or unrecognized format - show JSON
      return (
        <Card>
          <CardHeader>
            <CardTitle>Score Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(template.scores, null, 2)}
            </pre>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Template Preview: {template.template_name}
            {template.is_global && (
              <div title="Global Template">
                <Globe className="w-4 h-4 text-blue-500" />
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Template Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Event Type</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{template.event}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">JROTC Program</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {template.jrotc_program.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {template.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium">Template Source</Label>
                <div className="mt-1">
                  {template.is_global ? (
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      Global Template
                    </Badge>
                  ) : (
                    <Badge variant="outline">School Template</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Sheet Preview */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Score Sheet Preview</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This is how the score sheet would appear to users filling it out (all fields are disabled in this preview):
            </p>
            {renderScoreStructure()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};