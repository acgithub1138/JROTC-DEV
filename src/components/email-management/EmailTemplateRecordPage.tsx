import React, { useState, useEffect, useRef } from 'react';
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
import { useAvailableTables, useTableColumns, useEnhancedVariables, useGroupedReferenceFields } from '@/hooks/email/useTableColumns';
import { VariablesPanel } from './dialogs/components/VariablesPanel';
import { extractVariables } from '@/utils/templateProcessor';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { toast } from 'sonner';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['link'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    ['clean']
  ],
};

const formats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'list', 'bullet', 'indent', 'link', 'color', 'background', 'align'
];

export const EmailTemplateRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') as 'create' | 'edit' | 'view' || (id ? 'view' : 'create');
  
  const {
    templates,
    createTemplate,
    updateTemplate,
    isLoading
  } = useEmailTemplates();
  
  const { userProfile } = useAuth();
  const permissions = useTablePermissions('email_templates');
  const {
    data: availableTables = []
  } = useAvailableTables();

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
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
    enabled: mode !== 'view'
  });

  const {
    data: columns = []
  } = useTableColumns(formData.source_table);

  const {
    data: enhancedVariables = []
  } = useEnhancedVariables(formData.source_table);

  const {
    data: groupedReferenceFields = []
  } = useGroupedReferenceFields(formData.source_table);

  useEffect(() => {
    if (template && (mode === 'edit' || mode === 'view')) {
      setFormData({
        name: template.name,
        subject: template.subject,
        body: template.body,
        source_table: template.source_table,
        recipient_field: template.recipient_field || '',
        is_active: template.is_active,
        is_global: template.is_global || false
      });
    }
  }, [template, mode]);

  const handleFormChange = (updates: Partial<typeof formData>) => {
    if (mode === 'view') return;
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

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

    // Use the new template processor to extract variables
    const variables_used = extractVariables(formData.subject + ' ' + formData.body);
    
    if (mode === 'edit' && template) {
      updateTemplate({
        id: template.id,
        ...formData,
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

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Create Email Template';
      case 'edit': return 'Edit Email Template';
      case 'view': return 'View Email Template';
      default: return 'Email Template';
    }
  };

  const canPreview = formData.source_table && (formData.subject || formData.body);
  const isReadOnly = mode === 'view';

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (id && !template && !isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Template Not Found</h1>
          <Button onClick={() => navigate('/app/email_templates')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Email Templates
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => handleNavigation('/app/email_templates')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Email Templates
          </Button>
          <h1 className="text-3xl font-bold">{getTitle()}</h1>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'view' && permissions.canEdit && (
            <Button
              onClick={() => handleNavigation(`/app/email/template_record/${id}?mode=edit`)}
            >
              Edit Template
            </Button>
          )}
          {mode !== 'view' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                navigate('/app/email/email_preview_record', {
                  state: {
                    subject: formData.subject,
                    body: formData.body,
                    sourceTable: formData.source_table,
                    from: location.pathname + location.search
                  }
                });
              }}
              disabled={!canPreview}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview Email
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {/* Template Name */}
              <div className="flex items-center gap-4">
                <Label htmlFor="name" className="w-32 text-right">Template Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFormChange({ name: e.target.value })}
                  placeholder="Enter template name"
                  className="flex-1"
                  required
                  disabled={isReadOnly}
                />
              </div>

              {/* Source Table */}
              <div className="flex items-center gap-4">
                <Label className="w-32 text-right">Source Table</Label>
                <Select
                  value={formData.source_table}
                  onValueChange={(value) => {
                    // Reset recipient field when table changes
                    handleFormChange({ source_table: value, recipient_field: '' });
                  }}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTables.map((table) => (
                      <SelectItem key={table.name} value={table.name}>
                        {table.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-4">
                <Label className="w-32 text-right">Active Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleFormChange({ is_active: checked })}
                    disabled={isReadOnly}
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Global Template Checkbox - Only for Admins */}
            {userProfile?.role === 'admin' && (
              <div className="flex items-center gap-4 mt-6">
                <Label className="w-32 text-right">Global Template</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_global"
                    checked={formData.is_global}
                    onCheckedChange={(checked) => handleFormChange({ is_global: !!checked })}
                    disabled={isReadOnly}
                  />
                  <Label htmlFor="is_global" className="text-sm font-medium">
                    Visible to all schools
                  </Label>
                </div>
              </div>
            )}

            {/* Email Recipient Field */}
            <div className="flex items-center gap-4 mt-6">
              <Label className="w-32 text-right">Email Recipient</Label>
              <Select 
                value={formData.recipient_field} 
                onValueChange={value => handleFormChange({ recipient_field: value })} 
                disabled={!formData.source_table || isReadOnly}
              >
                <SelectTrigger className="w-1/3">
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned_to">Assigned To</SelectItem>
                  <SelectItem value="assigned_by">Created By</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-4 gap-6">
          <div className="col-span-3 space-y-6">
            {/* Subject Field */}
            <Card>
              <CardHeader>
                <CardTitle>Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  ref={subjectRef}
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleFormChange({ subject: e.target.value })}
                  placeholder="Enter email subject"
                  required
                  disabled={isReadOnly}
                />
              </CardContent>
            </Card>

            {/* Body Field */}
            <Card>
              <CardHeader>
                <CardTitle>Email Body</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={formData.body}
                    onChange={(value) => handleFormChange({ body: value })}
                    modules={modules}
                    formats={formats}
                    style={{ minHeight: '300px' }}
                    readOnly={isReadOnly}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Variables Panel */}
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

        {/* Actions */}
        {mode !== 'view' && (
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleNavigation('/app/email_templates')}
            >
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'edit' ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        )}
      </form>

      <UnsavedChangesDialog 
        open={showUnsavedDialog} 
        onOpenChange={setShowUnsavedDialog} 
        onDiscard={handleDiscardChanges} 
        onCancel={handleContinueEditing} 
      />
    </div>
  );
};