import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Play, Settings, Activity, Database, Code, FileText } from 'lucide-react';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodePalette } from './NodePalette';
import { PropertyPanel } from './PropertyPanel';
import { WorkflowTester } from './WorkflowTester';
import { WorkflowExecutionMonitor } from './WorkflowExecutionMonitor';
import { VariableManager } from './VariableManager';
import { WorkflowTemplates } from './WorkflowTemplates';
import { DatabaseIntegrationPanel } from './DatabaseIntegrationPanel';
import { WorkflowNode, WorkflowEdge, NodeTypeDefinition } from '@/types/workflow';
import { useToast } from '@/hooks/use-toast';

interface Variable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  value: any;
  description?: string;
}

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
  const [variables, setVariables] = useState<Variable[]>([]);
  const [activeTab, setActiveTab] = useState('canvas');
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

  const handleTemplateSelect = useCallback((template: any) => {
    setNodes(template.nodes);
    setEdges(template.edges);
    setWorkflowName(template.name);
    toast({
      title: "Template Applied",
      description: `${template.name} template has been loaded successfully.`,
    });
  }, [toast]);

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
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <NodePalette onNodeAdd={handleNodeAdd} />
        
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-6 mx-4 mt-2">
              <TabsTrigger value="canvas" className="flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Canvas
              </TabsTrigger>
              <TabsTrigger value="variables" className="flex items-center">
                <Code className="w-4 h-4 mr-2" />
                Variables
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center">
                <Database className="w-4 h-4 mr-2" />
                Database
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="test" className="flex items-center">
                <Play className="w-4 h-4 mr-2" />
                Test
              </TabsTrigger>
              <TabsTrigger value="monitor" className="flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Monitor
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="canvas" className="flex-1 flex">
              <div className="flex-1">
                <WorkflowCanvas
                  initialNodes={nodes}
                  initialEdges={edges}
                  onNodesChange={setNodes}
                  onEdgesChange={setEdges}
                  onNodeSelect={setSelectedNode}
                />
              </div>
            </TabsContent>

            <TabsContent value="variables" className="flex-1 p-4">
              <VariableManager
                variables={variables}
                onVariablesChange={setVariables}
              />
            </TabsContent>

            <TabsContent value="database" className="flex-1 p-4">
              {workflowId ? (
                <DatabaseIntegrationPanel
                  workflowId={workflowId}
                  onConnectionsChange={(connections) => {
                    console.log('Database connections updated:', connections);
                  }}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Save the workflow first to configure database integrations
                </div>
              )}
            </TabsContent>

            <TabsContent value="templates" className="flex-1 p-4">
              <WorkflowTemplates onTemplateSelect={handleTemplateSelect} />
            </TabsContent>
            
            <TabsContent value="test" className="flex-1 p-4">
              {workflowId ? (
                <WorkflowTester
                  workflowId={workflowId}
                  nodes={nodes}
                  edges={edges}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Save the workflow first to enable testing
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="monitor" className="flex-1 p-4">
              <WorkflowExecutionMonitor workflowId={workflowId} />
            </TabsContent>
          </Tabs>
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
