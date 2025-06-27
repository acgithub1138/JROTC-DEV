
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, CalendarIcon } from 'lucide-react';
import { useSchemaTracking } from '@/hooks/useSchemaTracking';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

  const getFieldType = (fieldName: string) => {
    const field = tableFields.find(f => f.column_name === fieldName);
    return field?.data_type || 'text';
  };

  const renderValueField = (condition: any, groupIndex: number, conditionIndex: number) => {
    const fieldType = getFieldType(condition.field);
    
    // Don't show value field for null checks
    if (condition.operator === 'is_null' || condition.operator === 'is_not_null') {
      return null;
    }

    if (fieldType.includes('date') || fieldType.includes('timestamp')) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !condition.value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {condition.value ? format(new Date(condition.value), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={condition.value ? new Date(condition.value) : undefined}
              onSelect={(date) => updateCondition(groupIndex, conditionIndex, 'value', date ? date.toISOString().split('T')[0] : '')}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      );
    }

    if (fieldType.includes('boolean')) {
      return (
        <Select 
          value={condition.value} 
          onValueChange={(value) => updateCondition(groupIndex, conditionIndex, 'value', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (fieldType.includes('numeric') || fieldType.includes('integer')) {
      return (
        <Input 
          type="number"
          value={condition.value} 
          onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
          placeholder="Enter number" 
        />
      );
    }

    // Default to text input for other types
    return (
      <Input 
        value={condition.value} 
        onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)}
        placeholder="Enter value" 
      />
    );
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
              <Label className="text-sm font-medium">
                {groupIndex === 0 ? 'AND Condition Group' : 'OR Condition Group'} {groupIndex + 1}
              </Label>
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
                    onValueChange={(value) => {
                      // Reset operator and value when field changes
                      updateCondition(groupIndex, conditionIndex, 'field', value);
                      updateCondition(groupIndex, conditionIndex, 'operator', '');
                      updateCondition(groupIndex, conditionIndex, 'value', '');
                    }}
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
                    onValueChange={(value) => {
                      updateCondition(groupIndex, conditionIndex, 'operator', value);
                      // Reset value when operator changes to null checks
                      if (value === 'is_null' || value === 'is_not_null') {
                        updateCondition(groupIndex, conditionIndex, 'value', '');
                      }
                    }}
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
                  {renderValueField(condition, groupIndex, conditionIndex)}
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
              Add AND Condition
            </Button>
          </div>
        ))}
        
        <Button
          variant="outline"
          onClick={addConditionGroup}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add OR Condition Group
        </Button>
      </CardContent>
    </Card>
  );
};
