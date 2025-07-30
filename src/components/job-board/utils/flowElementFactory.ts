
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
  console.log('🔗 Creating flow edges from connections:', { hierarchyEdgesCount: hierarchyResult.edges.length });
  
  const jobMap = new Map(jobs.map(job => [job.id, job]));
  const flowEdges: Edge[] = [];
  
  // Create edges from connections data
  jobs.forEach(job => {
    if (job.connections && job.connections.length > 0) {
      job.connections.forEach(connection => {
        // Find the target job by role
        const targetJob = jobs.find(j => j.role === connection.target_role);
        if (!targetJob) {
          console.warn(`Target job not found for role: ${connection.target_role}`);
          return;
        }

        const edgeObj = {
          id: connection.id,
          source: job.id,
          target: targetJob.id,
          sourceHandle: connection.source_handle,
          targetHandle: connection.target_handle,
          type: 'smoothstep',
          animated: false,
          style: { pointerEvents: 'all' as const },
          data: { 
            connectionType: connection.type,
            connectionId: connection.id
          }
        };
        
        console.log(`📎 Created ${connection.type} edge from connections:`, edgeObj);
        flowEdges.push(edgeObj);
      });
    }
  });

  // All jobs should now use the connections system
  console.log('✅ Total flow edges created:', flowEdges.length);
  return flowEdges;
};
