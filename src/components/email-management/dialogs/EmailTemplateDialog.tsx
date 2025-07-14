
import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEmailTemplates, EmailTemplate } from '@/hooks/email/useEmailTemplates';
import { useAvailableTables, useTableColumns, useEnhancedVariables, useGroupedReferenceFields } from '@/hooks/email/useTableColumns';
import { TemplateBasicFields } from './components/TemplateBasicFields';
import { SubjectField } from './components/SubjectField';
import { RichTextBodyField } from './components/RichTextBodyField';
import { VariablesPanel } from './components/VariablesPanel';

import { extractVariables } from '@/utils/templateProcessor';

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

  const subjectRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  

  const { data: columns = [] } = useTableColumns(formData.source_table);
  const { data: enhancedVariables = [] } = useEnhancedVariables(formData.source_table);
  const { data: groupedReferenceFields = [] } = useGroupedReferenceFields(formData.source_table);

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
    
    // Use the new template processor to extract variables
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

  const insertVariableAtCursor = (variableName: string) => {
    const variable = `{{${variableName}}}`;
    
    // Check if subject field is focused
    if (document.activeElement === subjectRef.current) {
      const input = subjectRef.current;
      if (input) {
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const newValue = formData.subject.slice(0, start) + variable + formData.subject.slice(end);
        handleFormChange({ subject: newValue });
        
        setTimeout(() => {
          input.focus();
          input.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
      }
    } else {
      // Insert into Quill editor
      if (quillRef.current) {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        const position = range ? range.index : quill.getLength();
        
        quill.insertText(position, variable);
        quill.setSelection({ index: position + variable.length, length: 0 });
        
        // Update the form data
        const newContent = quill.root.innerHTML;
        handleFormChange({ body: newContent });
      }
    }
  };

  

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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

            <div className="grid grid-cols-4 gap-6">
              <div className="col-span-3 space-y-4">
                <SubjectField
                  value={formData.subject}
                  onChange={(subject) => handleFormChange({ subject })}
                  inputRef={subjectRef}
                />

                <RichTextBodyField
                  value={formData.body}
                  onChange={(body) => handleFormChange({ body })}
                  quillRef={quillRef}
                />
              </div>

              <div className="space-y-2">
                <VariablesPanel
                  columns={columns.map(col => ({ 
                    name: col.column_name, 
                    label: col.display_label 
                  }))}
                  enhancedVariables={enhancedVariables.map(ev => ({ 
                    name: ev.variable, 
                    label: ev.label,
                    description: 'Profile reference'
                  }))}
                  groupedReferenceFields={groupedReferenceFields}
                  onVariableInsert={insertVariableAtCursor}
                />
              </div>
            </div>

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

    </>
  );
};
