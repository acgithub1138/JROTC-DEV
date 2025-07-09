import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { TriggerConditions, TriggerCondition } from './types';
import { useTableColumns } from '@/hooks/email/useTableColumns';

interface TriggerConditionsSectionProps {
  sourceTable: string;
  triggerConditions: TriggerConditions | Record<string, any>;
  onConditionsChange: (conditions: TriggerConditions) => void;
}

const DEFAULT_CONDITION: TriggerCondition = {
  field: '',
  operator: 'equals',
  value: ''
};

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'is_null', label: 'Is empty' },
  { value: 'is_not_null', label: 'Is not empty' }
];

export const TriggerConditionsSection: React.FC<TriggerConditionsSectionProps> = ({
  sourceTable,
  triggerConditions,
  onConditionsChange,
}) => {
  const { data: columns = [] } = useTableColumns(sourceTable);
  
  // Convert legacy format to new structured format
  const conditions: TriggerConditions = React.useMemo(() => {
    if (triggerConditions && 'conditions' in triggerConditions) {
      return triggerConditions as TriggerConditions;
    }
    return {
      conditions: [],
      logic: 'AND'
    };
  }, [triggerConditions]);

  const addCondition = () => {
    const newConditions = {
      ...conditions,
      conditions: [...conditions.conditions, { ...DEFAULT_CONDITION }]
    };
    onConditionsChange(newConditions);
  };

  const removeCondition = (index: number) => {
    const newConditions = {
      ...conditions,
      conditions: conditions.conditions.filter((_, i) => i !== index)
    };
    onConditionsChange(newConditions);
  };

  const updateCondition = (index: number, field: keyof TriggerCondition, value: string) => {
    const newConditions = {
      ...conditions,
      conditions: conditions.conditions.map((condition, i) => 
        i === index ? { ...condition, [field]: value } : condition
      )
    };
    onConditionsChange(newConditions);
  };

  const updateLogic = (logic: 'AND' | 'OR') => {
    onConditionsChange({
      ...conditions,
      logic
    });
  };

  if (!sourceTable) {
    return null;
  }

  return (
    <div className="space-y-4 border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Update Trigger Conditions</Label>
        <Button
          type="button"
          onClick={addCondition}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Condition
        </Button>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Define when this rule should trigger on record updates. All conditions must be met for the rule to fire.
      </p>

      {conditions.conditions.length > 0 && (
        <>
          <div className="space-y-3">
            {conditions.conditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-md">
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Field</Label>
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(index, 'field', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((column) => (
                          <SelectItem key={column.column_name} value={column.column_name}>
                            {column.display_label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => updateCondition(index, 'operator', value as TriggerCondition['operator'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((operator) => (
                          <SelectItem key={operator.value} value={operator.value}>
                            {operator.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Value</Label>
                    <Input
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      placeholder="Enter value"
                      disabled={condition.operator === 'is_null' || condition.operator === 'is_not_null'}
                    />
                  </div>
                </div>
                
                <Button
                  type="button"
                  onClick={() => removeCondition(index)}
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {conditions.conditions.length > 1 && (
            <div className="space-y-2">
              <Label className="text-sm">Logic Operator</Label>
              <Select
                value={conditions.logic}
                onValueChange={(value) => updateLogic(value as 'AND' | 'OR')}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND (All conditions must be true)</SelectItem>
                  <SelectItem value="OR">OR (Any condition can be true)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}

      {conditions.conditions.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p>No conditions defined. Rule will trigger on any update.</p>
          <p className="text-xs mt-1">Click "Add Condition" to specify when this rule should trigger.</p>
        </div>
      )}
    </div>
  );
};