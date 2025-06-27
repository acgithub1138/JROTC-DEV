
import React, { useState, useEffect } from 'react';
import { BusinessRule } from '@/hooks/useBusinessRules';
import { useSchemaTracking } from '@/hooks/useSchemaTracking';
import { RuleBuilderHeader } from './builder/RuleBuilderHeader';
import { RuleDetailsCard } from './builder/RuleDetailsCard';
import { TriggerConfigCard } from './builder/TriggerConfigCard';
import { TriggerConditionsCard } from './builder/TriggerConditionsCard';
import { ActionsCard } from './builder/ActionsCard';
import { RuleBuilderActions } from './builder/RuleBuilderActions';

interface RuleBuilderProps {
  rule?: BusinessRule | null;
  onSave: (rule: any) => void;
  onCancel: () => void;
}

interface ConditionGroup {
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  rule,
  onSave,
  onCancel
}) => {
  const { tables } = useSchemaTracking();
  
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    trigger_type: rule?.trigger_type || '',
    trigger_table: rule?.trigger_table || '',
    trigger_conditions: rule?.trigger_conditions || [{
      conditions: [{
        field: '',
        operator: '',
        value: ''
      }]
    }] as ConditionGroup[],
    actions: rule?.actions || [{
      type: '',
      parameters: {}
    }],
    is_active: rule?.is_active ?? true
  });

  const handleSave = () => {
    const ruleData = {
      name: formData.name,
      description: formData.description,
      trigger_type: formData.trigger_type,
      trigger_table: formData.trigger_table,
      trigger_conditions: formData.trigger_conditions,
      actions: formData.actions,
      is_active: formData.is_active
    };
    onSave(ruleData);
  };

  const handleTableChange = (tableName: string) => {
    setFormData({
      ...formData,
      trigger_table: tableName,
      trigger_conditions: [{
        conditions: [{
          field: '',
          operator: '',
          value: ''
        }]
      }]
    });
  };

  return (
    <div className="p-6 space-y-6">
      <RuleBuilderHeader rule={rule} onCancel={onCancel} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RuleDetailsCard
          name={formData.name}
          description={formData.description}
          onNameChange={(value) => setFormData({ ...formData, name: value })}
          onDescriptionChange={(value) => setFormData({ ...formData, description: value })}
        />

        <TriggerConfigCard
          triggerType={formData.trigger_type}
          triggerTable={formData.trigger_table}
          tables={tables}
          onTriggerTypeChange={(value) => setFormData({ ...formData, trigger_type: value })}
          onTriggerTableChange={handleTableChange}
        />
      </div>

      <TriggerConditionsCard
        triggerTable={formData.trigger_table}
        triggerConditions={formData.trigger_conditions}
        onTriggerConditionsChange={(conditions) => setFormData({ ...formData, trigger_conditions: conditions })}
      />

      <ActionsCard
        actions={formData.actions}
        onActionsChange={(actions) => setFormData({ ...formData, actions: actions })}
      />

      <RuleBuilderActions
        rule={rule}
        formData={formData}
        onCancel={onCancel}
        onSave={handleSave}
      />
    </div>
  );
};
