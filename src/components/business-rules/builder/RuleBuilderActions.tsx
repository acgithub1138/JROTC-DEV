
import React from 'react';
import { Button } from '@/components/ui/button';
import { BusinessRule } from '@/hooks/useBusinessRules';

interface RuleBuilderActionsProps {
  rule?: BusinessRule | null;
  formData: {
    name: string;
    trigger_type: string;
    trigger_table: string;
    actions: any[];
  };
  onCancel: () => void;
  onSave: () => void;
}

export const RuleBuilderActions: React.FC<RuleBuilderActionsProps> = ({
  rule,
  formData,
  onCancel,
  onSave
}) => {
  const isFormValid = formData.name && 
                     formData.trigger_type && 
                     formData.trigger_table && 
                     formData.actions.every(a => a.type);

  return (
    <div className="flex justify-end gap-4">
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button onClick={onSave} disabled={!isFormValid}>
        {rule ? 'Update Rule' : 'Create Rule'}
      </Button>
    </div>
  );
};
