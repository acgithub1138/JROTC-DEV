
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { BusinessRule } from './BusinessRulesPage';
import { supabase } from '@/integrations/supabase/client';

interface RuleBuilderProps {
  rule?: BusinessRule | null;
  onSave: (rule: BusinessRule) => void;
  onCancel: () => void;
}

interface TableInfo {
  table_name: string;
  columns: string[];
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  rule,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    trigger: {
      type: rule?.trigger.type || '',
      table: rule?.trigger.table || '',
      conditions: rule?.trigger.conditions || [{ field: '', operator: '', value: '' }],
    },
    actions: rule?.actions || [{ type: '', parameters: {} }],
    isActive: rule?.isActive ?? true,
  });

  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTableColumns, setSelectedTableColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (formData.trigger.table) {
      const selectedTable = tables.find(t => t.table_name === formData.trigger.table);
      setSelectedTableColumns(selectedTable?.columns || []);
    } else {
      setSelectedTableColumns([]);
    }
  }, [formData.trigger.table, tables]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      
      // Get all tables in the public schema
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (tablesError) {
        console.error('Error fetching tables:', tablesError);
        return;
      }

      const tableInfoPromises = tablesData.map(async (table) => {
        const { data: columnsData, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name')
          .eq('table_schema', 'public')
          .eq('table_name', table.table_name)
          .order('ordinal_position');

        if (columnsError) {
          console.error(`Error fetching columns for ${table.table_name}:`, columnsError);
          return { table_name: table.table_name, columns: [] };
        }

        return {
          table_name: table.table_name,
          columns: columnsData.map(col => col.column_name)
        };
      });

      const tableInfos = await Promise.all(tableInfoPromises);
      setTables(tableInfos);
    } catch (error) {
      console.error('Error in fetchTables:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerTypes = [
    { value: 'record_created', label: 'Record Created' },
    { value: 'record_updated', label: 'Record Updated' },
    { value: 'record_deleted', label: 'Record Deleted' },
    { value: 'time_based', label: 'Time-based Trigger' },
  ];

  const actionTypes = [
    { value: 'send_notification', label: 'Send Notification' },
    { value: 'update_record', label: 'Update Record' },
    { value: 'create_record', label: 'Create Record' },
    { value: 'send_email', label: 'Send Email' },
    { value: 'log_event', label: 'Log Event' },
  ];

  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'contains', label: 'Contains' },
    { value: 'is_null', label: 'Is Null' },
    { value: 'is_not_null', label: 'Is Not Null' },
  ];

  const handleSave = () => {
    const newRule: BusinessRule = {
      id: rule?.id || Date.now().toString(),
      name: formData.name,
      description: formData.description,
      trigger: formData.trigger,
      actions: formData.actions,
      isActive: formData.isActive,
      createdAt: rule?.createdAt || new Date().toISOString(),
    };

    onSave(newRule);
  };

  const handleTableChange = (tableName: string) => {
    setFormData({
      ...formData,
      trigger: {
        ...formData.trigger,
        table: tableName,
        conditions: [{ field: '', operator: '', value: '' }], // Reset conditions when table changes
      },
    });
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      trigger: {
        ...formData.trigger,
        conditions: [...formData.trigger.conditions, { field: '', operator: '', value: '' }],
      },
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      trigger: {
        ...formData.trigger,
        conditions: formData.trigger.conditions.filter((_, i) => i !== index),
      },
    });
  };

  const updateCondition = (index: number, field: string, value: string) => {
    const newConditions = [...formData.trigger.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({
      ...formData,
      trigger: {
        ...formData.trigger,
        conditions: newConditions,
      },
    });
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: '', parameters: {} }],
    });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };

  const updateAction = (index: number, type: string) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], type };
    setFormData({
      ...formData,
      actions: newActions,
    });
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onCancel} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Rules
          </Button>
          <h1 className="text-3xl font-bold">Loading...</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

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
            <CardTitle>Trigger - "IF THIS"</CardTitle>
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
              <Select
                value={formData.trigger.table}
                onValueChange={handleTableChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
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
                  onClick={addCondition}
                  className="flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </Button>
              </div>
              {formData.trigger.conditions.map((condition, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(index, 'field', value)}
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
                      onValueChange={(value) => updateCondition(index, 'operator', value)}
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
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCondition(index)}
                    disabled={formData.trigger.conditions.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actions - "THEN THAT"</CardTitle>
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
              <div key={index} className="flex gap-2 items-center p-4 border rounded-lg">
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
