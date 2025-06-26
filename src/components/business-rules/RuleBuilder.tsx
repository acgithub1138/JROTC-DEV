
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
import { BusinessRule } from './BusinessRulesPage';

interface RuleBuilderProps {
  rule?: BusinessRule | null;
  onSave: (rule: BusinessRule) => void;
  onCancel: () => void;
}

interface TableInfo {
  table_name: string;
  columns: string[];
}

interface ConditionGroup {
  conditions: Array<{
    field: string;
    operator: string;
    value: string;
  }>;
}

// Static table schema based on the database structure
const AVAILABLE_TABLES: TableInfo[] = [
  {
    table_name: 'tasks',
    columns: ['id', 'title', 'description', 'status', 'priority', 'due_date', 'assigned_to', 'assigned_by', 'school_id', 'team_id', 'task_number', 'created_at', 'updated_at', 'completed_at']
  },
  {
    table_name: 'profiles',
    columns: ['id', 'first_name', 'last_name', 'email', 'phone', 'role', 'rank', 'school_id', 'created_at', 'updated_at']
  },
  {
    table_name: 'cadets',
    columns: ['id', 'cadet_id', 'profile_id', 'school_id', 'grade_level', 'date_of_birth', 'enlistment_date', 'graduation_date', 'gpa', 'attendance_percentage', 'parent_name', 'parent_email', 'parent_phone', 'emergency_contact_name', 'emergency_contact_phone', 'uniform_size', 'medical_conditions', 'created_at', 'updated_at']
  },
  {
    table_name: 'teams',
    columns: ['id', 'name', 'description', 'school_id', 'team_lead_id', 'created_at', 'updated_at']
  },
  {
    table_name: 'competitions',
    columns: ['id', 'name', 'description', 'type', 'competition_date', 'location', 'registration_deadline', 'created_at', 'updated_at']
  },
  {
    table_name: 'budget',
    columns: ['id', 'name', 'description', 'category', 'fiscal_year', 'allocated_amount', 'spent_amount', 'school_id', 'created_by', 'created_at', 'updated_at']
  },
  {
    table_name: 'expenses',
    columns: ['id', 'description', 'amount', 'expense_date', 'vendor', 'budget_id', 'school_id', 'created_by', 'approved_by', 'approved_at', 'receipt_url', 'created_at']
  },
  {
    table_name: 'inventory_items',
    columns: ['id', 'name', 'description', 'category', 'serial_number', 'status', 'condition', 'location', 'purchase_date', 'purchase_price', 'school_id', 'notes', 'created_at', 'updated_at']
  }
];

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

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  rule,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    trigger: {
      type: rule?.trigger.type || '',
      table: rule?.trigger.table || '',
      conditionGroups: rule?.trigger.conditionGroups || [{
        conditions: [{
          field: '',
          operator: '',
          value: ''
        }]
      }] as ConditionGroup[]
    },
    actions: rule?.actions || [{
      type: '',
      parameters: {}
    }],
    isActive: rule?.isActive ?? true
  });

  const [selectedTableColumns, setSelectedTableColumns] = useState<string[]>([]);

  useEffect(() => {
    if (formData.trigger.table) {
      const selectedTable = AVAILABLE_TABLES.find(t => t.table_name === formData.trigger.table);
      setSelectedTableColumns(selectedTable?.columns || []);
    } else {
      setSelectedTableColumns([]);
    }
  }, [formData.trigger.table]);

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
    const newRule: BusinessRule = {
      id: rule?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      trigger: formData.trigger,
      actions: formData.actions,
      isActive: formData.isActive,
      createdAt: rule?.createdAt || new Date().toISOString()
    };
    onSave(newRule);
  };

  const handleTableChange = (tableName: string) => {
    setFormData({
      ...formData,
      trigger: {
        ...formData.trigger,
        table: tableName,
        conditionGroups: [{
          conditions: [{
            field: '',
            operator: '',
            value: ''
          }]
        }]
      }
    });
  };

  // Condition group management
  const addConditionGroup = () => {
    setFormData({
      ...formData,
      trigger: {
        ...formData.trigger,
        conditionGroups: [
          ...formData.trigger.conditionGroups,
          {
            conditions: [{
              field: '',
              operator: '',
              value: ''
            }]
          }
        ]
      }
    });
  };

  const removeConditionGroup = (groupIndex: number) => {
    setFormData({
      ...formData,
      trigger: {
        ...formData.trigger,
        conditionGroups: formData.trigger.conditionGroups.filter((_, i) => i !== groupIndex)
      }
    });
  };

  const addCondition = (groupIndex: number) => {
    const newConditionGroups = [...formData.trigger.conditionGroups];
    newConditionGroups[groupIndex].conditions.push({
      field: '',
      operator: '',
      value: ''
    });
    setFormData({
      ...formData,
      trigger: {
        ...formData.trigger,
        conditionGroups: newConditionGroups
      }
    });
  };

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const newConditionGroups = [...formData.trigger.conditionGroups];
    newConditionGroups[groupIndex].conditions = newConditionGroups[groupIndex].conditions.filter((_, i) => i !== conditionIndex);
    setFormData({
      ...formData,
      trigger: {
        ...formData.trigger,
        conditionGroups: newConditionGroups
      }
    });
  };

  const updateCondition = (groupIndex: number, conditionIndex: number, field: string, value: string) => {
    const newConditionGroups = [...formData.trigger.conditionGroups];
    newConditionGroups[groupIndex].conditions[conditionIndex] = {
      ...newConditionGroups[groupIndex].conditions[conditionIndex],
      [field]: value
    };
    setFormData({
      ...formData,
      trigger: {
        ...formData.trigger,
        conditionGroups: newConditionGroups
      }
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
    const fieldType = getFieldType(formData.trigger.table, fieldName);
    
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
                value={formData.trigger.type} 
                onValueChange={(value) => setFormData({
                  ...formData,
                  trigger: { ...formData.trigger, type: value }
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
              <Select value={formData.trigger.table} onValueChange={handleTableChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_TABLES.map((table) => (
                    <SelectItem key={table.table_name} value={table.table_name}>
                      {table.table_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Conditions</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addConditionGroup} 
                  className="flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add "OR" Clause
                </Button>
              </div>
              
              {formData.trigger.conditionGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="border rounded-lg p-4 space-y-3">
                  {groupIndex > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-blue-600">OR</div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConditionGroup(groupIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  {group.conditions.map((condition, conditionIndex) => (
                    <div key={conditionIndex}>
                      {conditionIndex > 0 && (
                        <div className="text-sm font-medium text-gray-500 mb-2">AND</div>
                      )}
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Select 
                            value={condition.field} 
                            onValueChange={(value) => updateCondition(groupIndex, conditionIndex, 'field', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedTableColumns.map((column) => (
                                <SelectItem key={column} value={column}>
                                  {column}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1">
                          <Select 
                            value={condition.operator} 
                            onValueChange={(value) => updateCondition(groupIndex, conditionIndex, 'operator', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Operator" />
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
                        <div className="flex-1">
                          <Input 
                            placeholder="Value" 
                            value={condition.value} 
                            onChange={(e) => updateCondition(groupIndex, conditionIndex, 'value', e.target.value)} 
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeCondition(groupIndex, conditionIndex)}
                          disabled={group.conditions.length === 1 && formData.trigger.conditionGroups.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addCondition(groupIndex)} 
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Condition
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actions - "What to do"</CardTitle>
            <CardDescription>Define what should happen when the trigger conditions are met</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Actions to Execute</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addAction} 
                className="flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Action
              </Button>
            </div>
            
            {formData.actions.map((action, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Select 
                      value={action.type} 
                      onValueChange={(value) => updateAction(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select action type" />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeAction(index)}
                    disabled={formData.actions.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Action-specific parameters */}
                {action.type === 'send_email' && (
                  <div className="space-y-3">
                    <div>
                      <Label>Email Template</Label>
                      <Select 
                        value={action.parameters.emailTemplate || ''} 
                        onValueChange={(value) => updateActionParameter(index, 'emailTemplate', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select email template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="welcome">Welcome Template</SelectItem>
                          <SelectItem value="notification">Notification Template</SelectItem>
                          <SelectItem value="reminder">Reminder Template</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Send To</Label>
                      <Select 
                        value={action.parameters.sendTo || ''} 
                        onValueChange={(value) => updateActionParameter(index, 'sendTo', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipient field" />
                        </SelectTrigger>
                        <SelectContent>
                          {getEmailFields(formData.trigger.table).map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {action.type === 'update_record' && (
                  <div className="space-y-3">
                    <div>
                      <Label>Set Field</Label>
                      <Select 
                        value={action.parameters.setField || ''} 
                        onValueChange={(value) => updateActionParameter(index, 'setField', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select field to update" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedTableColumns.map((column) => (
                            <SelectItem key={column} value={column}>
                              {column}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Action</Label>
                      <Select 
                        value={action.parameters.updateAction || ''} 
                        onValueChange={(value) => updateActionParameter(index, 'updateAction', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="to">To</SelectItem>
                          <SelectItem value="same_as">Same as</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Value</Label>
                      {action.parameters.updateAction === 'same_as' ? (
                        <Select 
                          value={action.parameters.value || ''} 
                          onValueChange={(value) => updateActionParameter(index, 'value', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source field" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTableColumns.map((column) => (
                              <SelectItem key={column} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        renderValueInput(
                          action.parameters.setField || '',
                          action.parameters.value,
                          (value) => updateActionParameter(index, 'value', value)
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={!formData.name || !formData.trigger.type || !formData.trigger.table || formData.actions.some(a => !a.type)}
        >
          {rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </div>
  );
};
