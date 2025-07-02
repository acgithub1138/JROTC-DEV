
import React, { useMemo, useCallback, useEffect } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, NodeChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { RefreshCcw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobBoardWithCadet } from '../types';
import { JobRoleNode } from './JobRoleNode';
import { buildJobHierarchy } from '../utils/hierarchyBuilder';
import { calculateNodePositions, DEFAULT_POSITION_CONFIG } from '../utils/nodePositioning';
import { createFlowNodes, createFlowEdges } from '../utils/flowElementFactory';
import { useJobBoardLayout } from '../hooks/useJobBoardLayout';

interface JobBoardChartProps {
  jobs: JobBoardWithCadet[];
  onRefresh?: () => void;
  onConnectionSettings?: (job: JobBoardWithCadet) => void;
}

const nodeTypes = {
  jobRole: JobRoleNode,
};

export const JobBoardChart = ({ jobs, onRefresh, onConnectionSettings }: JobBoardChartProps) => {
  const { getSavedPositions, handleNodesChange, resetLayout, isResetting } = useJobBoardLayout();

  const initialNodesAndEdges = useMemo(() => {
    if (jobs.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Build the hierarchy
    const hierarchyResult = buildJobHierarchy(jobs);
    
    // Get saved positions and merge with automatic layout
    const savedPositions = getSavedPositions();
    const positions = calculateNodePositions(jobs, hierarchyResult.nodes, DEFAULT_POSITION_CONFIG, savedPositions);
    
    // Create React Flow elements
    const flowNodes = createFlowNodes(jobs, positions, onConnectionSettings);
    const flowEdges = createFlowEdges(hierarchyResult, jobs);

    console.log('Final nodes:', flowNodes.length);
    console.log('Final edges:', flowEdges.length);

    return {
      nodes: flowNodes,
      edges: flowEdges,
    };
  }, [jobs, getSavedPositions, onConnectionSettings]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesAndEdges.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialNodesAndEdges.edges);

  // Handle node changes with position persistence
  const handleNodeChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    handleNodesChange(changes, nodes);
  }, [onNodesChange, handleNodesChange, nodes]);

  // Update nodes when initialNodesAndEdges changes (for saved positions)
  useEffect(() => {
    setNodes(initialNodesAndEdges.nodes);
    setEdges(initialNodesAndEdges.edges);
  }, [initialNodesAndEdges, setNodes, setEdges]);

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <p>No job assignments to display in the organizational chart.</p>
      </div>
    );
  }

  return (
    <div className="relative h-96 w-full border rounded-lg">
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="bg-white/90 backdrop-blur-sm"
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={resetLayout}
          disabled={isResetting}
          className="bg-white/90 backdrop-blur-sm"
          title="Reset layout to default"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodeChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};
