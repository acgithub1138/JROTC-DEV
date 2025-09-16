import React from 'react';
import { Button } from '@/components/ui/button';
import { useTemplateForm } from '../../../hooks/competition-management/useTemplateForm';
import { TemplateFormFields } from './TemplateFormFields';
import { ScoreBuilder } from './ScoreBuilder';
import type { CompetitionTemplate } from '../types';
import type { Database } from '@/integrations/supabase/types';

type DatabaseCompetitionTemplate = Database['public']['Tables']['competition_templates']['Row'];

interface TemplateFormProps {
  template?: CompetitionTemplate | DatabaseCompetitionTemplate | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  onFormChange?: (hasChanges: boolean) => void;
  useBuilder: boolean;
}

export const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  onSubmit,
  onCancel,
  onFormChange,
  useBuilder
}) => {
  const {
    formData,
    updateFormData,
    isSubmitting,
    setIsSubmitting,
    jsonText,
    jsonError,
    isAdmin,
    handleJsonTextChange,
    validateAndPrepareSubmission
  } = useTemplateForm({ template, onFormChange, useBuilder });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const submissionData = validateAndPrepareSubmission();
    if (!submissionData) return;

    try {
      setIsSubmitting(true);
      await onSubmit(submissionData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TemplateFormFields
        formData={formData}
        updateFormData={updateFormData}
        isAdmin={isAdmin}
        template={template}
      />

      <div className="space-y-2">        
        <ScoreBuilder
          useBuilder={useBuilder}
          formData={formData}
          updateFormData={updateFormData}
          jsonText={jsonText}
          jsonError={jsonError}
          handleJsonTextChange={handleJsonTextChange}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : template ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};