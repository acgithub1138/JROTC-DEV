
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEmailTemplates, EmailTemplate } from '@/hooks/email/useEmailTemplates';
import { useAvailableTables, useTableColumns, useEnhancedVariables } from '@/hooks/email/useTableColumns';
import { TemplateBasicFields } from './components/TemplateBasicFields';
import { SubjectField } from './components/SubjectField';
import { BodyField } from './components/BodyField';

interface EmailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: EmailTemplate | null;
  mode: 'create' | 'edit';
}

export const EmailTemplateDialog: React.FC<EmailTemplateDialogProps> = ({
  open,
  onOpenChange,
  template,
  mode,
}) => {
  const { createTemplate, updateTemplate } = useEmailTemplates();
  const { data: availableTables = [] } = useAvailableTables();
  
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    source_table: '',
    is_active: true,
  });

  const { data: columns = [] } = useTableColumns(formData.source_table);
  const { data: enhancedVariables = [] } = useEnhancedVariables(formData.source_table);

  useEffect(() => {
    if (template && mode === 'edit') {
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        source_table: template.source_table,
        is_active: template.is_active,
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        body: '',
        source_table: '',
        is_active: true,
      });
    }
  }, [template, mode, open]);

  const handleFormChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const variables_used = extractVariables(formData.subject + ' ' + formData.body);
    
    if (mode === 'edit' && template) {
      updateTemplate({
        id: template.id,
        ...formData,
        variables_used,
      });
    } else {
      createTemplate({
        ...formData,
        variables_used,
      });
    }
    
    onOpenChange(false);
  };

  const extractVariables = (text: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(text)) !== null) {
      if (!variables.includes(match[1].trim())) {
        variables.push(match[1].trim());
      }
    }
    
    return variables;
  };

  const insertVariable = (columnName: string) => {
    const variable = `{{${columnName}}}`;
    setFormData(prev => ({
      ...prev,
      body: prev.body + variable,
    }));
  };

  const insertVariableIntoSubject = (columnName: string) => {
    const variable = `{{${columnName}}}`;
    setFormData(prev => ({
      ...prev,
      subject: prev.subject + variable,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Email Template' : 'Create Email Template'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <TemplateBasicFields
            formData={formData}
            onFormChange={handleFormChange}
            availableTables={availableTables}
          />

          <SubjectField
            value={formData.subject}
            onChange={(subject) => handleFormChange({ subject })}
            columns={columns}
            enhancedVariables={enhancedVariables}
            onVariableInsert={insertVariableIntoSubject}
          />

          <BodyField
            value={formData.body}
            onChange={(body) => handleFormChange({ body })}
            columns={columns}
            enhancedVariables={enhancedVariables}
            onVariableInsert={insertVariable}
          />

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'edit' ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
