
import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobBoardWithCadet } from '../types';
import { JobRoleNode } from './JobRoleNode';
import { buildJobHierarchy } from '../utils/hierarchyBuilder';
import { calculateNodePositions, DEFAULT_POSITION_CONFIG } from '../utils/nodePositioning';
import { createFlowNodes, createFlowEdges } from '../utils/flowElementFactory';

interface JobBoardChartProps {
  jobs: JobBoardWithCadet[];
  onRefresh?: () => void;
}

const nodeTypes = {
  jobRole: JobRoleNode,
};

export const JobBoardChart = ({ jobs, onRefresh }: JobBoardChartProps) => {
  const initialNodesAndEdges = useMemo(() => {
    if (jobs.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Build the hierarchy
    const hierarchyResult = buildJobHierarchy(jobs);
    
    // Calculate node positions
    const positions = calculateNodePositions(jobs, hierarchyResult.nodes, DEFAULT_POSITION_CONFIG);
    
    // Create React Flow elements
    const flowNodes = createFlowNodes(jobs, positions);
    const flowEdges = createFlowEdges(hierarchyResult);

    console.log('Final nodes:', flowNodes.length);
    console.log('Final edges:', flowEdges.length);

    return {
      nodes: flowNodes,
      edges: flowEdges,
    };
  }, [jobs]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesAndEdges.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialNodesAndEdges.edges);

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        <p>No job assignments to display in the organizational chart.</p>
      </div>
    );
  }

  return (
    <div className="relative h-96 w-full border rounded-lg">
      {onRefresh && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="bg-white/90 backdrop-blur-sm"
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
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
