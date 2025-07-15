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

  // Only update when jobs actually change (not layout/positions)
  const previousJobsRef = useRef<JobBoardWithCadet[]>([]);
  
  useEffect(() => {
    // Compare actual job changes, not string signatures
    const jobsChanged = jobs.length !== previousJobsRef.current.length || 
      jobs.some((job, index) => {
        const prevJob = previousJobsRef.current[index];
        return !prevJob || 
          job.id !== prevJob.id || 
          job.updated_at !== prevJob.updated_at ||
          job.role !== prevJob.role ||
          job.reports_to !== prevJob.reports_to ||
          job.assistant !== prevJob.assistant ||
          job.reports_to_source_handle !== prevJob.reports_to_source_handle ||
          job.reports_to_target_handle !== prevJob.reports_to_target_handle ||
          job.assistant_source_handle !== prevJob.assistant_source_handle ||
          job.assistant_target_handle !== prevJob.assistant_target_handle;
      });
    
    if (jobsChanged) {
      console.log('🔄 Jobs changed, updating nodes and edges', { 
        jobsLength: jobs.length,
        previousLength: previousJobsRef.current.length
      });
      setNodes(initialNodesAndEdges.nodes);
      setEdges(initialNodesAndEdges.edges);
      previousJobsRef.current = [...jobs];
    }
  }, [jobs, initialNodesAndEdges, setNodes, setEdges]);

  return {
    nodes,
    edges,
    handleNodeChange,
    onEdgesChange
  };
};