
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Play, Settings } from 'lucide-react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodePalette } from './NodePalette';
import { PropertyPanel } from './PropertyPanel';
import { WorkflowNode, WorkflowEdge, NodeTypeDefinition } from '@/types/workflow';
import { useToast } from '@/hooks/use-toast';

interface WorkflowBuilderProps {
  workflowId?: string;
  initialName?: string;
  initialNodes?: WorkflowNode[];
  initialEdges?: WorkflowEdge[];
  onSave: (name: string, nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
  onTest?: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflowId,
  initialName = 'New Workflow',
  initialNodes = [],
  initialEdges = [],
  onSave,
  onTest,
}) => {
  const [workflowName, setWorkflowName] = useState(initialName);
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const { toast } = useToast();

  const handleNodeAdd = useCallback((nodeDefinition: NodeTypeDefinition) => {
    const newNode: WorkflowNode = {
      id: `${nodeDefinition.type}-${Date.now()}`,
      type: nodeDefinition.type,
      position: { x: Math.random() * 300 + 100, y: Math.random() * 200 + 100 },
      data: {
        label: nodeDefinition.label,
        nodeType: nodeDefinition.category,
        nodeSubtype: nodeDefinition.subtype,
        configuration: {},
      },
    };

    setNodes(prev => [...prev, newNode]);
  }, []);

  const handleNodesChange = useCallback((newNodes: WorkflowNode[]) => {
    setNodes(newNodes);
  }, []);

  const handleEdgesChange = useCallback((newEdges: WorkflowEdge[]) => {
    setEdges(newEdges);
  }, []);

  const handleNodeSelect = useCallback((node: WorkflowNode | null) => {
    setSelectedNode(node);
  }, []);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<WorkflowNode['data']>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    ));

    // Update selected node if it's the one being updated
    if (selectedNode?.id === nodeId) {
      setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, ...updates } } : null);
    }
  }, [selectedNode]);

  const handleSave = () => {
    if (!workflowName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a workflow name.",
        variant: "destructive",
      });
      return;
    }

    onSave(workflowName, nodes, edges);
  };

  const handleTest = () => {
    if (onTest) {
      onTest(nodes, edges);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="font-semibold text-lg border-none shadow-none p-0 h-auto"
            placeholder="Workflow Name"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          {onTest && (
            <Button variant="outline" onClick={handleTest}>
              <Play className="w-4 h-4 mr-2" />
              Test
            </Button>
          )}
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <NodePalette onNodeAdd={handleNodeAdd} />
        
        <div className="flex-1">
          <WorkflowCanvas
            initialNodes={nodes}
            initialEdges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeSelect={handleNodeSelect}
          />
        </div>
        
        <PropertyPanel
          selectedNode={selectedNode}
          onNodeUpdate={handleNodeUpdate}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </div>
  );
};
