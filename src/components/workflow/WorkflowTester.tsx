
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Settings } from 'lucide-react';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';
import { WorkflowNode, WorkflowEdge } from '@/types/workflow';

interface WorkflowTesterProps {
  workflowId: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const WorkflowTester: React.FC<WorkflowTesterProps> = ({
  workflowId,
  nodes,
  edges
}) => {
  const [triggerType, setTriggerType] = useState('manual');
  const [triggerData, setTriggerData] = useState('{}');
  const [isValidJson, setIsValidJson] = useState(true);
  const { executeWorkflow, isExecuting } = useWorkflowExecution();

  const triggerNodes = nodes.filter(node => node.data.nodeType === 'trigger');

  const handleTriggerDataChange = (value: string) => {
    setTriggerData(value);
    try {
      JSON.parse(value);
      setIsValidJson(true);
    } catch {
      setIsValidJson(false);
    }
  };

  const handleTestExecution = () => {
    let parsedData = {};
    if (triggerData.trim()) {
      try {
        parsedData = JSON.parse(triggerData);
      } catch (error) {
        console.error('Invalid JSON data:', error);
        return;
      }
    }

    executeWorkflow({
      workflowId,
      triggerType,
      triggerData: parsedData
    });
  };

  const getTriggerOptions = () => {
    const options = [
      { value: 'manual', label: 'Manual Trigger' },
      { value: 'test', label: 'Test Trigger' }
    ];

    // Add options based on trigger nodes in the workflow
    triggerNodes.forEach(node => {
      if (node.data.nodeSubtype !== 'manual') {
        options.push({
          value: node.data.nodeSubtype,
          label: node.data.label
        });
      }
    });

    return options;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Workflow Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="trigger-type">Trigger Type</Label>
          <Select value={triggerType} onValueChange={setTriggerType}>
            <SelectTrigger>
              <SelectValue placeholder="Select trigger type" />
            </SelectTrigger>
            <SelectContent>
              {getTriggerOptions().map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="trigger-data">Trigger Data (JSON)</Label>
          <Textarea
            id="trigger-data"
            value={triggerData}
            onChange={(e) => handleTriggerDataChange(e.target.value)}
            placeholder='{"key": "value"}'
            className={`font-mono text-sm ${!isValidJson ? 'border-red-500' : ''}`}
            rows={4}
          />
          {!isValidJson && (
            <p className="text-sm text-red-500 mt-1">Invalid JSON format</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-600">
            {triggerNodes.length} trigger node(s) found
          </div>
          <Button
            onClick={handleTestExecution}
            disabled={isExecuting || !isValidJson}
          >
            <Play className="w-4 h-4 mr-2" />
            {isExecuting ? 'Running...' : 'Execute Workflow'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
