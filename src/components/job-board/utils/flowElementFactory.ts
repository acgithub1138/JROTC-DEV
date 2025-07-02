
import { Node, Edge, Position } from '@xyflow/react';
import { JobBoardWithCadet } from '../types';
import { HierarchyResult } from './hierarchyBuilder';

export const createFlowNodes = (
  jobs: JobBoardWithCadet[],
  positions: Map<string, { x: number; y: number }>,
  onHandleClick?: (handleId: string, job: JobBoardWithCadet) => void
): Node[] => {
  return jobs.map((job) => {
    const position = positions.get(job.id) || { x: 0, y: 0 };
    
    return {
      id: job.id,
      type: 'jobRole',
      position,
      draggable: true,
      data: {
        job,
        role: job.role,
        cadetName: `${job.cadet.last_name}, ${job.cadet.first_name}`,
        rank: job.cadet.rank || '',
        grade: job.cadet.grade || '',
        onHandleClick,
      },
    };
  });
};

export const createFlowEdges = (
  hierarchyResult: HierarchyResult,
  jobs: JobBoardWithCadet[]
): Edge[] => {
  // Create a map for quick job lookup
  const jobMap = new Map(jobs.map(job => [job.id, job]));
  
  return hierarchyResult.edges.map((edge) => {
    const sourceJob = jobMap.get(edge.source);
    
    if (edge.type === 'assistant') {
      // Assistant relationships: use stored handle preferences or defaults
      const sourceHandle = sourceJob?.assistant_source_handle || 'right-source';
      const targetHandle = sourceJob?.assistant_target_handle || 'left-target';
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle,
        targetHandle,
        type: 'smoothstep',
        animated: false,
      };
    } else {
      // Reports_to relationships: use stored handle preferences or defaults
      const sourceHandle = sourceJob?.reports_to_source_handle || 'bottom-source';
      const targetHandle = sourceJob?.reports_to_target_handle || 'top-target';
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle,
        targetHandle,
        type: 'smoothstep',
        animated: false,
      };
    }
  });
};
