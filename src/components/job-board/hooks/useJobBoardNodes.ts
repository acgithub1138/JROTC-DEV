import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useNodesState, useEdgesState, NodeChange } from '@xyflow/react';
import { JobBoardWithCadet } from '../types';
import { buildJobHierarchy } from '../utils/hierarchyBuilder';
import { calculateNodePositions, DEFAULT_POSITION_CONFIG } from '../utils/nodePositioning';
import { createFlowNodes, createFlowEdges } from '../utils/flowElementFactory';

interface UseJobBoardNodesProps {
  jobs: JobBoardWithCadet[];
  savedPositionsMap: Map<string, { x: number; y: number }>;
  handleNodesChange: (changes: NodeChange[], nodes: any[]) => void;
}

export const useJobBoardNodes = ({
  jobs,
  savedPositionsMap,
  handleNodesChange,
}: UseJobBoardNodesProps) => {
  const initialNodesAndEdges = useMemo(() => {
    if (jobs.length === 0) {
      return { nodes: [], edges: [] };
    }

    console.log('🔄 Recreating nodes and edges...', { jobsLength: jobs.length });

    // Build the hierarchy
    const hierarchyResult = buildJobHierarchy(jobs);
    
    // Use stabilized saved positions
    const positions = calculateNodePositions(jobs, hierarchyResult.nodes, DEFAULT_POSITION_CONFIG, savedPositionsMap);
    
    // Create React Flow elements
    const flowNodes = createFlowNodes(jobs, positions);
    const flowEdges = createFlowEdges(hierarchyResult, jobs);

    console.log('✅ Created nodes and edges:', { nodesCount: flowNodes.length, edgesCount: flowEdges.length });

    return {
      nodes: flowNodes,
      edges: flowEdges,
    };
  }, [jobs, savedPositionsMap]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesAndEdges.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialNodesAndEdges.edges);

  // Handle node changes with position persistence
  const handleNodeChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    handleNodesChange(changes, nodes);
  }, [onNodesChange, handleNodesChange, nodes]);

  // Only update nodes and edges when jobs actually change, not when layout preferences change
  const previousJobsRef = useRef<JobBoardWithCadet[]>([]);
  useEffect(() => {
    // Compare jobs by ID to see if they actually changed
    const jobsChanged = jobs.length !== previousJobsRef.current.length || 
      jobs.some((job, index) => job.id !== previousJobsRef.current[index]?.id);
    
    if (jobsChanged) {
      console.log('🔄 Jobs changed, updating nodes and edges');
      setNodes(initialNodesAndEdges.nodes);
      setEdges(initialNodesAndEdges.edges);
      previousJobsRef.current = jobs;
    }
  }, [jobs, initialNodesAndEdges, setNodes, setEdges]);

  return {
    nodes,
    edges,
    handleNodeChange,
    onEdgesChange
  };
};