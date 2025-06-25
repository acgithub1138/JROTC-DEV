
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Square, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution';
import { formatDistanceToNow } from 'date-fns';

interface WorkflowExecutionMonitorProps {
  workflowId?: string;
}

export const WorkflowExecutionMonitor: React.FC<WorkflowExecutionMonitorProps> = ({
  workflowId
}) => {
  const { executions, isLoading, executeWorkflow, cancelExecution, isExecuting, isCancelling } = useWorkflowExecution();

  const filteredExecutions = workflowId 
    ? executions.filter(exec => exec.workflow_id === workflowId)
    : executions;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTestExecution = (workflowId: string) => {
    executeWorkflow({
      workflowId,
      triggerType: 'manual',
      triggerData: { test: true }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading executions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Workflow Executions
          {workflowId && (
            <Button
              onClick={() => handleTestExecution(workflowId)}
              disabled={isExecuting}
              size="sm"
            >
              <Play className="w-4 h-4 mr-2" />
              {isExecuting ? 'Running...' : 'Test Run'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredExecutions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No executions found
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {filteredExecutions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(execution.status)}
                    <div>
                      <div className="font-medium">
                        {execution.trigger_type} trigger
                      </div>
                      <div className="text-sm text-gray-500">
                        Started {formatDistanceToNow(new Date(execution.started_at))} ago
                      </div>
                      {execution.completed_at && (
                        <div className="text-sm text-gray-500">
                          Completed {formatDistanceToNow(new Date(execution.completed_at))} ago
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(execution.status)}>
                      {execution.status}
                    </Badge>
                    
                    {execution.status === 'running' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelExecution(execution.id)}
                        disabled={isCancelling}
                      >
                        <Square className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
