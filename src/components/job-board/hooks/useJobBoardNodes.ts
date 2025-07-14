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
  const previousJobsRef = useRef<string>('');
  const previousPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  
  useEffect(() => {
    // Create a stable string representation of jobs
    const jobsSignature = jobs.map(job => job.id + job.updated_at).join('|');
    const positionsSignature = Array.from(savedPositionsMap.entries()).map(([id, pos]) => `${id}:${pos.x},${pos.y}`).join('|');
    
    // Only update if jobs actually changed, not just their positions
    const jobsChanged = jobsSignature !== previousJobsRef.current;
    const positionsChanged = positionsSignature !== Array.from(previousPositionsRef.current.entries()).map(([id, pos]) => `${id}:${pos.x},${pos.y}`).join('|');
    
    if (jobsChanged || (positionsChanged && jobs.length > 0)) {
      console.log('🔄 Jobs or positions changed, updating nodes and edges', { 
        jobsChanged, 
        positionsChanged,
        jobsLength: jobs.length 
      });
      setNodes(initialNodesAndEdges.nodes);
      setEdges(initialNodesAndEdges.edges);
      previousJobsRef.current = jobsSignature;
      previousPositionsRef.current = new Map(savedPositionsMap);
    }
  }, [jobs, savedPositionsMap, initialNodesAndEdges, setNodes, setEdges]);

  return {
    nodes,
    edges,
    handleNodeChange,
    onEdgesChange
  };
};