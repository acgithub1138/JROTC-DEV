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
  template
}) => {
  if (!template) return null;
  const renderScoreField = (field: any, index: number) => {
    const fieldType = field.type || 'text';
    const fieldName = field.name || `Field ${index + 1}`;
    const isBoldGray = field.pauseField || field.type === 'bold_gray' || field.type === 'pause';

    // Handle section headers
    if (fieldType === 'section_header') {
      return <div key={index} className="border-b-2 border-primary pb-2">
          <h3 className="text-lg font-bold text-primary">{fieldName}</h3>
        </div>;
    }

    // Handle bold and grey fields (label-only display)
    if (fieldType === 'label' || fieldType === 'bold_gray' || fieldType === 'pause') {
      return <div key={index} className="py-2">
          {isBoldGray ? <div className="bg-muted px-3 py-2 rounded">
              <span className="font-bold">{fieldName}</span>
            </div> : <span className="font-medium">{fieldName}</span>}
          {field.fieldInfo && <p className="text-sm text-muted-foreground mt-2">{field.fieldInfo}</p>}
        </div>;
    }

    // Handle penalty fields
    if (fieldType === 'penalty') {
      return <div key={index} className="py-2 border-b space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-destructive">{fieldName}</span>
            <div className="flex items-center gap-2">
              {field.penaltyType === 'points' ? <input className="border rounded px-2 py-1 w-32" disabled placeholder="Number of violations" /> : field.penaltyType === 'minor_major' ? <select className="border rounded px-2 py-1 w-32" disabled>
                  <option>Select type</option>
                  <option>Minor (-20)</option>
                  <option>Major (-50)</option>
                </select> : <input className="border rounded px-2 py-1 w-32" disabled />}
            </div>
          </div>
          {field.fieldInfo && <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>}
          {field.penaltyType === 'points' && field.pointValue && <p className="text-xs text-destructive">Each violation: {field.pointValue} points</p>}
        </div>;
    }

    // Handle input fields with the same layout as ScoreSheetPreview
    return <div key={index} className="border-b space-y-2 py-[2px]">
        <div className="flex items-center justify-between">
          <span className={isBoldGray ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}>
            {fieldName}
          </span>
          <div className="flex items-center gap-2">
            <input className="border rounded px-2 py-1 w-32" disabled />
          </div>
        </div>
        {field.fieldInfo && <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>}
      </div>;
  };
  const renderScoreSection = (section: any, sectionIndex: number) => {
    if (!section.fields || !Array.isArray(section.fields)) {
      return null;
    }
    return <Card key={sectionIndex} className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{section.name || `Section ${sectionIndex + 1}`}</CardTitle>
          {section.description && <p className="text-sm text-muted-foreground">{section.description}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          {section.fields.map((field: any, fieldIndex: number) => renderScoreField(field, fieldIndex))}
        </CardContent>
      </Card>;
  };
  const renderScoreStructure = () => {
    if (!template.scores || typeof template.scores !== 'object') {
      return <div className="text-center py-8 text-muted-foreground">
          <p>No score structure defined for this template</p>
        </div>;
    }

    // Handle different score structure formats
    if (template.scores.sections && Array.isArray(template.scores.sections)) {
      // Sectioned format
      return <div className="space-y-4">
          {template.scores.sections.map((section: any, index: number) => renderScoreSection(section, index))}
        </div>;
    } else if (template.scores.criteria && Array.isArray(template.scores.criteria)) {
      // Simple criteria format
      return <Card>
          <CardHeader>
            <CardTitle>Score Sheet Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/20 p-6 bg-background">
              <div className="space-y-6">
                {template.scores.criteria.map((field: any, index: number) => renderScoreField(field, index))}
              </div>
            </div>
          </CardContent>
        </Card>;
    } else {
      // Custom or unrecognized format - show JSON
      return <Card>
          <CardHeader>
            <CardTitle>Score Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded overflow-auto">
              {JSON.stringify(template.scores, null, 2)}
            </pre>
          </CardContent>
        </Card>;
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Template Preview: {template.template_name}
            {template.is_global && <div title="Global Template">
                <Globe className="w-4 h-4 text-blue-500" />
              </div>}
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
              
              {template.description && <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                </div>}
              
              <div>
                <Label className="text-sm font-medium">Template Source</Label>
                <div className="mt-1">
                  {template.is_global ? <Badge variant="default" className="bg-blue-100 text-blue-800">
                      Global Template
                    </Badge> : <Badge variant="outline">School Template</Badge>}
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
    </Dialog>;
};