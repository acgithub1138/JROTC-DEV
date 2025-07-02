
import { Node } from '@xyflow/react';
import { JobBoardWithCadet } from '../types';
import { HierarchyNode } from './hierarchyBuilder';

export interface NodePositionConfig {
  nodeWidth: number;
  nodeHeight: number;
  levelHeight: number;
  nodeSpacing: number;
}

export const DEFAULT_POSITION_CONFIG: NodePositionConfig = {
  nodeWidth: 300,
  nodeHeight: 120,
  levelHeight: 200,
  nodeSpacing: 50,
};

export const calculateNodePositions = (
  jobs: JobBoardWithCadet[],
  hierarchyNodes: Map<string, HierarchyNode>,
  config: NodePositionConfig = DEFAULT_POSITION_CONFIG
): Map<string, { x: number; y: number }> => {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Group nodes by level
  const levelGroups = new Map<number, string[]>();
  hierarchyNodes.forEach((node, nodeId) => {
    if (!levelGroups.has(node.level)) {
      levelGroups.set(node.level, []);
    }
    levelGroups.get(node.level)!.push(nodeId);
  });

  console.log('Level groups:', Array.from(levelGroups.entries()));

  // Position nodes within their levels
  levelGroups.forEach((nodeIds, level) => {
    const levelWidth = nodeIds.length * (config.nodeWidth + config.nodeSpacing) - config.nodeSpacing;
    const startX = -levelWidth / 2;
    
    nodeIds.forEach((nodeId, index) => {
      const job = jobs.find(j => j.id === nodeId);
      const isAssistant = job?.assistant;
      
      let xPosition = startX + index * (config.nodeWidth + config.nodeSpacing);
      
      // If this is an assistant role, position it next to its supervisor
      if (isAssistant) {
        const supervisorJob = jobs.find(j => j.role === job.reports_to);
        if (supervisorJob) {
          const supervisorPosition = positions.get(supervisorJob.id);
          if (supervisorPosition) {
            xPosition = supervisorPosition.x + config.nodeWidth + 20;
          }
        }
      }
      
      const position = {
        x: xPosition,
        y: level * config.levelHeight,
      };
      
      positions.set(nodeId, position);
      console.log(`Positioned ${job?.role} at (${xPosition}, ${level * config.levelHeight})`);
    });
  });

  return positions;
};
