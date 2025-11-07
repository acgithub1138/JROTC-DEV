import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye } from 'lucide-react';
import { useCPScoreSheetsPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useCompetitionTemplates, type CompetitionTemplate } from '../my-competitions/hooks/useCompetitionTemplates';
import { TemplateForm } from '@/components/competition-management/components/TemplateForm';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { toast } from 'sonner';

export const ScoreSheetRecordPage = () => {
  const navigate = useNavigate();
  const { '*': splat } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'view';
  const templateId = searchParams.get('id');

  const [template, setTemplate] = useState<CompetitionTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useBuilder, setUseBuilder] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const { canCreate, canUpdate, canViewDetails } = useCPScoreSheetsPermissions();
  const { createTemplate, updateTemplate, templates, isLoading: templatesLoading } = useCompetitionTemplates();

  // Load template data if editing/viewing
  useEffect(() => {
    const loadTemplate = async () => {
      if (mode === 'create') {
        setTemplate(null);
        setIsLoading(false);
        return;
      }

      if (!templateId) {
        setError('Template ID is required for view/edit mode');
        setIsLoading(false);
        return;
      }

      // Wait for templates to be loaded
      if (templatesLoading) {
        setIsLoading(true);
        return;
      }

      try {
        setIsLoading(true);
        const foundTemplate = templates.find(t => t.id === templateId);
        if (!foundTemplate) {
          setError('Template not found');
        } else {
          setTemplate(foundTemplate);
          setError(null);
        }
      } catch (err) {
        setError('Failed to load template');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplate();
  }, [templateId, mode, templates, templatesLoading]);

  // Check permissions
  useEffect(() => {
    if (mode === 'create' && !canCreate) {
      setError('You do not have permission to create templates');
    } else if (mode === 'edit' && !canUpdate) {
      setError('You do not have permission to edit templates');
    } else if (mode === 'view' && !canViewDetails) {
      setError('You do not have permission to view template details');
    }
  }, [mode, canCreate, canUpdate, canViewDetails]);

  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(path);
      setShowConfirmDialog(true);
    } else {
      navigate(path);
    }
  };

  const handleBack = () => {
    handleNavigation('/app/competition-portal/score-sheets');
  };

  const handleSubmit = async (data: any) => {
    try {
      if (mode === 'create') {
        await createTemplate(data);
        toast.success('Template created successfully');
      } else if (mode === 'edit' && template) {
        await updateTemplate(template.id, data);
        toast.success('Template updated successfully');
      }
      setHasUnsavedChanges(false);
      navigate('/app/competition-portal/score-sheets');
    } catch (error) {
      console.error('Error submitting template:', error);
    }
  };

  const handleCancel = () => {
    handleNavigation('/app/competition-portal/score-sheets');
  };

  const handleConfirmNavigation = () => {
    setShowConfirmDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
  };

  const getPageTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create Score Sheet Template';
      case 'edit':
        return 'Edit Score Sheet Template';
      case 'view':
        return 'View Score Sheet Template';
      default:
        return 'Score Sheet Template';
    }
  };

  const renderScoreField = (field: any, index: number) => {
    const fieldType = field.type || 'text';
    const fieldName = field.name || `Field ${index + 1}`;
    const isBoldGray = field.pauseField || field.type === 'bold_gray' || field.type === 'pause';

    if (fieldType === 'section_header') {
      return (
        <div key={index} className="border-b-2 border-primary pb-2">
          <h3 className="text-lg font-bold text-primary">{fieldName}</h3>
        </div>
      );
    }

    if (fieldType === 'label' || fieldType === 'bold_gray' || fieldType === 'pause') {
      return (
        <div key={index} className="py-2">
          {isBoldGray ? (
            <div className="bg-muted px-3 py-2 rounded">
              <span className="font-bold">{fieldName}</span>
            </div>
          ) : (
            <span className="font-medium">{fieldName}</span>
          )}
          {field.fieldInfo && (
            <p className="text-sm text-muted-foreground mt-2">{field.fieldInfo}</p>
          )}
        </div>
      );
    }

    if (fieldType === 'penalty') {
      return (
        <div key={index} className="py-2 border-b space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium text-destructive">{fieldName}</span>
            <div className="flex items-center gap-2">
              {field.penaltyType === 'points' ? (
                <input className="border rounded px-2 py-1 w-32" disabled placeholder="Number of violations" />
              ) : field.penaltyType === 'minor_major' ? (
                <select className="border rounded px-2 py-1 w-32" disabled>
                  <option>Select type</option>
                  <option>Minor (-20)</option>
                  <option>Major (-50)</option>
                </select>
              ) : (
                <input className="border rounded px-2 py-1 w-32" disabled />
              )}
            </div>
          </div>
          {field.fieldInfo && (
            <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>
          )}
          {field.penaltyType === 'points' && field.pointValue && (
            <p className="text-xs text-destructive">Each violation: {field.pointValue} points</p>
          )}
        </div>
      );
    }

    return (
      <div key={index} className="border-b space-y-2 py-[2px]">
        <div className="flex items-center justify-between">
          <span className={isBoldGray ? "font-bold bg-muted px-3 py-2 rounded" : "font-medium"}>
            {fieldName}
          </span>
          <div className="flex items-center gap-2">
            <input className="border rounded px-2 py-1 w-32" disabled />
          </div>
        </div>
        {field.fieldInfo && (
          <p className="text-sm text-muted-foreground">{field.fieldInfo}</p>
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
          {section.fields.map((field: any, fieldIndex: number) => renderScoreField(field, fieldIndex))}
        </CardContent>
      </Card>
    );
  };

  const renderScoreStructure = () => {
    if (!template?.scores || typeof template.scores !== 'object') {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>No score structure defined for this template</p>
        </div>
      );
    }

    const scores = template.scores as any;

    if (scores.sections && Array.isArray(scores.sections)) {
      return (
        <div className="space-y-4">
          {scores.sections.map((section: any, index: number) => renderScoreSection(section, index))}
        </div>
      );
    } else if (scores.criteria && Array.isArray(scores.criteria)) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Score Sheet Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/20 p-6 bg-background">
              <div className="space-y-6">
                {scores.criteria.map((field: any, index: number) => renderScoreField(field, index))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } else {
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

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-lg mb-4">{error}</div>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Button onClick={handleBack} variant="outline" size="sm">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Templates
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{getPageTitle()}</h1>
          {template && (
            <p className="text-muted-foreground">
              Template: {template.template_name}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {(mode === 'create' || mode === 'edit') && (
            <Button onClick={() => setUseBuilder(!useBuilder)} variant="outline" size="sm">
              {useBuilder ? 'Manual JSON' : 'Field Builder'}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {mode === 'view' ? (
          <div className="space-y-6">
            {/* Template Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Template Information
                  <Eye className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Event Type</div>
                    <div className="mt-1">
                      <Badge variant="outline">{template?.competition_event_types?.name || template?.event}</Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">JROTC Program</div>
                    <div className="mt-1">
                      <Badge variant="secondary">
                        {template?.jrotc_program.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {(template as any)?.description && (
                  <div>
                    <div className="text-sm font-medium">Description</div>
                    <p className="mt-1 text-sm text-muted-foreground">{(template as any).description}</p>
                  </div>
                )}
                
                <div>
                  <div className="text-sm font-medium">Template Source</div>
                  <div className="mt-1">
                    {(template as any)?.is_global ? (
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
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {mode === 'create' ? 'Create New Template' : 'Edit Template'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateForm
                template={template}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                onFormChange={setHasUnsavedChanges}
                useBuilder={useBuilder}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog 
        open={showConfirmDialog} 
        onOpenChange={setShowConfirmDialog}
        onDiscard={handleConfirmNavigation}
        onCancel={handleCancelNavigation}
        title="Unsaved Changes"
        description="You have unsaved changes that will be lost if you leave this page. Are you sure you want to continue?"
      />
    </div>
  );
};