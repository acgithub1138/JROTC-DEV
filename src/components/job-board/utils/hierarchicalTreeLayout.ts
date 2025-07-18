import { LayoutNode, PositionedNode, LayoutConfig, groupBySquadron } from './intelligentLayout';
import { JobBoardWithCadet } from '../types';
import { resolveCollisions } from './collisionDetection';
import { calculateEnhancedHierarchicalLayout } from './enhancedHierarchicalLayout';

export interface TreeLayoutResult {
  positionedNodes: PositionedNode[];
  totalWidth: number;
  totalHeight: number;
}

// Calculate the width needed for a subtree with vertical stacking support
const calculateSubtreeWidth = (
  nodeId: string,
  nodes: Map<string, LayoutNode>,
  config: LayoutConfig,
  memo: Map<string, number> = new Map()
): number => {
  if (memo.has(nodeId)) return memo.get(nodeId)!;
  
  const node = nodes.get(nodeId);
  if (!node || node.children.length === 0) {
    memo.set(nodeId, config.nodeWidth);
    return config.nodeWidth;
  }
  
  const maxHorizontalChildren = 4;
  
  if (node.children.length <= maxHorizontalChildren) {
    // Calculate total width of all children horizontally
    let childrenWidth = 0;
    node.children.forEach((childId, index) => {
      const childWidth = calculateSubtreeWidth(childId, nodes, config, memo);
      childrenWidth += childWidth;
      if (index < node.children.length - 1) {
        childrenWidth += config.minNodeSpacing;
      }
    });
    
    // The subtree width is the maximum of node width and children width
    const subtreeWidth = Math.max(config.nodeWidth, childrenWidth);
    memo.set(nodeId, subtreeWidth);
    return subtreeWidth;
  } else {
    // For vertical stacking, calculate the maximum width of any row
    const childrenPerRow = maxHorizontalChildren;
    const rows = Math.ceil(node.children.length / childrenPerRow);
    let maxRowWidth = config.nodeWidth; // At least as wide as the parent
    
    for (let row = 0; row < rows; row++) {
      const rowStartIndex = row * childrenPerRow;
      const rowEndIndex = Math.min(rowStartIndex + childrenPerRow, node.children.length);
      const rowChildren = node.children.slice(rowStartIndex, rowEndIndex);
      
      let rowWidth = 0;
      rowChildren.forEach((childId, index) => {
        const childWidth = calculateSubtreeWidth(childId, nodes, config, memo);
        rowWidth += childWidth;
        if (index < rowChildren.length - 1) {
          rowWidth += config.minNodeSpacing;
        }
      });
      
      maxRowWidth = Math.max(maxRowWidth, rowWidth);
    }
    
    memo.set(nodeId, maxRowWidth);
    return maxRowWidth;
  }
};

// Position nodes in a hierarchical tree layout with vertical stacking for many children
const positionSubtree = (
  nodeId: string,
  nodes: Map<string, LayoutNode>,
  config: LayoutConfig,
  startX: number,
  level: number,
  subtreeWidths: Map<string, number>
): PositionedNode[] => {
  const node = nodes.get(nodeId);
  if (!node) return [];
  
  const subtreeWidth = subtreeWidths.get(nodeId) || config.nodeWidth;
  const nodeX = startX + (subtreeWidth - config.nodeWidth) / 2;
  const nodeY = level * config.levelHeight;
  
  const positionedNode: PositionedNode = {
    ...node,
    x: nodeX,
    y: nodeY,
    finalPosition: { x: nodeX, y: nodeY },
  };
  
  const result: PositionedNode[] = [positionedNode];
  
  // Position children
  if (node.children.length > 0) {
    const maxHorizontalChildren = 4; // Maximum children in horizontal row
    
    if (node.children.length <= maxHorizontalChildren) {
      // Position children horizontally
      let childX = startX;
      
      node.children.forEach(childId => {
        const childSubtreeWidth = subtreeWidths.get(childId) || config.nodeWidth;
        const childPositions = positionSubtree(
          childId,
          nodes,
          config,
          childX,
          level + 1,
          subtreeWidths
        );
        
        result.push(...childPositions);
        childX += childSubtreeWidth + config.minNodeSpacing;
      });
    } else {
      // Position children vertically in groups
      const childrenPerRow = maxHorizontalChildren;
      const rows = Math.ceil(node.children.length / childrenPerRow);
      
      for (let row = 0; row < rows; row++) {
        const rowStartIndex = row * childrenPerRow;
        const rowEndIndex = Math.min(rowStartIndex + childrenPerRow, node.children.length);
        const rowChildren = node.children.slice(rowStartIndex, rowEndIndex);
        
        // Calculate total width needed for this row
        let rowWidth = 0;
        rowChildren.forEach((childId, index) => {
          const childSubtreeWidth = subtreeWidths.get(childId) || config.nodeWidth;
          rowWidth += childSubtreeWidth;
          if (index < rowChildren.length - 1) {
            rowWidth += config.minNodeSpacing;
          }
        });
        
        // Center the row under the parent
        const rowStartX = nodeX + (config.nodeWidth - rowWidth) / 2;
        let childX = rowStartX;
        
        rowChildren.forEach(childId => {
          const childSubtreeWidth = subtreeWidths.get(childId) || config.nodeWidth;
          const childPositions = positionSubtree(
            childId,
            nodes,
            config,
            childX,
            level + 1 + row, // Each row gets its own level
            subtreeWidths
          );
          
          result.push(...childPositions);
          childX += childSubtreeWidth + config.minNodeSpacing;
        });
      }
    }
  }
  
  return result;
};

// Position assistant nodes adjacent to their supervisors
const positionAssistants = (
  nodes: PositionedNode[],
  layoutNodes: Map<string, LayoutNode>,
  config: LayoutConfig
): PositionedNode[] => {
  const result = [...nodes];
  const assistantNodes = Array.from(layoutNodes.values()).filter(node => node.isAssistant);
  
  assistantNodes.forEach(assistantNode => {
    // Find the supervisor this person assists
    const supervisorJob = Array.from(layoutNodes.values()).find(
      node => node.job.role === assistantNode.job.assistant
    );
    
    if (supervisorJob) {
      const supervisorPosition = result.find(n => n.id === supervisorJob.id);
      if (supervisorPosition) {
        // Position assistant to the right of supervisor
        const assistantX = supervisorPosition.finalPosition.x + config.nodeWidth + config.assistantOffset;
        const assistantY = supervisorPosition.finalPosition.y;
        
        // Update or add assistant position
        const existingIndex = result.findIndex(n => n.id === assistantNode.id);
        const assistantPositioned: PositionedNode = {
          ...assistantNode,
          x: assistantX,
          y: assistantY,
          finalPosition: { x: assistantX, y: assistantY },
        };
        
        if (existingIndex >= 0) {
          result[existingIndex] = assistantPositioned;
        } else {
          result.push(assistantPositioned);
        }
      }
    }
  });
  
  return result;
};

// Main hierarchical tree layout function - now enhanced
export const calculateHierarchicalTreeLayout = (
  nodes: Map<string, LayoutNode>,
  config: LayoutConfig = {
    nodeWidth: 300,
    nodeHeight: 120,
    levelHeight: 200,
    minNodeSpacing: 80,
    maxNodeSpacing: 150,
    assistantOffset: 50,
    squadronPadding: 100,
  }
): TreeLayoutResult => {
  // Extract jobs from layout nodes for enhanced algorithm
  const jobs: JobBoardWithCadet[] = Array.from(nodes.values()).map(node => node.job);
  
  // Use the enhanced hierarchical layout algorithm
  const enhancedResult = calculateEnhancedHierarchicalLayout(jobs, config);
  
  console.log('🚀 Using enhanced hierarchical layout algorithm');
  
  return {
    positionedNodes: enhancedResult.positionedNodes,
    totalWidth: enhancedResult.totalWidth,
    totalHeight: enhancedResult.totalHeight,
  };
};

// Alternative radial layout for smaller hierarchies
export const calculateRadialLayout = (
  nodes: Map<string, LayoutNode>,
  config: LayoutConfig
): TreeLayoutResult => {
  const positionedNodes: PositionedNode[] = [];
  const rootNodes = Array.from(nodes.values()).filter(node => !node.parent && !node.isAssistant);
  
  if (rootNodes.length === 0) {
    return { positionedNodes: [], totalWidth: 0, totalHeight: 0 };
  }
  
  // Place root at center
  const centerX = 400;
  const centerY = 300;
  const radius = 200;
  
  rootNodes.forEach((rootNode, index) => {
    const angle = (index * 2 * Math.PI) / rootNodes.length;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    
    positionedNodes.push({
      ...rootNode,
      x,
      y,
      finalPosition: { x, y },
    });
    
    // Position children in a circle around parent
    const childRadius = 150;
    rootNode.children.forEach((childId, childIndex) => {
      const childNode = nodes.get(childId);
      if (childNode) {
        const childAngle = angle + (childIndex - rootNode.children.length / 2) * (Math.PI / 4);
        const childX = x + Math.cos(childAngle) * childRadius;
        const childY = y + Math.sin(childAngle) * childRadius;
        
        positionedNodes.push({
          ...childNode,
          x: childX,
          y: childY,
          finalPosition: { x: childX, y: childY },
        });
      }
    });
  });
  
  return {
    positionedNodes,
    totalWidth: 800,
    totalHeight: 600,
  };
};
