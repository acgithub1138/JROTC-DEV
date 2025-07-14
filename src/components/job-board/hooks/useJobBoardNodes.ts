import { useMemo, useCallback, useEffect } from 'react';
import { useNodesState, useEdgesState, NodeChange } from '@xyflow/react';
import { JobBoardWithCadet } from '../types';
import { buildJobHierarchy } from '../utils/hierarchyBuilder';
import { calculateNodePositions, DEFAULT_POSITION_CONFIG } from '../utils/nodePositioning';
import { createFlowNodes, createFlowEdges } from '../utils/flowElementFactory';

interface UseJobBoardNodesProps {
  jobs: JobBoardWithCadet[];
  getSavedPositions: () => Map<string, { x: number; y: number }>;
  handleNodesChange: (changes: NodeChange[], nodes: any[]) => void;
  layoutPreferences: any[];
}

export const useJobBoardNodes = ({
  jobs,
  getSavedPositions,
  handleNodesChange,
  layoutPreferences
}: UseJobBoardNodesProps) => {
  // Memoize the saved positions separately to avoid frequent recalculations
  const savedPositions = useMemo(() => getSavedPositions(), [layoutPreferences]);

  const initialNodesAndEdges = useMemo(() => {
    if (jobs.length === 0) {
      return { nodes: [], edges: [] };
    }

    console.log('🔄 Recreating nodes and edges...', { jobsLength: jobs.length });

    // Build the hierarchy
    const hierarchyResult = buildJobHierarchy(jobs);
    
    // Use memoized saved positions
    const positions = calculateNodePositions(jobs, hierarchyResult.nodes, DEFAULT_POSITION_CONFIG, savedPositions);
    
    // Create React Flow elements
    const flowNodes = createFlowNodes(jobs, positions);
    const flowEdges = createFlowEdges(hierarchyResult, jobs);

    console.log('✅ Created nodes and edges:', { nodesCount: flowNodes.length, edgesCount: flowEdges.length });

    return {
      nodes: flowNodes,
      edges: flowEdges,
    };
  }, [jobs, savedPositions]);

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

  return {
    nodes,
    edges,
    handleNodeChange,
    onEdgesChange
  };
};