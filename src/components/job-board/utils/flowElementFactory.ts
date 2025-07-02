
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
      data: {
        job,
        role: job.role,
        cadetName: `${job.cadet.last_name}, ${job.cadet.first_name}`,
        rank: job.cadet.rank || '',
        grade: job.cadet.grade || '',
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });
};

export const createFlowEdges = (hierarchyResult: HierarchyResult): Edge[] => {
  return hierarchyResult.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: false,
  }));
};
