
import { LayoutNode, PositionedNode, LayoutConfig, groupBySquadron } from './intelligentLayout';
import { resolveCollisions } from './collisionDetection';

export interface TreeLayoutResult {
  positionedNodes: PositionedNode[];
  totalWidth: number;
  totalHeight: number;
}

// Calculate the width needed for a subtree
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
  
  // Calculate total width of all children
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
};

// Position nodes in a hierarchical tree layout
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

// Main hierarchical tree layout function
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
  // Find root nodes (no parent)
  const rootNodes = Array.from(nodes.values()).filter(node => !node.parent && !node.isAssistant);
  
  if (rootNodes.length === 0) {
    return { positionedNodes: [], totalWidth: 0, totalHeight: 0 };
  }
  
  // Calculate subtree widths for all nodes
  const subtreeWidths = new Map<string, number>();
  nodes.forEach((_, nodeId) => {
    calculateSubtreeWidth(nodeId, nodes, config, subtreeWidths);
  });
  
  // Position each root tree
  let allPositionedNodes: PositionedNode[] = [];
  let currentX = 0;
  let maxHeight = 0;
  
  rootNodes.forEach((rootNode, index) => {
    const subtreeWidth = subtreeWidths.get(rootNode.id) || config.nodeWidth;
    
    // Position this root tree
    const treeNodes = positionSubtree(rootNode.id, nodes, config, currentX, 0, subtreeWidths);
    allPositionedNodes.push(...treeNodes);
    
    // Calculate the height of this tree
    const treeHeight = Math.max(...treeNodes.map(n => n.finalPosition.y + config.nodeHeight));
    maxHeight = Math.max(maxHeight, treeHeight);
    
    // Move to next root tree position
    currentX += subtreeWidth;
    if (index < rootNodes.length - 1) {
      currentX += config.squadronPadding;
    }
  });
  
  // Position assistants
  allPositionedNodes = positionAssistants(allPositionedNodes, nodes, config);
  
  // Resolve collisions
  allPositionedNodes = resolveCollisions(allPositionedNodes, config);
  
  // Calculate total dimensions
  const totalWidth = Math.max(...allPositionedNodes.map(n => n.finalPosition.x + config.nodeWidth));
  const totalHeight = maxHeight;
  
  return {
    positionedNodes: allPositionedNodes,
    totalWidth,
    totalHeight,
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
