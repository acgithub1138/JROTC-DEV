
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { useSchemaTracking } from '@/hooks/useSchemaTracking';

interface ConditionGroup {
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}

interface TriggerConditionsCardProps {
  triggerTable: string;
  triggerConditions: ConditionGroup[];
  onTriggerConditionsChange: (conditions: ConditionGroup[]) => void;
}

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'is_null', label: 'Is Null' },
  { value: 'is_not_null', label: 'Is Not Null' }
];

export const TriggerConditionsCard: React.FC<TriggerConditionsCardProps> = ({
  triggerTable,
  triggerConditions,
  onTriggerConditionsChange
}) => {
  const { getFieldsForTable } = useSchemaTracking();
  const tableFields = getFieldsForTable(triggerTable);

  const addCondition = (groupIndex: number) => {
    const newConditions = [...triggerConditions];
    newConditions[groupIndex].conditions.push({
      field: '',
      operator: '',
      value: ''
    });
    onTriggerConditionsChange(newConditions);
  };

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const newConditions = [...triggerConditions];
    newConditions[groupIndex].conditions.splice(conditionIndex, 1);
    onTriggerConditionsChange(newConditions);
  };

  const updateCondition = (groupIndex: number, conditionIndex: number, field: string, value: string) => {
    const newConditions = [...triggerConditions];
    newConditions[groupIndex].conditions[conditionIndex] = {
      ...newConditions[groupIndex].conditions[conditionIndex],
      [field]: value
    };
    onTriggerConditionsChange(newConditions);
  };

  const addConditionGroup = () => {
    onTriggerConditionsChange([
      ...triggerConditions,
      {
        conditions: [{
          field: '',
          operator: '',
          value: ''
        }]
      }
    ]);
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Trigger Conditions - "When"</CardTitle>
        <CardDescription>Define specific conditions that must be met for this rule to trigger</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {triggerConditions.map((group, groupIndex) => (
          <div key={groupIndex} className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Condition Group {groupIndex + 1}</Label>
              {triggerConditions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newConditions = triggerConditions.filter((_, i) => i !== groupIndex);
                    onTriggerConditionsChange(newConditions);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {group.conditions.map((condition, conditionIndex) => (
              <div key={conditionIndex} className="grid grid-cols-4 gap-2 items-end">
                <div>
                  <Label className="text-xs">Field</Label>
                  <Select 
                    value={condition.field} 
                    onValueChange={(value) => updateCondition(groupIndex, conditionIndex, 'field', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {tableFields.map((field) => (
                        <SelectItem key={field.id} value={field.column_name}>
                          {field.column_name} ({field.data_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Operator</Label>
                  <Select 
                    value={condition.operator} 
                    onValueChange={(value) => updateCondition(groupIndex, conditionIndex, 'operator', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Value</Label>
                  <Input 
                    value={condition.value} 
                    onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
                    placeholder="Enter value" 
                  />
                </div>
                
                <div>
                  {group.conditions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(groupIndex, conditionIndex)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => addCondition(groupIndex)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Condition
            </Button>
          </div>
        ))}
        
        <Button
          variant="outline"
          onClick={addConditionGroup}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Condition Group
        </Button>
      </CardContent>
    </Card>
  );
};
