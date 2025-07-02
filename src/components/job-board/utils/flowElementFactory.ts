
import { Node, Edge, Position } from '@xyflow/react';
import { JobBoardWithCadet } from '../types';
import { HierarchyResult } from './hierarchyBuilder';

export const createFlowNodes = (
  jobs: JobBoardWithCadet[],
  positions: Map<string, { x: number; y: number }>
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
      },
    };
  });
};

export const createFlowEdges = (hierarchyResult: HierarchyResult): Edge[] => {
  return hierarchyResult.edges.map((edge) => {
    if (edge.type === 'assistant') {
      // Assistant relationships: right-to-left connections
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: 'right-source',
        targetHandle: 'left-target',
        type: 'smoothstep',
        animated: false,
      };
    } else {
      // Reports_to relationships: bottom-to-top connections
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: 'bottom-source',
        targetHandle: 'top-target',
        type: 'smoothstep',
        animated: false,
      };
    }
  });
};
