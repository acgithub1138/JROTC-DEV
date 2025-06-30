
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmailRules, EmailRule } from '@/hooks/email/useEmailRules';
import { useEmailTemplates } from '@/hooks/email/useEmailTemplates';
import { useAvailableTables } from '@/hooks/email/useTableColumns';

interface EmailRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: EmailRule | null;
  mode: 'create' | 'edit';
}

interface RecipientConfig {
  recipient_type: string;
  recipient_field: string;
  static_email: string;
}

export const EmailRuleDialog: React.FC<EmailRuleDialogProps> = ({
  open,
  onOpenChange,
  rule,
  mode,
}) => {
  const { createRule, updateRule } = useEmailRules();
  const { templates } = useEmailTemplates();
  const { data: availableTables = [] } = useAvailableTables();
  
  const [formData, setFormData] = useState({
    name: '',
    template_id: '',
    source_table: '',
    trigger_event: 'INSERT' as 'INSERT' | 'UPDATE' | 'DELETE',
    trigger_conditions: {},
    recipient_config: {
      recipient_type: 'field',
      recipient_field: '',
      static_email: '',
    } as RecipientConfig,
    is_active: true,
  });

  useEffect(() => {
    if (rule && mode === 'edit') {
      // Safely convert the recipient_config from the database
      const dbRecipientConfig = rule.recipient_config as Record<string, any>;
      const recipientConfig: RecipientConfig = {
        recipient_type: dbRecipientConfig.recipient_type || 'field',
        recipient_field: dbRecipientConfig.recipient_field || '',
        static_email: dbRecipientConfig.static_email || '',
      };

      setFormData({
        name: rule.name,
        template_id: rule.template_id,
        source_table: rule.source_table,
        trigger_event: rule.trigger_event,
        trigger_conditions: rule.trigger_conditions,
        recipient_config: recipientConfig,
        is_active: rule.is_active,
      });
    } else {
      setFormData({
        name: '',
        template_id: '',
        source_table: '',
        trigger_event: 'INSERT',
        trigger_conditions: {},
        recipient_config: {
          recipient_type: 'field',
          recipient_field: '',
          static_email: '',
        },
        is_active: true,
      });
    }
  }, [rule, mode, open]);

  const handleFormChange = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleRecipientConfigChange = (updates: Partial<RecipientConfig>) => {
    setFormData(prev => ({
      ...prev,
      recipient_config: { ...prev.recipient_config, ...updates }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'edit' && rule) {
      updateRule({
        id: rule.id,
        ...formData,
      });
    } else {
      createRule(formData);
    }
    
    onOpenChange(false);
  };

  const availableTemplates = templates.filter(t => t.source_table === formData.source_table);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Email Rule' : 'Create Email Rule'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFormChange({ name: e.target.value })}
                placeholder="Enter rule name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Source Table</Label>
              <Select
                value={formData.source_table}
                onValueChange={(value) => handleFormChange({ source_table: value, template_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source table" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trigger Event</Label>
              <Select
                value={formData.trigger_event}
                onValueChange={(value) => handleFormChange({ trigger_event: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSERT">Insert (New Record)</SelectItem>
                  <SelectItem value="UPDATE">Update (Record Changed)</SelectItem>
                  <SelectItem value="DELETE">Delete (Record Removed)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Email Template</Label>
              <Select
                value={formData.template_id}
                onValueChange={(value) => handleFormChange({ template_id: value })}
                disabled={!formData.source_table}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {availableTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recipient Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient Type</Label>
                <Select
                  value={formData.recipient_config.recipient_type}
                  onValueChange={(value) => handleRecipientConfigChange({ recipient_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field">From Record Field</SelectItem>
                    <SelectItem value="static">Static Email Address</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.recipient_config.recipient_type === 'field' ? (
                <div className="space-y-2">
                  <Label htmlFor="recipient_field">Email Field Name</Label>
                  <Input
                    id="recipient_field"
                    value={formData.recipient_config.recipient_field}
                    onChange={(e) => handleRecipientConfigChange({ recipient_field: e.target.value })}
                    placeholder="e.g., email, assigned_to.email"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="static_email">Static Email Address</Label>
                  <Input
                    id="static_email"
                    type="email"
                    value={formData.recipient_config.static_email}
                    onChange={(e) => handleRecipientConfigChange({ static_email: e.target.value })}
                    placeholder="recipient@example.com"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleFormChange({ is_active: checked })}
            />
            <Label htmlFor="is_active">Rule is active</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'edit' ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
