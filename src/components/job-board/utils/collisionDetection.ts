
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

// Check if two rectangles overlap with minimum spacing (updated for better collision detection)
export const rectanglesOverlap = (rect1: Rectangle, rect2: Rectangle, minSpacing: number = 200): boolean => {
  const overlaps = !(
    rect1.x + rect1.width + minSpacing <= rect2.x ||
    rect2.x + rect2.width + minSpacing <= rect1.x ||
    rect1.y + rect1.height + minSpacing <= rect2.y ||
    rect2.y + rect2.height + minSpacing <= rect1.y
  );
  
  // Add logging for debugging collision detection
  if (overlaps) {
    console.log(`🔍 Collision detected between nodes:`, {
      rect1: { x: rect1.x, y: rect1.y, w: rect1.width, h: rect1.height },
      rect2: { x: rect2.x, y: rect2.y, w: rect2.width, h: rect2.height },
      minSpacing
    });
  }
  
  return overlaps;
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
      // Separate horizontally with proper spacing
      const distance = Math.max(node1.width, node2.width) + 200; // Match layout minNodeSpacing
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
      // Separate vertically with proper spacing
      const distance = Math.max(node1.height, node2.height) + 150; // Better vertical spacing
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

// Resolve collisions using force-based positioning with enhanced logging
export const resolveCollisions = (
  nodes: PositionedNode[],
  config: LayoutConfig,
  maxIterations: number = 15  // Increased for complex layouts
): PositionedNode[] => {
  let currentNodes = [...nodes];
  let iteration = 0;
  
  console.log(`🔧 Starting collision resolution for ${nodes.length} nodes`);
  
  while (iteration < maxIterations) {
    const collisionResult = detectCollisions(currentNodes);
    
    if (!collisionResult.hasCollision) {
      console.log(`✅ Collision resolution completed after ${iteration} iterations`);
      break; // No more collisions
    }
    
    console.log(`⚠️ Iteration ${iteration + 1}: Found ${collisionResult.collidingNodes.length} colliding nodes`);
    
    // Apply suggested positions with better separation
    currentNodes = currentNodes.map(node => {
      const suggestedPosition = collisionResult.suggestedPositions.get(node.id);
      if (suggestedPosition) {
        console.log(`📍 Moving node ${node.id} to position (${suggestedPosition.x}, ${suggestedPosition.y})`);
        return {
          ...node,
          finalPosition: suggestedPosition,
        };
      }
      return node;
    });
    
    iteration++;
  }
  
  if (iteration >= maxIterations) {
    console.warn(`⚠️ Collision resolution reached maximum iterations (${maxIterations})`);
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
