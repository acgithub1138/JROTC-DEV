
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowNode } from '@/types/workflow';

interface PropertyPanelProps {
  selectedNode: WorkflowNode | null;
  onNodeUpdate: (nodeId: string, updates: Partial<WorkflowNode['data']>) => void;
  onClose: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedNode,
  onNodeUpdate,
  onClose
}) => {
  if (!selectedNode) {
    return (
      <div className="w-80 border-l bg-white p-4">
        <div className="text-center text-gray-500">
          Select a node to configure its properties
        </div>
      </div>
    );
  }

  const handleLabelChange = (value: string) => {
    onNodeUpdate(selectedNode.id, { label: value });
  };

  const handleDescriptionChange = (value: string) => {
    onNodeUpdate(selectedNode.id, {
      configuration: {
        ...selectedNode.data.configuration,
        description: value
      }
    });
  };

  const renderSpecificConfig = () => {
    switch (selectedNode.data.nodeSubtype) {
      case 'database_change':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="table-select">Table</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="cadets">Cadets</SelectItem>
                  <SelectItem value="inventory_items">Inventory Items</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="operation-select">Operation</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSERT">Insert</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 'schedule':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="cron-expression">Cron Expression</Label>
              <Input
                id="cron-expression"
                placeholder="0 9 * * 1-5"
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: "0 9 * * 1-5" runs at 9 AM on weekdays
              </p>
            </div>
          </div>
        );
      
      case 'field_comparison':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="field-name">Field Name</Label>
              <Input id="field-name" placeholder="status" />
            </div>
            <div>
              <Label htmlFor="operator">Operator</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="comparison-value">Value</Label>
              <Input id="comparison-value" placeholder="completed" />
            </div>
          </div>
        );
      
      case 'create_record':
      case 'update_record':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="target-table">Target Table</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="cadets">Cadets</SelectItem>
                  <SelectItem value="inventory_items">Inventory Items</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="field-mapping">Field Values (JSON)</Label>
              <Textarea
                id="field-mapping"
                placeholder='{"title": "New Task", "status": "pending"}'
                className="font-mono text-sm"
              />
            </div>
          </div>
        );
      
      case 'send_email':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-to">Recipient Email</Label>
              <Input id="email-to" placeholder="user@example.com" />
            </div>
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input id="email-subject" placeholder="Task Assignment" />
            </div>
            <div>
              <Label htmlFor="email-body">Message</Label>
              <Textarea id="email-body" placeholder="Email content..." />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-80 border-l bg-white">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold">Node Properties</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
      </div>
      
      <div className="p-4 space-y-4">
        <div>
          <Label htmlFor="node-label">Label</Label>
          <Input
            id="node-label"
            value={selectedNode.data.label}
            onChange={(e) => handleLabelChange(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="node-description">Description</Label>
          <Textarea
            id="node-description"
            value={selectedNode.data.configuration?.description || ''}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Optional description..."
          />
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Configuration</h4>
          {renderSpecificConfig()}
        </div>
      </div>
    </div>
  );
};
