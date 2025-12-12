import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import ReactQuill from 'react-quill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEmailTemplates, EmailTemplate } from '@/hooks/email/useEmailTemplates';
import { useDynamicTableVariables, useEmailSourceTables } from '@/hooks/email/useDynamicTableVariables';
import { extractVariables, renderEmailBuilderDocument } from '@/utils/templateProcessor';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { EmailBuilder, DEFAULT_DOCUMENT, type EmailBuilderDocument } from '@/components/email-builder';
import 'react-quill/dist/quill.snow.css';
const modules = {
  toolbar: [[{
    'header': [1, 2, 3, 4, 5, 6, false]
  }], ['bold', 'italic', 'underline', 'strike'], [{
    'list': 'ordered'
  }, {
    'list': 'bullet'
  }], [{
    'indent': '-1'
  }, {
    'indent': '+1'
  }], ['link'], [{
    'color': []
  }, {
    'background': []
  }], [{
    'align': []
  }], ['clean']]
};
const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'indent', 'link', 'color', 'background', 'align'];
export const EmailTemplateRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    id
  } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') as 'create' | 'edit' | 'view' || (id ? 'view' : 'create');
  const isMobile = useIsMobile();
  const {
    templates,
    createTemplate,
    updateTemplate,
    isLoading
  } = useEmailTemplates();
  const {
    userProfile
  } = useAuth();
  const permissions = useTablePermissions('email_templates');
  const {
    data: availableTables = []
  } = useEmailSourceTables();
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    body_json: DEFAULT_DOCUMENT as EmailBuilderDocument,
    editor_type: 'builder' as 'legacy' | 'builder',
    source_table: '',
    recipient_field: '',
    is_active: true,
    is_global: false
  });
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);

  // Find template if in edit/view mode
  const template = id ? templates.find(t => t.id === id) : null;
  const initialFormData = template && (mode === 'edit' || mode === 'view') ? {
    name: template.name,
    subject: template.subject,
    body: template.body,
    body_json: (template.body_json || DEFAULT_DOCUMENT) as EmailBuilderDocument,
    editor_type: (template.editor_type || 'legacy') as 'legacy' | 'builder',
    source_table: template.source_table,
    recipient_field: template.recipient_field || '',
    is_active: template.is_active,
    is_global: template.is_global || false
  } : {
    name: '',
    subject: '',
    body: '',
    body_json: DEFAULT_DOCUMENT as EmailBuilderDocument,
    editor_type: 'builder' as 'legacy' | 'builder',
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
    enabled: mode !== 'view'
  });

  // Use the new dynamic variables hook
  const {
    basicFields,
    referenceGroups,
    contextVariables
  } = useDynamicTableVariables(formData.source_table);
  useEffect(() => {
    if (template && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        body_json: (template.body_json || DEFAULT_DOCUMENT) as EmailBuilderDocument,
        editor_type: (template.editor_type || 'legacy') as 'legacy' | 'builder',
        source_table: template.source_table,
        recipient_field: template.recipient_field || '',
        is_active: template.is_active,
        is_global: template.is_global || false
      });
    }
  }, [template, mode]);
  const handleFormChange = useCallback((updates: Partial<typeof formData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  const handleNavigation = (path: string) => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      setPendingNavigation(path);
    } else {
      navigate(path);
    }
  };
  const handleDiscardChanges = () => {
    resetChanges();
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };
  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    // Render body from builder if using new editor
    let finalBody = formData.body;
    if (formData.editor_type === 'builder' && formData.body_json) {
      finalBody = renderEmailBuilderDocument(formData.body_json);
    }

    // Use the new template processor to extract variables
    const variables_used = extractVariables(formData.subject + ' ' + finalBody);
    if (mode === 'edit' && template) {
      updateTemplate({
        id: template.id,
        ...formData,
        body: finalBody,
        variables_used
      }, {
        onSuccess: () => {
          resetChanges();
          navigate('/app/email_templates');
          toast.success('Template updated successfully');
        }
      });
    } else {
      createTemplate({
        ...formData,
        body: finalBody,
        variables_used
      }, {
        onSuccess: () => {
          resetChanges();
          navigate('/app/email_templates');
          toast.success('Template created successfully');
        }
      });
    }
  };
  const insertVariableAtCursor = (variableName: string) => {
    if (mode === 'view') return;
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
    } else if (formData.editor_type === 'legacy') {
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
    // For builder editor, variable insertion is handled by EmailBuilder component
  };
  const handleBuilderChange = useCallback((doc: EmailBuilderDocument) => {
    handleFormChange({
      body_json: doc
    });
  }, [handleFormChange]);
  const getTitle = () => {
    switch (mode) {
      case 'create':
        return 'Create Email Template';
      case 'edit':
        return 'Edit Email Template';
      case 'view':
        return 'View Email Template';
      default:
        return 'Email Template';
    }
  };
  const canPreview = formData.source_table && (formData.subject || formData.body || formData.editor_type === 'builder' && formData.body_json);
  const isReadOnly = mode === 'view';
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }
  if (id && !template && !isLoading) {
    return <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Template Not Found</h1>
          <Button onClick={() => navigate('/app/email_templates')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Email Templates
          </Button>
        </div>
      </div>;
  }
  return <div className="container mx-auto p-6 space-y-6 overflow-x-hidden">
      {/* Back Button - Above header on mobile */}
      {isMobile && <Button variant="ghost" onClick={() => handleNavigation('/app/email_templates')} className="w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Email Templates
        </Button>}

      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}>
        <div className={`flex items-center ${isMobile ? 'flex-col items-start' : 'gap-4'}`}>
          {!isMobile && <Button variant="ghost" onClick={() => handleNavigation('/app/email_templates')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              ​
            </Button>}
          <h1 className="text-3xl font-bold">{getTitle()}</h1>
        </div>

        {!isMobile && <div className="flex items-center gap-2">
            {mode === 'view' && permissions.canEdit && <Button onClick={() => handleNavigation(`/app/email/template_record/${id}?mode=edit`)}>
                Edit Template
              </Button>}
            {mode !== 'view' && <Button type="button" variant="outline" onClick={() => {
          const previewBody = formData.editor_type === 'builder' && formData.body_json ? renderEmailBuilderDocument(formData.body_json) : formData.body;
          navigate('/app/email/email_preview_record', {
            state: {
              subject: formData.subject,
              body: previewBody,
              sourceTable: formData.source_table,
              from: location.pathname + location.search
            }
          });
        }} disabled={!canPreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview Email
              </Button>}
          </div>}

        {/* Mobile Action Buttons - Below header */}
        {isMobile && <div className="grid grid-cols-2 gap-2 w-full">
            {mode === 'view' && permissions.canEdit && <Button onClick={() => handleNavigation(`/app/email/template_record/${id}?mode=edit`)} className="w-full">
                Edit Template
              </Button>}
            {mode !== 'view' && <Button type="button" variant="outline" onClick={() => {
          const previewBody = formData.editor_type === 'builder' && formData.body_json ? renderEmailBuilderDocument(formData.body_json) : formData.body;
          navigate('/app/email/email_preview_record', {
            state: {
              subject: formData.subject,
              body: previewBody,
              sourceTable: formData.source_table,
              from: location.pathname + location.search
            }
          });
        }} disabled={!canPreview} className="w-full col-span-2">
                <Eye className="w-4 h-4 mr-2" />
                Preview Email
              </Button>}
          </div>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-3 gap-6'}`}>
              {/* Template Name */}
              <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                <Label htmlFor="name" className={isMobile ? '' : 'w-32 text-right'}>Template Name</Label>
                <Input id="name" value={formData.name} onChange={e => handleFormChange({
                name: e.target.value
              })} placeholder="Enter template name" className="flex-1" required disabled={isReadOnly} />
              </div>

              {/* Source Table */}
              <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                <Label className={isMobile ? '' : 'w-32 text-right'}>Source Table</Label>
                <Select value={formData.source_table} onValueChange={value => {
                // Reset recipient field when table changes
                handleFormChange({
                  source_table: value,
                  recipient_field: ''
                });
              }} disabled={isReadOnly}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTables.map(table => <SelectItem key={table.name} value={table.name}>
                        {table.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Active Status */}
              <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
                <Label className={isMobile ? '' : 'w-32 text-right'}>Active Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch checked={formData.is_active} onCheckedChange={checked => handleFormChange({
                  is_active: checked
                })} disabled={isReadOnly} />
                  <span className="text-sm text-muted-foreground">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Global Template Checkbox - Only for Admins */}
            {userProfile?.role === 'admin' && <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4 mt-6`}>
                <Label className={isMobile ? '' : 'w-32 text-right'}>Global Template</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox id="is_global" checked={formData.is_global} onCheckedChange={checked => handleFormChange({
                is_global: !!checked
              })} disabled={isReadOnly} />
                  <Label htmlFor="is_global" className="text-sm font-medium">
                    Visible to all schools
                  </Label>
                </div>
              </div>}

          </CardContent>
        </Card>

        {/* Recipient & Subject */}
        <Card>
          <CardHeader>
            <CardTitle>Recipient & Subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Recipient Field */}
            <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
              <Label htmlFor="recipient_field" className={isMobile ? '' : 'w-24 text-right shrink-0'}>Recipient</Label>
              <Input
                id="recipient_field"
                value={formData.recipient_field}
                onChange={e => handleFormChange({ recipient_field: e.target.value })}
                placeholder="e.g. {{contact.email}}"
                disabled={isReadOnly}
                className="flex-1"
              />
            </div>

            {/* Subject Field */}
            <div className={`flex ${isMobile ? 'flex-col' : 'items-center'} gap-4`}>
              <Label htmlFor="subject" className={isMobile ? '' : 'w-24 text-right shrink-0'}>Subject</Label>
              <Input
                ref={subjectRef}
                id="subject"
                value={formData.subject}
                onChange={e => handleFormChange({ subject: e.target.value })}
                placeholder="Enter email subject"
                required
                disabled={isReadOnly}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Body - Conditionally render based on editor_type */}
        <Card>
          <CardHeader>
            <CardTitle>Email Body</CardTitle>
          </CardHeader>
          <CardContent>
            {formData.editor_type === 'builder' ? <EmailBuilder initialDocument={formData.body_json} onChange={handleBuilderChange} columns={basicFields.map(f => ({
            name: f.name,
            label: f.label
          }))} groupedReferenceFields={referenceGroups} contextVariables={contextVariables} /> : <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-4'} gap-6`}>
                <div className={isMobile ? 'space-y-6' : 'col-span-3'}>
                  <div className="border rounded-md">
                    <ReactQuill ref={quillRef} theme="snow" value={formData.body} onChange={value => handleFormChange({
                  body: value
                })} modules={modules} formats={formats} style={{
                  minHeight: '300px'
                }} readOnly={isReadOnly} />
                  </div>
                </div>
                {/* Variables Panel for legacy editor */}
                <div className="space-y-2">
                  <Card className="h-fit">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Variables</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {basicFields.map(field => <Button key={field.name} type="button" variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => insertVariableAtCursor(field.name)} disabled={isReadOnly}>
                            {field.label}
                          </Button>)}
                        {referenceGroups.map(group => <div key={group.group} className="pt-2 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-1">{group.groupLabel}</p>
                            {group.fields.map(field => <Button key={field.name} type="button" variant="ghost" size="sm" className="w-full justify-start text-xs h-7" onClick={() => insertVariableAtCursor(field.name)} disabled={isReadOnly}>
                                {field.label}
                              </Button>)}
                          </div>)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>}
          </CardContent>
        </Card>

        {/* Actions */}
        {mode !== 'view' && <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'flex justify-end space-x-2'}`}>
            <Button type="button" variant="outline" onClick={() => handleNavigation('/app/email_templates')} className={isMobile ? 'w-full' : ''}>
              Cancel
            </Button>
            <Button type="submit" className={isMobile ? 'w-full' : ''}>
              {mode === 'edit' ? 'Update Template' : 'Create Template'}
            </Button>
          </div>}
      </form>

      <UnsavedChangesDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog} onDiscard={handleDiscardChanges} onCancel={handleContinueEditing} />
    </div>;
};