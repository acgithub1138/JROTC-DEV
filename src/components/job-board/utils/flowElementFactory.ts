
import { Node, Edge, Position } from '@xyflow/react';
import { JobBoardWithCadet, Connection } from '../types';
import { HierarchyResult } from './hierarchyBuilder';

const getOccupiedHandles = (jobs: JobBoardWithCadet[], currentJob: JobBoardWithCadet): Set<string> => {
  const occupiedHandles = new Set<string>();

  // Get occupied source handles from the connections array
  if (currentJob.connections && currentJob.connections.length > 0) {
    currentJob.connections.forEach(connection => {
      occupiedHandles.add(connection.source_handle);
    });
  }

  return occupiedHandles;
};

export const createFlowNodes = (
  jobs: JobBoardWithCadet[],
  positions: Map<string, { x: number; y: number }>
): Node[] => {
  return jobs.map((job) => {
    const position = positions.get(job.id) || { x: 0, y: 0 };
    const occupiedHandles = getOccupiedHandles(jobs, job);
    
    return {
      id: job.id,
      type: 'jobRole',
      position,
      draggable: true,
      data: {
        job,
        role: job.role,
        cadetName: job.cadet ? `${job.cadet.last_name}, ${job.cadet.first_name}` : 'Unassigned',
        rank: job.cadet?.rank || '',
        grade: job.cadet?.grade || '',
        occupiedHandles,
      },
    };
  });
};

export const createFlowEdges = (
  hierarchyResult: HierarchyResult,
  jobs: JobBoardWithCadet[]
): Edge[] => {
  console.log('Creating flow edges - hierarchy edges:', hierarchyResult.edges.length);
  
  const flowEdges: Edge[] = [];
  
  // Create edges from hierarchy edges (built from reports_to and assistant fields)
  hierarchyResult.edges.forEach((hierarchyEdge) => {
    const sourceJob = jobs.find(j => j.id === hierarchyEdge.source);
    const targetJob = jobs.find(j => j.id === hierarchyEdge.target);
    
    if (!sourceJob || !targetJob) {
      console.warn(`Source or target job not found for edge:`, hierarchyEdge.id);
      return;
    }

    // Determine handles based on relationship type
    let sourceHandle = 'bottom-source';
    let targetHandle = 'top-target';
    
    if (hierarchyEdge.type === 'assistant') {
      sourceHandle = 'right-source';
      targetHandle = 'left-target';
    }

    const edgeObj = {
      id: hierarchyEdge.id,
      source: hierarchyEdge.source,
      target: hierarchyEdge.target,
      sourceHandle,
      targetHandle,
      type: 'smoothstep' as const,
      animated: false,
      style: { 
        pointerEvents: 'all' as const,
        stroke: hierarchyEdge.type === 'assistant' ? '#10b981' : '#6366f1',
        strokeWidth: 2
      },
      data: { 
        connectionType: hierarchyEdge.type,
        connectionId: hierarchyEdge.id
      }
    };
    
    flowEdges.push(edgeObj);
  });

  // Also create edges from connections array for backward compatibility
  jobs.forEach(job => {
    if (job.connections && job.connections.length > 0) {
      job.connections.forEach(connection => {
        // Skip connections with "NA" target role as it's not an actual job
        if (connection.target_role === 'NA') {
          return;
        }
        
        // Find the target job by role
        const targetJob = jobs.find(j => j.role === connection.target_role);
        if (!targetJob) {
          console.warn(`Target job not found for role: ${connection.target_role}`);
          return;
        }

        // Check if this edge already exists from hierarchy
        const existingEdge = flowEdges.find(edge => 
          edge.source === job.id && edge.target === targetJob.id
        );
        
        if (existingEdge) {
          return; // Skip duplicate
        }

        const edgeObj = {
          id: connection.id,
          source: job.id,
          target: targetJob.id,
          sourceHandle: connection.source_handle,
          targetHandle: connection.target_handle,
          type: 'smoothstep' as const,
          animated: false,
          style: { pointerEvents: 'all' as const },
          data: { 
            connectionType: connection.type,
            connectionId: connection.id
          }
        };
        
        flowEdges.push(edgeObj);
      });
    }
  });

  console.log('Flow edges created:', flowEdges.length);
  return flowEdges;
};
