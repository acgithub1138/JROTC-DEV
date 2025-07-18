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

// Check if two rectangles overlap with balanced minimum spacing
export const rectanglesOverlap = (rect1: Rectangle, rect2: Rectangle, minSpacing: number = 100): boolean => {
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
      minSpacing,
      separation: {
        horizontal: Math.min(Math.abs(rect1.x + rect1.width - rect2.x), Math.abs(rect2.x + rect2.width - rect1.x)),
        vertical: Math.min(Math.abs(rect1.y + rect1.height - rect2.y), Math.abs(rect2.y + rect2.height - rect1.y))
      }
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

// Detect collisions between all nodes with improved logging
export const detectCollisions = (nodes: PositionedNode[]): CollisionResult => {
  const collidingNodes = new Set<string>();
  const collisionPairs: Array<[PositionedNode, PositionedNode]> = [];
  
  console.log(`🔍 Checking collisions for ${nodes.length} nodes`);
  
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
  
  console.log(`⚠️ Found ${collisionPairs.length} collision pairs affecting ${collidingNodes.size} nodes`);
  
  const suggestedPositions = new Map<string, { x: number; y: number }>();
  
  // Generate suggested positions for colliding nodes with improved separation
  collisionPairs.forEach(([node1, node2]) => {
    const rect1 = nodeToRectangle(node1);
    const rect2 = nodeToRectangle(node2);
    
    // Determine if we should separate horizontally or vertically
    const overlapX = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x);
    const overlapY = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y);
    
    if (overlapX < overlapY) {
      // Separate horizontally with balanced spacing
      const distance = Math.max(node1.width, node2.width) + 120; // Balanced horizontal separation
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
      // Separate vertically with balanced spacing
      const distance = Math.max(node1.height, node2.height) + 80; // Balanced vertical separation
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

// Resolve collisions using improved force-based positioning with fallback strategy
export const resolveCollisions = (
  nodes: PositionedNode[],
  config: LayoutConfig,
  maxIterations: number = 8  // Reduced iterations to prevent over-correction
): PositionedNode[] => {
  let currentNodes = [...nodes];
  let iteration = 0;
  let previousCollisionCount = Infinity;
  let originalNodes = [...nodes]; // Keep original positions as fallback
  
  console.log(`🔧 Starting collision resolution for ${nodes.length} nodes`);
  
  while (iteration < maxIterations) {
    const collisionResult = detectCollisions(currentNodes);
    
    if (!collisionResult.hasCollision) {
      console.log(`✅ Collision resolution completed after ${iteration} iterations`);
      break; // No more collisions
    }
    
    const currentCollisionCount = collisionResult.collidingNodes.length;
    console.log(`⚠️ Iteration ${iteration + 1}: Found ${currentCollisionCount} colliding nodes`);
    
    // If we're not making progress or making things worse, revert to original positions
    if (iteration > 2 && currentCollisionCount >= previousCollisionCount) {
      console.warn(`🔄 Collision resolution not improving, reverting to original positions`);
      return originalNodes;
    }
    
    // Apply suggested positions with improved separation
    currentNodes = currentNodes.map(node => {
      const suggestedPosition = collisionResult.suggestedPositions.get(node.id);
      if (suggestedPosition) {
        console.log(`📍 Moving node ${node.id} from (${node.finalPosition.x}, ${node.finalPosition.y}) to (${suggestedPosition.x}, ${suggestedPosition.y})`);
        return {
          ...node,
          finalPosition: suggestedPosition,
        };
      }
      return node;
    });
    
    previousCollisionCount = currentCollisionCount;
    iteration++;
  }
  
  if (iteration >= maxIterations) {
    console.warn(`⚠️ Collision resolution reached maximum iterations (${maxIterations}), checking final result`);
    const finalCollisionResult = detectCollisions(currentNodes);
    const originalCollisionResult = detectCollisions(originalNodes);
    if (finalCollisionResult.hasCollision && finalCollisionResult.collidingNodes.length > originalCollisionResult.collidingNodes.length) {
      console.warn(`🔄 Final result has more collisions, reverting to original positions`);
      return originalNodes;
    }
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
