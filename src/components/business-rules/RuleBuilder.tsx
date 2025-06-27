import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, Plus, Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BusinessRule } from '@/hooks/useBusinessRules';
import { useSchemaTracking } from '@/hooks/useSchemaTracking';

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

// Get field data types for dynamic input rendering
const getFieldType = (tableName: string, fieldName: string): string => {
  const dateFields = ['due_date', 'created_at', 'updated_at', 'completed_at', 'date_of_birth', 'enlistment_date', 'graduation_date', 'competition_date', 'registration_deadline', 'expense_date', 'approved_at', 'purchase_date'];
  const numberFields = ['grade_level', 'gpa', 'attendance_percentage', 'fiscal_year', 'allocated_amount', 'spent_amount', 'amount', 'purchase_price'];
  const textFields = ['title', 'description', 'name', 'first_name', 'last_name', 'email', 'phone', 'cadet_id', 'task_number', 'location', 'vendor', 'serial_number', 'condition', 'category', 'notes'];
  
  if (dateFields.includes(fieldName)) return 'date';
  if (numberFields.includes(fieldName)) return 'number';
  if (textFields.includes(fieldName)) return 'text';
  return 'text'; // default
};

// Fields that reference profiles table (contain email addresses)
const getEmailFields = (tableName: string): string[] => {
  const emailFieldMappings: Record<string, string[]> = {
    'tasks': ['assigned_to', 'assigned_by'],
    'cadets': ['profile_id'],
    'teams': ['team_lead_id'],
    'budget': ['created_by'],
    'expenses': ['created_by', 'approved_by'],
    'contacts': ['email'] // Direct email field
  };
  return emailFieldMappings[tableName] || [];
};

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  rule,
  onSave,
  onCancel
}) => {
  const { tables, getFieldsForTable } = useSchemaTracking();
  
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

  const [selectedTableColumns, setSelectedTableColumns] = useState<string[]>([]);

  useEffect(() => {
    if (formData.trigger_table) {
      const fields = getFieldsForTable(formData.trigger_table);
      setSelectedTableColumns(fields.map(field => field.column_name));
    } else {
      setSelectedTableColumns([]);
    }
  }, [formData.trigger_table, getFieldsForTable]);

  const triggerTypes = [
    { value: 'record_created', label: 'Record Created' },
    { value: 'record_updated', label: 'Record Updated' },
    { value: 'record_deleted', label: 'Record Deleted' },
    { value: 'time_based', label: 'Time-based Trigger' }
  ];

  const actionTypes = [
    { value: 'send_email', label: 'Send Email' },
    { value: 'update_record', label: 'Update Record' },
    { value: 'create_record', label: 'Create Record' },
    { value: 'log_event', label: 'Log Event' }
  ];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'contains', label: 'Contains' },
    { value: 'is_null', label: 'Is Null' },
    { value: 'is_not_null', label: 'Is Not Null' }
  ];

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

  // Condition group management
  const addConditionGroup = () => {
    setFormData({
      ...formData,
      trigger_conditions: [
        ...formData.trigger_conditions,
        {
          conditions: [{
            field: '',
            operator: '',
            value: ''
          }]
        }
      ]
    });
  };

  const removeConditionGroup = (groupIndex: number) => {
    setFormData({
      ...formData,
      trigger_conditions: formData.trigger_conditions.filter((_, i) => i !== groupIndex)
    });
  };

  const addCondition = (groupIndex: number) => {
    const newConditionGroups = [...formData.trigger_conditions];
    newConditionGroups[groupIndex].conditions.push({
      field: '',
      operator: '',
      value: ''
    });
    setFormData({
      ...formData,
      trigger_conditions: newConditionGroups
    });
  };

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const newConditionGroups = [...formData.trigger_conditions];
    newConditionGroups[groupIndex].conditions = newConditionGroups[groupIndex].conditions.filter((_, i) => i !== conditionIndex);
    setFormData({
      ...formData,
      trigger_conditions: newConditionGroups
    });
  };

  const updateCondition = (groupIndex: number, conditionIndex: number, field: string, value: string) => {
    const newConditionGroups = [...formData.trigger_conditions];
    newConditionGroups[groupIndex].conditions[conditionIndex] = {
      ...newConditionGroups[groupIndex].conditions[conditionIndex],
      [field]: value
    };
    setFormData({
      ...formData,
      trigger_conditions: newConditionGroups
    });
  };

  // Action management
  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, {
        type: '',
        parameters: {}
      }]
    });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  const updateAction = (index: number, type: string) => {
    const newActions = [...formData.actions];
    newActions[index] = {
      ...newActions[index],
      type,
      parameters: {} // Reset parameters when type changes
    };
    setFormData({
      ...formData,
      actions: newActions
    });
  };

  const updateActionParameter = (actionIndex: number, paramKey: string, paramValue: any) => {
    const newActions = [...formData.actions];
    newActions[actionIndex].parameters = {
      ...newActions[actionIndex].parameters,
      [paramKey]: paramValue
    };
    setFormData({
      ...formData,
      actions: newActions
    });
  };

  // Render dynamic value input based on field type
  const renderValueInput = (fieldName: string, value: any, onChange: (value: any) => void) => {
    const fieldType = getFieldType(formData.trigger_table, fieldName);
    
    if (fieldType === 'date') {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => onChange(date ? date.toISOString().split('T')[0] : '')}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      );
    } else if (fieldType === 'number') {
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter number"
        />
      );
    } else {
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter value"
        />
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Rules
        </Button>
        <h1 className="text-3xl font-bold">
          {rule ? 'Edit Rule' : 'Create New Rule'}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rule Details</CardTitle>
            <CardDescription>Basic information about your rule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Rule Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Enter rule name" 
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Describe what this rule does" 
                rows={3} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trigger - "When to run"</CardTitle>
            <CardDescription>Define when this rule should execute</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="trigger-type">Trigger Type</Label>
              <Select 
                value={formData.trigger_type} 
                onValueChange={(value) => setFormData({
                  ...formData,
                  trigger_type: value
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger type" />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="trigger-table">Table</Label>
              <Select value={formData.trigger_table} onValueChange={handleTableChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={!formData.name || !formData.trigger_type || !formData.trigger_table || formData.actions.some(a => !a.type)}
        >
          {rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </div>
  );
};
