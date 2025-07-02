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
  startConnectionDrag: (handleId: string, job: JobBoardWithCadet, event: React.MouseEvent) => void;
  completeConnectionDrop: (targetJobId: string, targetHandle: string) => void;
  isValidDropTarget: (jobId: string, handleId: string) => boolean;
  editState: any;
}

export const useJobBoardNodes = ({
  jobs,
  getSavedPositions,
  handleNodesChange,
  startConnectionDrag,
  completeConnectionDrop,
  isValidDropTarget,
  editState
}: UseJobBoardNodesProps) => {
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
    const flowNodes = createFlowNodes(jobs, positions, startConnectionDrag, completeConnectionDrop, isValidDropTarget, editState);
    const flowEdges = createFlowEdges(hierarchyResult, jobs);

    return {
      nodes: flowNodes,
      edges: flowEdges,
    };
  }, [jobs, getSavedPositions, startConnectionDrag, completeConnectionDrop, isValidDropTarget, editState]);

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