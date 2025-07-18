
import { JobBoardWithCadet } from '../types';
import { HierarchyNode } from './hierarchyBuilder';

export interface LayoutNode {
  id: string;
  job: JobBoardWithCadet;
  level: number;
  children: string[];
  parent?: string;
  isAssistant: boolean;
  squadron?: string;
  width: number;
  height: number;
}

export interface PositionedNode extends LayoutNode {
  x: number;
  y: number;
  finalPosition: { x: number; y: number };
}

export interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  levelHeight: number;
  minNodeSpacing: number;
  maxNodeSpacing: number;
  assistantOffset: number;
  squadronPadding: number;
}

export const DEFAULT_INTELLIGENT_CONFIG: LayoutConfig = {
  nodeWidth: 300,
  nodeHeight: 120,
  levelHeight: 200,
  minNodeSpacing: 80,
  maxNodeSpacing: 150,
  assistantOffset: 50,
  squadronPadding: 100,
};

// Extract squadron/department grouping from role names
export const extractSquadron = (role: string): string => {
  const lowerRole = role.toLowerCase();
  
  // Common squadron patterns
  if (lowerRole.includes('squadron') || lowerRole.includes('sq')) {
    if (lowerRole.includes('maintenance') || lowerRole.includes('mx')) return 'maintenance';
    if (lowerRole.includes('operations') || lowerRole.includes('ops')) return 'operations';
    if (lowerRole.includes('support') || lowerRole.includes('spt')) return 'support';
    if (lowerRole.includes('mission') || lowerRole.includes('msn')) return 'mission';
  }
  
  // Leadership roles
  if (lowerRole.includes('commander') || lowerRole.includes('cc')) return 'command';
  if (lowerRole.includes('chief') || lowerRole.includes('superintendent')) return 'leadership';
  
  // Default grouping
  return 'general';
};

// Create layout nodes with enhanced metadata
export const createLayoutNodes = (
  jobs: JobBoardWithCadet[],
  hierarchyNodes: Map<string, HierarchyNode>,
  config: LayoutConfig = DEFAULT_INTELLIGENT_CONFIG
): Map<string, LayoutNode> => {
  const layoutNodes = new Map<string, LayoutNode>();
  
  jobs.forEach(job => {
    const hierarchyNode = hierarchyNodes.get(job.id);
    if (!hierarchyNode) return;
    
    // Determine if this is an assistant role
    const isAssistant = job.assistant && job.assistant !== 'NA';
    
    // Find parent relationship
    let parent: string | undefined;
    if (job.reports_to && job.reports_to !== 'NA') {
      const parentJob = jobs.find(j => j.role === job.reports_to);
      if (parentJob) parent = parentJob.id;
    }
    
    const layoutNode: LayoutNode = {
      id: job.id,
      job,
      level: hierarchyNode.level,
      children: hierarchyNode.children,
      parent,
      isAssistant,
      squadron: extractSquadron(job.role),
      width: config.nodeWidth,
      height: config.nodeHeight,
    };
    
    layoutNodes.set(job.id, layoutNode);
  });
  
  return layoutNodes;
};

// Group nodes by squadron for better organization
export const groupBySquadron = (nodes: Map<string, LayoutNode>): Map<string, LayoutNode[]> => {
  const squadronGroups = new Map<string, LayoutNode[]>();
  
  nodes.forEach(node => {
    const squadron = node.squadron || 'general';
    if (!squadronGroups.has(squadron)) {
      squadronGroups.set(squadron, []);
    }
    squadronGroups.get(squadron)!.push(node);
  });
  
  return squadronGroups;
};

// Calculate intelligent spacing based on node count and available space
export const calculateAdaptiveSpacing = (
  nodeCount: number,
  availableWidth: number,
  nodeWidth: number,
  config: LayoutConfig
): number => {
  if (nodeCount <= 1) return 0;
  
  const totalNodeWidth = nodeCount * nodeWidth;
  const availableSpacing = availableWidth - totalNodeWidth;
  const spacingBetweenNodes = availableSpacing / (nodeCount - 1);
  
  // Clamp spacing to reasonable bounds
  return Math.max(
    config.minNodeSpacing,
    Math.min(config.maxNodeSpacing, spacingBetweenNodes)
  );
};
