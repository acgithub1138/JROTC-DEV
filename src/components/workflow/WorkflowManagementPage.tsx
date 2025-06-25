
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Play, Edit, Trash2, Settings } from 'lucide-react';
import { useWorkflows } from '@/hooks/useWorkflows';
import { WorkflowBuilder } from './WorkflowBuilder';
import { Workflow } from '@/types/workflow';

const WorkflowManagementPage: React.FC = () => {
  const { workflows, createWorkflow, updateWorkflow, deleteWorkflow, isLoading } = useWorkflows();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateWorkflow = () => {
    setEditingWorkflow(null);
    setShowBuilder(true);
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setShowBuilder(true);
  };

  const handleSaveWorkflow = (name: string, nodes: any[], edges: any[]) => {
    if (editingWorkflow) {
      updateWorkflow({
        id: editingWorkflow.id,
        name,
        nodes,
        edges,
      });
    } else {
      createWorkflow({ name });
    }
    setShowBuilder(false);
    setEditingWorkflow(null);
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      deleteWorkflow(workflowId);
    }
  };

  if (showBuilder) {
    return (
      <WorkflowBuilder
        workflowId={editingWorkflow?.id}
        initialName={editingWorkflow?.name}
        initialNodes={editingWorkflow?.workflow_data?.nodes || []}
        initialEdges={editingWorkflow?.workflow_data?.edges || []}
        onSave={handleSaveWorkflow}
      />
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Workflow Management</h1>
          <p className="text-gray-600">Create and manage automated workflows for your organization</p>
        </div>
        <Button onClick={handleCreateWorkflow}>
          <Plus className="w-4 h-4 mr-2" />
          Create Workflow
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <Input
          placeholder="Search workflows..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {workflow.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                    {workflow.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>Nodes: {workflow.workflow_data?.nodes?.length || 0}</span>
                  <span>v{workflow.version}</span>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditWorkflow(workflow)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <Play className="w-4 h-4 mr-1" />
                    Run
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredWorkflows.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Settings className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'No workflows match your search.' : 'Get started by creating your first workflow.'}
          </p>
          {!searchTerm && (
            <Button onClick={handleCreateWorkflow}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Workflow
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowManagementPage;
