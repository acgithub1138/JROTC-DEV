
import { Node, Edge, Position } from '@xyflow/react';
import { JobBoardWithCadet } from '../types';
import { HierarchyResult } from './hierarchyBuilder';

const getOccupiedHandles = (jobs: JobBoardWithCadet[], currentJob: JobBoardWithCadet): Set<string> => {
  const occupiedHandles = new Set<string>();

  // Check if this job has outgoing connections (source handles)
  if (currentJob.reports_to && currentJob.reports_to_source_handle) {
    occupiedHandles.add(currentJob.reports_to_source_handle);
  }
  if (currentJob.assistant && currentJob.assistant_source_handle) {
    occupiedHandles.add(currentJob.assistant_source_handle);
  }

  // Check if other jobs point to this job (target handles)
  jobs.forEach(otherJob => {
    if (otherJob.id !== currentJob.id) {
      // Check reports_to relationships pointing to current job
      if (otherJob.reports_to === currentJob.role && otherJob.reports_to_target_handle) {
        occupiedHandles.add(otherJob.reports_to_target_handle);
      }
      // Check assistant relationships pointing to current job
      if (otherJob.assistant === currentJob.role && otherJob.assistant_target_handle) {
        occupiedHandles.add(otherJob.assistant_target_handle);
      }
    }
  });

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
  console.log('🔗 Creating flow edges:', { hierarchyEdgesCount: hierarchyResult.edges.length });
  
  // Create a map for quick job lookup
  const jobMap = new Map(jobs.map(job => [job.id, job]));
  
  const flowEdges = hierarchyResult.edges.map((edge) => {
    const sourceJob = jobMap.get(edge.source);
    
    if (edge.type === 'assistant') {
      // Assistant relationships: use stored handle preferences or defaults
      const sourceHandle = sourceJob?.assistant_source_handle || 'right-source';
      const targetHandle = sourceJob?.assistant_target_handle || 'left-target';
      
      const edgeObj = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle,
        targetHandle,
        type: 'smoothstep',
        animated: false,
        style: { pointerEvents: 'all' as const },
        data: { connectionType: 'assistant' }
      };
      
      console.log('📎 Created assistant edge:', edgeObj);
      return edgeObj;
    } else {
      // Reports_to relationships: use stored handle preferences or defaults
      const sourceHandle = sourceJob?.reports_to_source_handle || 'bottom-source';
      const targetHandle = sourceJob?.reports_to_target_handle || 'top-target';
      
      const edgeObj = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle,
        targetHandle,
        type: 'smoothstep',
        animated: false,
        style: { pointerEvents: 'all' as const },
        data: { connectionType: 'reports_to' }
      };
      
      console.log('📎 Created reports_to edge:', edgeObj);
      return edgeObj;
    }
  });
  
  console.log('✅ Flow edges created:', flowEdges.length);
  return flowEdges;
};
