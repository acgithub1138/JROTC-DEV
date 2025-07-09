
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEmailRules, EmailRule } from '@/hooks/email/useEmailRules';
import { useEmailTemplates } from '@/hooks/email/useEmailTemplates';
import { useAvailableTables } from '@/hooks/email/useTableColumns';
import { BasicFieldsSection } from './components/BasicFieldsSection';
import { TriggerConfigSection } from './components/TriggerConfigSection';
import { RecipientConfigSection } from './components/RecipientConfigSection';
import { EmailRuleFormData, RecipientConfig, TriggerConditions } from './components/types';

interface EmailRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: EmailRule | null;
  mode: 'create' | 'edit';
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
  
  const [formData, setFormData] = useState<EmailRuleFormData>({
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

  useEffect(() => {
    if (rule && mode === 'edit') {
      // Safely convert the recipient_config from the database
      const dbRecipientConfig = rule.recipient_config as Record<string, any>;
      const recipientConfig: RecipientConfig = {
        recipient_type: dbRecipientConfig.recipient_type || 'field',
        recipient_field: dbRecipientConfig.recipient_field || '',
        static_email: dbRecipientConfig.static_email || '',
      };

      // Convert trigger conditions to new format if needed
      let triggerConditions = rule.trigger_conditions;
      if (rule.trigger_event === 'UPDATE' && triggerConditions && !('conditions' in triggerConditions)) {
        // Convert legacy format to new structured format
        triggerConditions = {
          conditions: [],
          logic: 'AND'
        } as TriggerConditions;
      }

      setFormData({
        name: rule.name,
        template_id: rule.template_id,
        source_table: rule.source_table,
        trigger_event: rule.trigger_event,
        trigger_conditions: triggerConditions,
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

  const handleFormChange = (updates: Partial<EmailRuleFormData>) => {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Email Rule' : 'Create Email Rule'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <BasicFieldsSection
            formData={formData}
            availableTables={availableTables}
            onFormChange={handleFormChange}
          />

          <TriggerConfigSection
            formData={formData}
            availableTemplates={availableTemplates}
            onFormChange={handleFormChange}
          />

          <RecipientConfigSection
            recipientConfig={formData.recipient_config}
            sourceTable={formData.source_table}
            onRecipientConfigChange={handleRecipientConfigChange}
          />

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
