
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

interface Action {
  type: string;
  parameters: Record<string, any>;
}

interface ActionsCardProps {
  actions: Action[];
  onActionsChange: (actions: Action[]) => void;
  triggerTable?: string;
}

const actionTypes = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'update_record', label: 'Update Record' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'log_event', label: 'Log Event' },
  { value: 'webhook', label: 'Call Webhook' }
];

export const ActionsCard: React.FC<ActionsCardProps> = ({
  actions,
  onActionsChange,
  triggerTable = ''
}) => {
  const { getFieldsForTable } = useSchemaTracking();
  const tableFields = getFieldsForTable(triggerTable);

  const addAction = () => {
    onActionsChange([
      ...actions,
      {
        type: '',
        parameters: {}
      }
    ]);
  };

  const removeAction = (index: number) => {
    const newActions = actions.filter((_, i) => i !== index);
    onActionsChange(newActions);
  };

  const updateAction = (index: number, field: string, value: any) => {
    const newActions = [...actions];
    if (field === 'type') {
      newActions[index] = { type: value, parameters: {} };
    } else {
      newActions[index] = {
        ...newActions[index],
        parameters: {
          ...newActions[index].parameters,
          [field]: value
        }
      };
    }
    onActionsChange(newActions);
  };

  const getFieldType = (fieldName: string) => {
    const field = tableFields.find(f => f.column_name === fieldName);
    return field?.data_type || 'text';
  };

  // Get fields that could contain email addresses or reference profiles
  const getEmailFields = () => {
    return tableFields.filter(field => 
      field.column_name.toLowerCase().includes('email') || 
      field.column_name.toLowerCase().includes('assigned_to') ||
      field.column_name.toLowerCase().includes('created_by') ||
      field.column_name.toLowerCase().includes('user') ||
      field.data_type === 'uuid' // Could be a reference to profiles table
    );
  };

  const renderValueField = (action: Action, index: number, setField: string, actionType: string) => {
    if (actionType === 'same_as') {
      return (
        <Select 
          value={action.parameters.value || ''} 
          onValueChange={(value) => updateAction(index, 'value', value)}
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
      );
    }

    const fieldType = getFieldType(setField);

    if (fieldType.includes('date') || fieldType.includes('timestamp')) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !action.parameters.value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {action.parameters.value ? format(new Date(action.parameters.value), "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={action.parameters.value ? new Date(action.parameters.value) : undefined}
              onSelect={(date) => updateAction(index, 'value', date ? date.toISOString().split('T')[0] : '')}
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
          value={action.parameters.value || ''} 
          onValueChange={(value) => updateAction(index, 'value', value)}
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
          value={action.parameters.value || ''} 
          onChange={(e) => updateAction(index, 'value', e.target.value)}
          placeholder="Enter number" 
        />
      );
    }

    return (
      <Input 
        value={action.parameters.value || ''} 
        onChange={(e) => updateAction(index, 'value', e.target.value)}
        placeholder="Enter value" 
      />
    );
  };

  const renderActionParameters = (action: Action, index: number) => {
    switch (action.type) {
      case 'send_email':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email Template</Label>
              <Select 
                value={action.parameters.email_template || ''} 
                onValueChange={(value) => updateAction(index, 'email_template', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select email template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome_email">Welcome Email</SelectItem>
                  <SelectItem value="notification_email">Notification Email</SelectItem>
                  <SelectItem value="reminder_email">Reminder Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Send To</Label>
              <Select 
                value={action.parameters.send_to_field || ''} 
                onValueChange={(value) => updateAction(index, 'send_to_field', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {getEmailFields().map((field) => (
                    <SelectItem key={field.id} value={field.column_name}>
                      {field.column_name} ({field.data_type})
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other (Custom Email)</SelectItem>
                </SelectContent>
              </Select>
              {action.parameters.send_to_field === 'other' && (
                <div className="mt-2">
                  <Input 
                    value={action.parameters.custom_email || ''} 
                    onChange={(e) => updateAction(index, 'custom_email', e.target.value)}
                    placeholder="Enter email address" 
                    type="email"
                  />
                </div>
              )}
            </div>
          </div>
        );
      
      case 'update_record':
        return (
          <div className="space-y-4">
            <div>
              <Label>Set Field</Label>
              <Select 
                value={action.parameters.set_field || ''} 
                onValueChange={(value) => {
                  updateAction(index, 'set_field', value);
                  // Don't reset other values, just clear value if action type changes
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field to update" />
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
            
            {action.parameters.set_field && (
              <>
                <div>
                  <Label>Action</Label>
                  <Select 
                    value={action.parameters.action_type || ''} 
                    onValueChange={(value) => {
                      updateAction(index, 'action_type', value);
                      updateAction(index, 'value', '');
                    }}
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
                
                {action.parameters.action_type && (
                  <div>
                    <Label>Value</Label>
                    {renderValueField(action, index, action.parameters.set_field, action.parameters.action_type)}
                  </div>
                )}
              </>
            )}
          </div>
        );
      
      case 'create_task':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Task Title</Label>
              <Input 
                value={action.parameters.title || ''} 
                onChange={(e) => updateAction(index, 'title', e.target.value)}
                placeholder="Task title" 
              />
            </div>
            <div>
              <Label>Assign To Field</Label>
              <Select 
                value={action.parameters.assign_to_field || ''} 
                onValueChange={(value) => updateAction(index, 'assign_to_field', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user field" />
                </SelectTrigger>
                <SelectContent>
                  {tableFields
                    .filter(field => field.column_name.toLowerCase().includes('user') || 
                                   field.column_name.toLowerCase().includes('assign'))
                    .map((field) => (
                    <SelectItem key={field.id} value={field.column_name}>
                      {field.column_name} ({field.data_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 'log_event':
        return (
          <div>
            <Label>Log Message</Label>
            <Input 
              value={action.parameters.message || ''} 
              onChange={(e) => updateAction(index, 'message', e.target.value)}
              placeholder="Log message" 
            />
          </div>
        );
      
      case 'webhook':
        return (
          <div className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <Input 
                value={action.parameters.url || ''} 
                onChange={(e) => updateAction(index, 'url', e.target.value)}
                placeholder="https://example.com/webhook" 
              />
            </div>
            <div>
              <Label>Method</Label>
              <Select 
                value={action.parameters.method || 'POST'} 
                onValueChange={(value) => updateAction(index, 'method', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Actions - "What to do"</CardTitle>
        <CardDescription>Define what actions should be taken when the rule triggers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.map((action, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Action {index + 1}</Label>
              {actions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAction(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <div>
              <Label>Action Type</Label>
              <Select 
                value={action.type} 
                onValueChange={(value) => updateAction(index, 'type', value)}
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
            
            {action.type && renderActionParameters(action, index)}
          </div>
        ))}
        
        <Button
          variant="outline"
          onClick={addAction}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Action
        </Button>
      </CardContent>
    </Card>
  );
};
