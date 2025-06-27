
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2 } from 'lucide-react';
import { useSchemaTracking } from '@/hooks/useSchemaTracking';

interface Action {
  type: string;
  parameters: Record<string, any>;
}

interface ActionsCardProps {
  actions: Action[];
  onActionsChange: (actions: Action[]) => void;
}

const actionTypes = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'create_task', label: 'Create Task' },
  { value: 'update_record', label: 'Update Record' },
  { value: 'send_notification', label: 'Send Notification' },
  { value: 'log_event', label: 'Log Event' },
  { value: 'webhook', label: 'Call Webhook' }
];

export const ActionsCard: React.FC<ActionsCardProps> = ({
  actions,
  onActionsChange
}) => {
  const { getProfileFields } = useSchemaTracking();
  const profileFields = getProfileFields();

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

  const renderActionParameters = (action: Action, index: number) => {
    switch (action.type) {
      case 'send_email':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>To Email</Label>
              <Select 
                value={action.parameters.to_field || ''} 
                onValueChange={(value) => updateAction(index, 'to_field', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select email field" />
                </SelectTrigger>
                <SelectContent>
                  {profileFields.map((field) => (
                    <SelectItem key={field.id} value={field.column_name}>
                      {field.column_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input 
                value={action.parameters.subject || ''} 
                onChange={(e) => updateAction(index, 'subject', e.target.value)}
                placeholder="Email subject" 
              />
            </div>
            <div className="col-span-2">
              <Label>Message</Label>
              <Textarea 
                value={action.parameters.message || ''} 
                onChange={(e) => updateAction(index, 'message', e.target.value)}
                placeholder="Email message" 
                rows={3}
              />
            </div>
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
                  {profileFields.map((field) => (
                    <SelectItem key={field.id} value={field.column_name}>
                      {field.column_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea 
                value={action.parameters.description || ''} 
                onChange={(e) => updateAction(index, 'description', e.target.value)}
                placeholder="Task description" 
                rows={2}
              />
            </div>
          </div>
        );
      
      case 'send_notification':
        return (
          <div className="space-y-4">
            <div>
              <Label>Message</Label>
              <Textarea 
                value={action.parameters.message || ''} 
                onChange={(e) => updateAction(index, 'message', e.target.value)}
                placeholder="Notification message" 
                rows={2}
              />
            </div>
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
        return (
          <div>
            <Label>Parameters</Label>
            <Textarea 
              value={JSON.stringify(action.parameters, null, 2)} 
              onChange={(e) => {
                try {
                  const params = JSON.parse(e.target.value);
                  updateAction(index, 'parameters', params);
                } catch (error) {
                  // Invalid JSON, ignore
                }
              }}
              placeholder="Enter parameters as JSON" 
              rows={3}
            />
          </div>
        );
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
