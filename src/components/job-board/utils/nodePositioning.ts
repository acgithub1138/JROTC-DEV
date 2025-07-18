
import { JobBoardWithCadet } from '../types';
import { HierarchyNode } from './hierarchyBuilder';
import { 
  createLayoutNodes, 
  DEFAULT_INTELLIGENT_CONFIG, 
  LayoutConfig 
} from './intelligentLayout';
import { 
  calculateHierarchicalTreeLayout, 
  calculateRadialLayout 
} from './hierarchicalTreeLayout';

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

export type LayoutAlgorithm = 'hierarchical' | 'radial' | 'legacy';

// Legacy positioning for backward compatibility
const calculateLegacyPositions = (
  jobs: JobBoardWithCadet[],
  hierarchyNodes: Map<string, HierarchyNode>,
  config: NodePositionConfig,
  savedPositions?: Map<string, { x: number; y: number }>
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

  // Position nodes within their levels
  levelGroups.forEach((nodeIds, level) => {
    const levelWidth = nodeIds.length * (config.nodeWidth + config.nodeSpacing) - config.nodeSpacing;
    const startX = -levelWidth / 2;
    
    nodeIds.forEach((nodeId, index) => {
      const job = jobs.find(j => j.id === nodeId);
      const isAssistant = job?.assistant;
      
      let xPosition = startX + index * (config.nodeWidth + config.nodeSpacing);
      
      // If this is an assistant role, position it next to its supervisor
      if (isAssistant && isAssistant !== 'NA') {
        const supervisorJob = jobs.find(j => j.role === job.reports_to);
        if (supervisorJob) {
          const supervisorPosition = positions.get(supervisorJob.id);
          if (supervisorPosition) {
            xPosition = supervisorPosition.x + config.nodeWidth + config.nodeSpacing;
          }
        }
      }
      
      // Use saved position if available, otherwise use calculated position
      const savedPosition = savedPositions?.get(nodeId);
      const position = savedPosition || {
        x: xPosition,
        y: level * config.levelHeight,
      };
      
      positions.set(nodeId, position);
    });
  });

  return positions;
};

export const calculateNodePositions = (
  jobs: JobBoardWithCadet[],
  hierarchyNodes: Map<string, HierarchyNode>,
  config: NodePositionConfig = DEFAULT_POSITION_CONFIG,
  savedPositions?: Map<string, { x: number; y: number }>,
  algorithm: LayoutAlgorithm = 'hierarchical'
): Map<string, { x: number; y: number }> => {
  
  // If user has saved positions, prioritize those and use legacy algorithm
  if (savedPositions && savedPositions.size > 0) {
    return calculateLegacyPositions(jobs, hierarchyNodes, config, savedPositions);
  }
  
  // Use intelligent algorithms for new layouts
  if (algorithm === 'legacy') {
    return calculateLegacyPositions(jobs, hierarchyNodes, config, savedPositions);
  }
  
  // Convert to intelligent layout config
  const intelligentConfig: LayoutConfig = {
    nodeWidth: config.nodeWidth,
    nodeHeight: config.nodeHeight,
    levelHeight: config.levelHeight,
    minNodeSpacing: config.nodeSpacing,
    maxNodeSpacing: config.nodeSpacing * 2,
    assistantOffset: 50,
    squadronPadding: 100,
  };
  
  // Create enhanced layout nodes
  const layoutNodes = createLayoutNodes(jobs, hierarchyNodes, intelligentConfig);
  
  // Calculate positions using the selected algorithm
  let layoutResult;
  if (algorithm === 'radial') {
    layoutResult = calculateRadialLayout(layoutNodes, intelligentConfig);
  } else {
    layoutResult = calculateHierarchicalTreeLayout(layoutNodes, intelligentConfig);
  }
  
  // Convert positioned nodes back to position map
  const positions = new Map<string, { x: number; y: number }>();
  layoutResult.positionedNodes.forEach(node => {
    positions.set(node.id, node.finalPosition);
  });
  
  console.log(`✨ Intelligent ${algorithm} layout calculated for ${positions.size} nodes`);
  console.log(`📐 Total dimensions: ${layoutResult.totalWidth}x${layoutResult.totalHeight}`);
  
  return positions;
};
