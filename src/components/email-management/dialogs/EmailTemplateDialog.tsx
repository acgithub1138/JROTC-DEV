import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailTemplates, EmailTemplate } from '@/hooks/email/useEmailTemplates';
import { useDynamicTableVariables, useEmailSourceTables } from '@/hooks/email/useDynamicTableVariables';
import { TemplateBasicFields } from './components/TemplateBasicFields';
import { SubjectField } from './components/SubjectField';
import { RichTextBodyField } from './components/RichTextBodyField';
import { VariablesPanel } from './components/VariablesPanel';
import { EmailPreviewDialog } from './EmailPreviewDialog';
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
  mode
}) => {
  const {
    createTemplate,
    updateTemplate
  } = useEmailTemplates();
  const { userProfile } = useAuth();
  const { data: availableTables = [] } = useEmailSourceTables();
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    source_table: '',
    recipient_field: '',
    is_active: true,
    is_global: false
  });
  const subjectRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  const initialFormData = template && mode === 'edit' ? {
    name: template.name,
    subject: template.subject,
    body: template.body,
    source_table: template.source_table,
    recipient_field: template.recipient_field || '',
    is_active: template.is_active,
    is_global: template.is_global || false
  } : {
    name: '',
    subject: '',
    body: '',
    source_table: '',
    recipient_field: '',
    is_active: true,
    is_global: false
  };
  const {
    hasUnsavedChanges,
    resetChanges
  } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: formData,
    enabled: open
  });
  
  // Use the new dynamic variables hook
  const { basicFields, referenceGroups, contextVariables } = useDynamicTableVariables(formData.source_table);
  useEffect(() => {
    if (template && mode === 'edit') {
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        source_table: template.source_table,
        recipient_field: template.recipient_field || '',
        is_active: template.is_active,
        is_global: template.is_global || false
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        body: '',
        source_table: '',
        recipient_field: '',
        is_active: true,
        is_global: false
      });
    }
  }, [template, mode, open]);
  const handleFormChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingClose(true);
    } else {
      onOpenChange(false);
    }
  };
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingClose(true);
    } else {
      onOpenChange(false);
    }
  };
  const handleDiscardChanges = () => {
    resetChanges();
    setShowUnsavedDialog(false);
    setPendingClose(false);
    onOpenChange(false);
  };
  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
    setPendingClose(false);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Use the new template processor to extract variables
    const variables_used = extractVariables(formData.subject + ' ' + formData.body);
    if (mode === 'edit' && template) {
      updateTemplate({
        id: template.id,
        ...formData,
        variables_used
      });
    } else {
      createTemplate({
        ...formData,
        variables_used
      });
    }
    resetChanges();
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
        handleFormChange({
          subject: newValue
        });
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
        quill.setSelection({
          index: position + variable.length,
          length: 0
        });

        // Update the form data
        const newContent = quill.root.innerHTML;
        handleFormChange({
          body: newContent
        });
      }
    }
  };
  const canPreview = formData.source_table && (formData.subject || formData.body);
  return <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {mode === 'edit' ? 'Edit Email Template' : 'Create Email Template'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <TemplateBasicFields formData={formData} onFormChange={handleFormChange} availableTables={availableTables} />

            {/* Global Template Checkbox - Only for Admins */}
            {userProfile?.role === 'admin' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_global"
                  checked={formData.is_global}
                  onCheckedChange={(checked) => handleFormChange({ is_global: !!checked })}
                />
                <Label htmlFor="is_global" className="text-sm font-medium">
                  Global Template (visible to all schools)
                </Label>
              </div>
            )}

            {/* Email Recipient Field */}
            <div className="space-y-2">
              <Label>Email Recipient</Label>
              <Select value={formData.recipient_field} onValueChange={value => handleFormChange({
              recipient_field: value
            })} disabled={!formData.source_table}>
                <SelectTrigger className="w-1/3">
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned_to">Assigned To</SelectItem>
                  <SelectItem value="assigned_by">Created By</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 gap-6">
              <div className="col-span-3 space-y-4">
                <SubjectField value={formData.subject} onChange={subject => handleFormChange({
                subject
              })} inputRef={subjectRef} />

                <RichTextBodyField value={formData.body} onChange={body => handleFormChange({
                body
              })} quillRef={quillRef} />
              </div>

              <div className="space-y-2">
                <VariablesPanel 
                  columns={basicFields.map(f => ({ name: f.name, label: f.label }))} 
                  enhancedVariables={[]} 
                  groupedReferenceFields={referenceGroups} 
                  contextVariables={contextVariables}
                  onVariableInsert={insertVariableAtCursor} 
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setShowPreview(true)} disabled={!canPreview}>
                Preview Email
              </Button>
              
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit">
                  {mode === 'edit' ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={handleDiscardChanges} onCancel={handleContinueEditing} />

      <EmailPreviewDialog open={showPreview} onOpenChange={setShowPreview} subject={formData.subject} body={formData.body} sourceTable={formData.source_table} />

    </>;
};