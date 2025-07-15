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

  // Helper function to identify changed jobs using ID-based comparison
  const getChangedJobs = useCallback((currentJobs: JobBoardWithCadet[], previousJobs: JobBoardWithCadet[]) => {
    const changedJobIds = new Set<string>();
    
    // Create maps for efficient lookup
    const currentJobsMap = new Map(currentJobs.map(job => [job.id, job]));
    const previousJobsMap = new Map(previousJobs.map(job => [job.id, job]));
    
    // Check for new jobs
    currentJobsMap.forEach((job, id) => {
      if (!previousJobsMap.has(id)) {
        changedJobIds.add(id);
      }
    });
    
    // Check for removed jobs (not needed for updates, but track length change)
    const hasRemovedJobs = previousJobsMap.size > currentJobsMap.size;
    
    // Check for modified jobs by comparing specific fields
    currentJobsMap.forEach((currentJob, id) => {
      const previousJob = previousJobsMap.get(id);
      if (previousJob) {
        // Only check fields that affect visual representation
        const fieldsToCheck = [
          'role', 'cadet_id', 'reports_to', 'assistant',
          'reports_to_source_handle', 'reports_to_target_handle',
          'assistant_source_handle', 'assistant_target_handle'
        ] as const;
        
        const changedFields: string[] = [];
        const hasChanges = fieldsToCheck.some(field => {
          const isChanged = currentJob[field] !== previousJob[field];
          if (isChanged) {
            changedFields.push(`${field}: ${previousJob[field]} -> ${currentJob[field]}`);
          }
          return isChanged;
        });
        
        if (hasChanges) {
          console.log(`🔄 Job ${id} (${currentJob.role}) has changes:`, changedFields);
          changedJobIds.add(id);
        }
      }
    });

    // If jobs were removed, mark all as changed to trigger full rebuild
    if (hasRemovedJobs) {
      currentJobs.forEach(job => changedJobIds.add(job.id));
    }

    return changedJobIds;
  }, []);

  // Helper function to update specific nodes efficiently
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

      // Create a map of current nodes for efficient lookup
      const currentNodesMap = new Map(currentNodes.map(node => [node.id, node]));
      
      // Only update changed nodes, preserve others exactly as they are
      return currentNodes.map(node => {
        if (changedJobIds.has(node.id)) {
          const job = allJobs.find(j => j.id === node.id);
          if (job) {
            // Use saved position if available, otherwise keep current position
            const savedPosition = positions.get(job.id);
            const position = savedPosition || { x: node.position.x, y: node.position.y };
            
            // Create new node data but preserve position and other React Flow properties
            const [updatedNode] = createFlowNodes([job], new Map([[job.id, position]]));
            console.log('🔄 Updated node data for:', node.id);
            
            return {
              ...node, // Preserve React Flow internals
              ...updatedNode, // Apply new data
              position, // Ensure position is correctly set
            };
          }
        }
        return node; // Return unchanged node
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