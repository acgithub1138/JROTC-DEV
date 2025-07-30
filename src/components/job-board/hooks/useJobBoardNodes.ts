
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
          'role', 'cadet_id', 'reports_to', 'assistant', 'connections'
        ] as const;
        
        const hasChanges = fieldsToCheck.some(field => 
          currentJob[field] !== previousJob[field]
        );
        
        if (hasChanges) {
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

    setNodes(currentNodes => {
      // If we have no nodes or need to add/remove nodes, recreate all
      if (currentNodes.length !== allJobs.length) {
        const flowNodes = createFlowNodes(allJobs, positions);
        console.log(`🔄 Recreated all ${flowNodes.length} nodes due to count change`);
        return flowNodes;
      }

      // Only update changed nodes, preserve others exactly as they are
      return currentNodes.map(node => {
        if (changedJobIds.has(node.id)) {
          const job = allJobs.find(j => j.id === node.id);
          if (job) {
            // Use calculated position (legacy layout already applied)
            const position = positions.get(job.id) || { x: node.position.x, y: node.position.y };
            
            // Create new node data but preserve position and other React Flow properties
            const [updatedNode] = createFlowNodes([job], new Map([[job.id, position]]));
            
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

    // Determine if we need to recalculate layout
    const needsLayoutRecalculation = !isInitializedRef.current || hasJobChanges || 
      (hasPositionChanges && savedPositionsMap.size === 0); // Only recalculate if positions were cleared

    if (needsLayoutRecalculation) {
      console.log(`🎯 Recalculating layout using legacy algorithm`);
      
      const hierarchyResult = buildJobHierarchy(jobs);
      const positions = calculateNodePositions(
        jobs, 
        hierarchyResult.nodes, 
        DEFAULT_POSITION_CONFIG, 
        savedPositionsMap
      );
      
      if (!isInitializedRef.current || hasJobChanges) {
        // Full recreation
        const flowNodes = createFlowNodes(jobs, positions);
        const flowEdges = createFlowEdges(hierarchyResult, jobs);
        
        setNodes(flowNodes);
        setEdges(flowEdges);
        console.log(`✨ Created legacy layout with ${flowNodes.length} nodes`);
        
        isInitializedRef.current = true;
      } else {
        // Update specific nodes
        updateSpecificNodes(changedJobIds, jobs, positions);
        
        // Always update edges when jobs change
        const flowEdges = createFlowEdges(hierarchyResult, jobs);
        setEdges(flowEdges);
      }
    } else if (hasPositionChanges) {
      // Only position changes, update existing nodes
      console.log('📍 Updating node positions from saved preferences');
      setNodes(currentNodes => 
        currentNodes.map(node => {
          const savedPosition = savedPositionsMap.get(node.id);
          if (savedPosition) {
            return { ...node, position: savedPosition };
          }
          return node;
        })
      );
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
