import { useMemo, useCallback, useEffect, useRef } from 'react';
import { useNodesState, useEdgesState, NodeChange, Node, Edge } from '@xyflow/react';
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
  // Initialize with empty nodes/edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Refs to track previous state for change detection
  const previousJobsRef = useRef<JobBoardWithCadet[]>([]);
  const previousSavedPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const isInitializedRef = useRef(false);

  // Handle node changes with position persistence
  const handleNodeChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes);
    handleNodesChange(changes, nodes);
  }, [onNodesChange, handleNodesChange, nodes]);

  // Helper function to identify changed jobs
  const getChangedJobs = useCallback((currentJobs: JobBoardWithCadet[], previousJobs: JobBoardWithCadet[]) => {
    const changedJobIds = new Set<string>();
    
    // Check for new/removed jobs
    if (currentJobs.length !== previousJobs.length) {
      currentJobs.forEach(job => changedJobIds.add(job.id));
      return changedJobIds;
    }

    // Check for modified jobs
    currentJobs.forEach((job, index) => {
      const prevJob = previousJobs[index];
      if (!prevJob || 
          job.id !== prevJob.id || 
          job.updated_at !== prevJob.updated_at ||
          job.role !== prevJob.role ||
          job.cadet_id !== prevJob.cadet_id ||
          job.reports_to !== prevJob.reports_to ||
          job.assistant !== prevJob.assistant ||
          job.reports_to_source_handle !== prevJob.reports_to_source_handle ||
          job.reports_to_target_handle !== prevJob.reports_to_target_handle ||
          job.assistant_source_handle !== prevJob.assistant_source_handle ||
          job.assistant_target_handle !== prevJob.assistant_target_handle) {
        changedJobIds.add(job.id);
      }
    });

    return changedJobIds;
  }, []);

  // Helper function to update specific nodes
  const updateSpecificNodes = useCallback((changedJobIds: Set<string>, allJobs: JobBoardWithCadet[], positions: Map<string, { x: number; y: number }>) => {
    if (changedJobIds.size === 0) return;

    console.log('🔄 Updating specific nodes:', Array.from(changedJobIds));

    setNodes(currentNodes => {
      // If we have no nodes or need to add/remove nodes, recreate all
      if (currentNodes.length !== allJobs.length) {
        const flowNodes = createFlowNodes(allJobs, positions);
        console.log('✅ Recreated all nodes due to length change');
        return flowNodes;
      }

      // Otherwise, update only the changed nodes
      return currentNodes.map(node => {
        if (changedJobIds.has(node.id)) {
          const job = allJobs.find(j => j.id === node.id);
          if (job) {
            const position = positions.get(job.id) || { x: node.position.x, y: node.position.y };
            const [updatedNode] = createFlowNodes([job], new Map([[job.id, position]]));
            console.log('🔄 Updated node:', node.id);
            return {
              ...updatedNode,
              position // Preserve current position if not changed
            };
          }
        }
        return node;
      });
    });
  }, []);

  // Main effect for handling job and position changes
  useEffect(() => {
    if (jobs.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Check for job changes
    const changedJobIds = getChangedJobs(jobs, previousJobsRef.current);
    const hasJobChanges = changedJobIds.size > 0;

    // Check for position changes
    const hasPositionChanges = savedPositionsMap.size !== previousSavedPositionsRef.current.size ||
      Array.from(savedPositionsMap.entries()).some(([id, position]) => {
        const prevPosition = previousSavedPositionsRef.current.get(id);
        return !prevPosition || prevPosition.x !== position.x || prevPosition.y !== position.y;
      });

    // Initial load - create everything
    if (!isInitializedRef.current || (hasPositionChanges && !hasJobChanges)) {
      console.log('🔄 Initial load or position-only changes');
      const hierarchyResult = buildJobHierarchy(jobs);
      const positions = calculateNodePositions(jobs, hierarchyResult.nodes, DEFAULT_POSITION_CONFIG, savedPositionsMap);
      const flowNodes = createFlowNodes(jobs, positions);
      const flowEdges = createFlowEdges(hierarchyResult, jobs);
      
      setNodes(flowNodes);
      setEdges(flowEdges);
      isInitializedRef.current = true;
    }
    // Job changes - update selectively
    else if (hasJobChanges) {
      console.log('🔄 Job changes detected, updating selectively');
      const hierarchyResult = buildJobHierarchy(jobs);
      const positions = calculateNodePositions(jobs, hierarchyResult.nodes, DEFAULT_POSITION_CONFIG, savedPositionsMap);
      
      // Update specific nodes
      updateSpecificNodes(changedJobIds, jobs, positions);
      
      // Always update edges when jobs change (connections might have changed)
      const flowEdges = createFlowEdges(hierarchyResult, jobs);
      setEdges(flowEdges);
    }

    // Update refs
    if (hasJobChanges) {
      previousJobsRef.current = [...jobs];
    }
    if (hasPositionChanges) {
      previousSavedPositionsRef.current = new Map(savedPositionsMap);
    }
  }, [jobs, savedPositionsMap, getChangedJobs, updateSpecificNodes]);

  return {
    nodes,
    edges,
    handleNodeChange,
    onEdgesChange
  };
};