
import { PositionedNode, LayoutConfig } from './intelligentLayout';

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CollisionResult {
  hasCollision: boolean;
  collidingNodes: string[];
  suggestedPositions: Map<string, { x: number; y: number }>;
}

// Check if two rectangles overlap with minimum spacing
export const rectanglesOverlap = (rect1: Rectangle, rect2: Rectangle, minSpacing: number = 20): boolean => {
  return !(
    rect1.x + rect1.width + minSpacing <= rect2.x ||
    rect2.x + rect2.width + minSpacing <= rect1.x ||
    rect1.y + rect1.height + minSpacing <= rect2.y ||
    rect2.y + rect2.height + minSpacing <= rect1.y
  );
};

// Convert positioned node to rectangle
export const nodeToRectangle = (node: PositionedNode): Rectangle => ({
  x: node.finalPosition.x,
  y: node.finalPosition.y,
  width: node.width,
  height: node.height,
});

// Detect collisions between all nodes
export const detectCollisions = (nodes: PositionedNode[]): CollisionResult => {
  const collidingNodes = new Set<string>();
  const collisionPairs: Array<[PositionedNode, PositionedNode]> = [];
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const node1 = nodes[i];
      const node2 = nodes[j];
      
      const rect1 = nodeToRectangle(node1);
      const rect2 = nodeToRectangle(node2);
      
      if (rectanglesOverlap(rect1, rect2)) {
        collidingNodes.add(node1.id);
        collidingNodes.add(node2.id);
        collisionPairs.push([node1, node2]);
      }
    }
  }
  
  const suggestedPositions = new Map<string, { x: number; y: number }>();
  
  // Generate suggested positions for colliding nodes
  collisionPairs.forEach(([node1, node2]) => {
    const rect1 = nodeToRectangle(node1);
    const rect2 = nodeToRectangle(node2);
    
    // Determine if we should separate horizontally or vertically
    const overlapX = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x);
    const overlapY = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y);
    
    if (overlapX < overlapY) {
      // Separate horizontally
      const distance = Math.max(node1.width, node2.width) + 60; // 60px padding
      const midX = (node1.finalPosition.x + node2.finalPosition.x) / 2;
      
      suggestedPositions.set(node1.id, {
        x: midX - distance / 2,
        y: node1.finalPosition.y,
      });
      
      suggestedPositions.set(node2.id, {
        x: midX + distance / 2,
        y: node2.finalPosition.y,
      });
    } else {
      // Separate vertically
      const distance = Math.max(node1.height, node2.height) + 40; // 40px padding
      const midY = (node1.finalPosition.y + node2.finalPosition.y) / 2;
      
      suggestedPositions.set(node1.id, {
        x: node1.finalPosition.x,
        y: midY - distance / 2,
      });
      
      suggestedPositions.set(node2.id, {
        x: node2.finalPosition.x,
        y: midY + distance / 2,
      });
    }
  });
  
  return {
    hasCollision: collidingNodes.size > 0,
    collidingNodes: Array.from(collidingNodes),
    suggestedPositions,
  };
};

// Resolve collisions using force-based positioning
export const resolveCollisions = (
  nodes: PositionedNode[],
  config: LayoutConfig,
  maxIterations: number = 10
): PositionedNode[] => {
  let currentNodes = [...nodes];
  let iteration = 0;
  
  while (iteration < maxIterations) {
    const collisionResult = detectCollisions(currentNodes);
    
    if (!collisionResult.hasCollision) {
      break; // No more collisions
    }
    
    // Apply suggested positions
    currentNodes = currentNodes.map(node => {
      const suggestedPosition = collisionResult.suggestedPositions.get(node.id);
      if (suggestedPosition) {
        return {
          ...node,
          finalPosition: suggestedPosition,
        };
      }
      return node;
    });
    
    iteration++;
  }
  
  return currentNodes;
};

// Check if a position would cause collisions
export const wouldCauseCollision = (
  newPosition: { x: number; y: number },
  nodeSize: { width: number; height: number },
  existingNodes: PositionedNode[],
  excludeNodeId?: string
): boolean => {
  const newRect: Rectangle = {
    x: newPosition.x,
    y: newPosition.y,
    width: nodeSize.width,
    height: nodeSize.height,
  };
  
  return existingNodes.some(node => {
    if (excludeNodeId && node.id === excludeNodeId) return false;
    
    const existingRect = nodeToRectangle(node);
    return rectanglesOverlap(newRect, existingRect);
  });
};
