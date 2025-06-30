import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useEmailTemplates, EmailTemplate } from '@/hooks/email/useEmailTemplates';
import { useAvailableTables, useTableColumns, useEnhancedVariables } from '@/hooks/email/useTableColumns';

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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_table">Source Table</Label>
              <Select
                value={formData.source_table}
                onValueChange={(value) => setFormData(prev => ({ ...prev, source_table: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a table" />
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
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter email subject (use {{variable}} for dynamic content)"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Subject Variables</Label>
              <Card className="h-32">
                <CardContent className="p-2 overflow-y-auto">
                  <div className="space-y-1">
                    {columns.map((column) => (
                      <Button
                        key={`subject-${column.column_name}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertVariableIntoSubject(column.column_name)}
                        className="w-full justify-start text-xs h-7"
                      >
                        {column.display_label}
                      </Button>
                    ))}
                    {enhancedVariables.map((variable) => (
                      <Button
                        key={`subject-${variable.variable}`}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => insertVariableIntoSubject(variable.variable)}
                        className="w-full justify-start text-xs h-7 bg-blue-50 border-blue-200"
                      >
                        {variable.label}
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Name
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Enter email body (use {{variable}} for dynamic content)"
                rows={12}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Available Variables</Label>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Table Columns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-y-auto">
                  {columns.map((column) => (
                    <Button
                      key={column.column_name}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertVariable(column.column_name)}
                      className="w-full justify-start text-xs"
                    >
                      {column.display_label}
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {column.data_type}
                      </Badge>
                    </Button>
                  ))}
                  
                  {enhancedVariables.length > 0 && (
                    <>
                      <Separator />
                      <div className="text-xs font-medium text-gray-600 px-1">Profile References</div>
                      {enhancedVariables.map((variable) => (
                        <Button
                          key={variable.variable}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(variable.variable)}
                          className="w-full justify-start text-xs bg-blue-50 border-blue-200"
                        >
                          {variable.label}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Name
                          </Badge>
                        </Button>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active</Label>
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
  );
};
