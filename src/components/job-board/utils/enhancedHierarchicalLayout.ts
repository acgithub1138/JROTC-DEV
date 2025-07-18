
import { LayoutNode, PositionedNode, LayoutConfig } from './intelligentLayout';
import { JobBoardWithCadet } from '../types';
import { 
  analyzeRole, 
  buildSquadronStructures, 
  createEnhancedLayoutNodes,
  SquadronStructure 
} from './commandStructureAnalyzer';
import { resolveCollisions } from './collisionDetection';

export interface EnhancedLayoutResult {
  positionedNodes: PositionedNode[];
  totalWidth: number;
  totalHeight: number;
}

// Calculate positions for group-level command (level 0)
const positionGroupCommand = (
  nodes: LayoutNode[],
  config: LayoutConfig,
  startY: number
): { positions: Map<string, { x: number; y: number }>, maxY: number } => {
  const positions = new Map<string, { x: number; y: number }>();
  
  // Find Group Commander and Deputy
  const groupCommander = nodes.find(n => n.job.role.toLowerCase().includes('group commander') && !n.job.role.toLowerCase().includes('deputy'));
  const deputyCommander = nodes.find(n => n.job.role.toLowerCase().includes('deputy group commander'));
  
  const centerX = 0; // Center of the layout
  let currentY = startY;
  
  if (groupCommander) {
    positions.set(groupCommander.id, { x: centerX, y: currentY });
  }
  
  if (deputyCommander) {
    // Position deputy to the right of group commander
    positions.set(deputyCommander.id, { 
      x: centerX + config.nodeWidth + config.minNodeSpacing, 
      y: currentY 
    });
  }
  
  return { positions, maxY: currentY + config.nodeHeight };
};

// Calculate positions for group staff (level 1)
const positionGroupStaff = (
  nodes: LayoutNode[],
  config: LayoutConfig,
  startY: number
): { positions: Map<string, { x: number; y: number }>, maxY: number } => {
  const positions = new Map<string, { x: number; y: number }>();
  
  if (nodes.length === 0) return { positions, maxY: startY };
  
  const totalWidth = nodes.length * config.nodeWidth + (nodes.length - 1) * config.minNodeSpacing;
  const startX = -totalWidth / 2;
  
  nodes.forEach((node, index) => {
    const x = startX + index * (config.nodeWidth + config.minNodeSpacing);
    positions.set(node.id, { x, y: startY });
  });
  
  return { positions, maxY: startY + config.nodeHeight };
};

// Calculate positions for squadron commanders (level 2)
const positionSquadronCommanders = (
  squadrons: Map<string, SquadronStructure>,
  layoutNodes: Map<string, LayoutNode>,
  config: LayoutConfig,
  startY: number
): { positions: Map<string, { x: number; y: number }>, maxY: number, squadronColumns: Map<string, number> } => {
  const positions = new Map<string, { x: number; y: number }>();
  const squadronColumns = new Map<string, number>();
  
  if (squadrons.size === 0) return { positions, maxY: startY, squadronColumns };
  
  const squadronArray = Array.from(squadrons.values());
  const totalSquadrons = squadronArray.length;
  const squadronSpacing = config.nodeWidth * 2.5; // Much more space between squadrons
  const totalWidth = totalSquadrons * config.nodeWidth + (totalSquadrons - 1) * squadronSpacing;
  const startX = -totalWidth / 2;
  
  squadronArray.forEach((squadron, index) => {
    const x = startX + index * (config.nodeWidth + squadronSpacing);
    squadronColumns.set(squadron.name, x);
    
    if (squadron.commander) {
      positions.set(squadron.commander, { x, y: startY });
    }
  });
  
  return { positions, maxY: startY + config.nodeHeight, squadronColumns };
};

// Grid-based positioning system to prevent overlaps
interface PositionGrid {
  occupiedAreas: Set<string>;
  getGridKey: (x: number, y: number) => string;
  isAreaFree: (x: number, y: number, width: number, height: number) => boolean;
  markArea: (x: number, y: number, width: number, height: number) => void;
}

const createPositionGrid = (cellSize: number = 20): PositionGrid => {
  const occupiedAreas = new Set<string>();
  
  const getGridKey = (x: number, y: number) => `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
  
  const isAreaFree = (x: number, y: number, width: number, height: number) => {
    const startGridX = Math.floor(x / cellSize);
    const endGridX = Math.floor((x + width) / cellSize);
    const startGridY = Math.floor(y / cellSize);
    const endGridY = Math.floor((y + height) / cellSize);
    
    for (let gx = startGridX; gx <= endGridX; gx++) {
      for (let gy = startGridY; gy <= endGridY; gy++) {
        if (occupiedAreas.has(`${gx},${gy}`)) {
          return false;
        }
      }
    }
    return true;
  };
  
  const markArea = (x: number, y: number, width: number, height: number) => {
    const startGridX = Math.floor(x / cellSize);
    const endGridX = Math.floor((x + width) / cellSize);
    const startGridY = Math.floor(y / cellSize);
    const endGridY = Math.floor((y + height) / cellSize);
    
    for (let gx = startGridX; gx <= endGridX; gx++) {
      for (let gy = startGridY; gy <= endGridY; gy++) {
        occupiedAreas.add(`${gx},${gy}`);
      }
    }
  };
  
  return { occupiedAreas, getGridKey, isAreaFree, markArea };
};

const findFreePosition = (
  preferredX: number, 
  preferredY: number, 
  width: number, 
  height: number, 
  grid: PositionGrid,
  maxSearchRadius: number = 300
): { x: number; y: number } => {
  // Try preferred position first
  if (grid.isAreaFree(preferredX, preferredY, width, height)) {
    return { x: preferredX, y: preferredY };
  }
  
  // Search in expanding spirals with preference for vertical movement
  for (let radius = 60; radius <= maxSearchRadius; radius += 60) {
    // Try vertical offsets first (maintains squadron organization)
    const verticalOffsets = [radius, -radius];
    for (const offsetY of verticalOffsets) {
      const y = preferredY + offsetY;
      if (grid.isAreaFree(preferredX, y, width, height)) {
        return { x: preferredX, y };
      }
    }
    
    // Then try horizontal offsets (within squadron column)
    const horizontalOffsets = [-radius * 0.5, radius * 0.5];
    for (const offsetX of horizontalOffsets) {
      const x = preferredX + offsetX;
      if (grid.isAreaFree(x, preferredY, width, height)) {
        return { x, y: preferredY };
      }
    }
  }
  
  // Fallback: place below existing content
  return { x: preferredX, y: preferredY + maxSearchRadius };
};

// Position squadron members in collision-free vertical columns
const positionSquadronMembers = (
  squadrons: Map<string, SquadronStructure>,
  layoutNodes: Map<string, LayoutNode>,
  squadronColumns: Map<string, number>,
  config: LayoutConfig,
  startY: number
): { positions: Map<string, { x: number; y: number }>, maxY: number } => {
  const positions = new Map<string, { x: number; y: number }>();
  const grid = createPositionGrid(20); // Smaller grid cells for better collision detection
  let globalMaxY = startY;
  
  console.log(`📍 Positioning squadron members starting at Y: ${startY}`);

  // Enhanced spacing configuration
  const nodeBuffer = 60; // Extra space around each node
  const levelSpacing = config.levelHeight + 40; // Extra vertical space between levels
  const memberSpacing = config.nodeHeight + nodeBuffer; // Space between members
  
  squadrons.forEach((squadron, squadronName) => {
    const columnX = squadronColumns.get(squadronName) || 0;
    let currentY = startY;
    
    // Get all squadron members except the commander
    const members = squadron.members
      .map(id => layoutNodes.get(id))
      .filter(node => node && node.id !== squadron.commander)
      .sort((a, b) => (a?.level || 0) - (b?.level || 0));
    
    // Group members by level for better organization
    const levelGroups = new Map<number, LayoutNode[]>();
    members.forEach(member => {
      if (member) {
        const level = member.level;
        if (!levelGroups.has(level)) levelGroups.set(level, []);
        levelGroups.get(level)!.push(member);
      }
    });
    
    // Position each level group with collision prevention
    Array.from(levelGroups.keys()).sort().forEach((level, levelIndex) => {
      const levelMembers = levelGroups.get(level) || [];
      let levelStartY = currentY;
      
      levelMembers.forEach((member, memberIndex) => {
        // Calculate preferred position
        let preferredX = columnX;
        let preferredY = levelStartY;
        
        // For multiple members at same level, arrange in a single column with proper spacing
        if (levelMembers.length > 1) {
          preferredY = levelStartY + memberIndex * memberSpacing;
        }
        
        // Find collision-free position
        const finalPosition = findFreePosition(
          preferredX, 
          preferredY, 
          config.nodeWidth, 
          config.nodeHeight, 
          grid
        );
        
        positions.set(member.id, finalPosition);
        grid.markArea(finalPosition.x, finalPosition.y, config.nodeWidth, config.nodeHeight);
        
        globalMaxY = Math.max(globalMaxY, finalPosition.y + config.nodeHeight);
      });
      
      // Calculate space needed for this level
      const levelHeight = levelMembers.length * memberSpacing;
      currentY = Math.max(currentY + levelHeight + levelSpacing, currentY + levelSpacing);
    });
  });
  
  return { positions, maxY: globalMaxY };
};

// Position assistants with collision detection
const positionAssistants = (
  nodes: PositionedNode[],
  jobs: JobBoardWithCadet[],
  config: LayoutConfig
): PositionedNode[] => {
  const result = [...nodes];
  const grid = createPositionGrid(20); // Use consistent smaller grid cells
  
  console.log(`👥 Positioning assistants for ${jobs.filter(j => j.assistant && j.assistant !== 'NA').length} assistant roles`);
  
  // Mark existing nodes in grid
  result.forEach(node => {
    grid.markArea(node.finalPosition.x, node.finalPosition.y, config.nodeWidth, config.nodeHeight);
  });
  
  jobs.forEach(job => {
    if (job.assistant && job.assistant !== 'NA') {
      const supervisorJob = jobs.find(j => j.role === job.assistant);
      if (supervisorJob) {
        const supervisorPosition = result.find(n => n.id === supervisorJob.id);
        const assistantIndex = result.findIndex(n => n.id === job.id);
        
        if (supervisorPosition && assistantIndex >= 0) {
          // Try multiple positions for assistant
          const assistantPositions = [
            // Right of supervisor (preferred)
            { 
              x: supervisorPosition.finalPosition.x + config.nodeWidth + config.assistantOffset, 
              y: supervisorPosition.finalPosition.y 
            },
            // Left of supervisor
            { 
              x: supervisorPosition.finalPosition.x - config.nodeWidth - config.assistantOffset, 
              y: supervisorPosition.finalPosition.y 
            },
            // Below supervisor
            { 
              x: supervisorPosition.finalPosition.x, 
              y: supervisorPosition.finalPosition.y + config.nodeHeight + 60 
            }
          ];
          
          // Find first available position
          let finalPosition = assistantPositions[0]; // fallback
          for (const pos of assistantPositions) {
            if (grid.isAreaFree(pos.x, pos.y, config.nodeWidth, config.nodeHeight)) {
              finalPosition = pos;
              break;
            }
          }
          
          // If none available, use collision-free search
          if (!grid.isAreaFree(finalPosition.x, finalPosition.y, config.nodeWidth, config.nodeHeight)) {
            finalPosition = findFreePosition(
              assistantPositions[0].x, 
              assistantPositions[0].y, 
              config.nodeWidth, 
              config.nodeHeight, 
              grid
            );
          }
          
          result[assistantIndex] = {
            ...result[assistantIndex],
            x: finalPosition.x,
            y: finalPosition.y,
            finalPosition
          };
          
          // Mark assistant position in grid
          grid.markArea(finalPosition.x, finalPosition.y, config.nodeWidth, config.nodeHeight);
        }
      }
    }
  });
  
  return result;
};

// Main enhanced hierarchical layout function
export const calculateEnhancedHierarchicalLayout = (
  jobs: JobBoardWithCadet[],
  config: LayoutConfig = {
    nodeWidth: 280,     // Updated to match JobRoleNode component
    nodeHeight: 140,    // Updated to match actual rendered height
    levelHeight: 300,   // Increased for more vertical space
    minNodeSpacing: 200, // Increased horizontal spacing
    maxNodeSpacing: 350,
    assistantOffset: 120, // More space for assistants
    squadronPadding: 250, // More squadron separation
  }
): EnhancedLayoutResult => {
  if (jobs.length === 0) {
    return { positionedNodes: [], totalWidth: 0, totalHeight: 0 };
  }
  
  console.log('🎯 Starting enhanced hierarchical layout calculation');
  
  // Build command structure
  const squadronStructures = buildSquadronStructures(jobs);
  const layoutNodes = createEnhancedLayoutNodes(jobs, squadronStructures);
  
  // Group nodes by level
  const levelGroups = new Map<number, LayoutNode[]>();
  layoutNodes.forEach(node => {
    if (!levelGroups.has(node.level)) levelGroups.set(node.level, []);
    levelGroups.get(node.level)!.push(node);
  });
  
  const allPositions = new Map<string, { x: number; y: number }>();
  let currentY = 0;
  let maxWidth = 0;
  let squadronColumns = new Map<string, number>();
  
  // Level 0: Group Command
  const level0Nodes = levelGroups.get(0) || [];
  if (level0Nodes.length > 0) {
    const { positions, maxY } = positionGroupCommand(level0Nodes, config, currentY);
    positions.forEach((pos, id) => allPositions.set(id, pos));
    currentY = maxY + config.levelHeight;
    maxWidth = Math.max(maxWidth, config.nodeWidth * 2 + config.minNodeSpacing);
  }
  
  // Level 1: Group Staff
  const level1Nodes = levelGroups.get(1) || [];
  if (level1Nodes.length > 0) {
    const { positions, maxY } = positionGroupStaff(level1Nodes, config, currentY);
    positions.forEach((pos, id) => allPositions.set(id, pos));
    currentY = maxY + config.levelHeight;
    maxWidth = Math.max(maxWidth, level1Nodes.length * (config.nodeWidth + config.minNodeSpacing));
  }
  
  // Level 2: Squadron Commanders
  const { positions: squadronPos, maxY: squadronMaxY, squadronColumns: columns } = 
    positionSquadronCommanders(squadronStructures, layoutNodes, config, currentY);
  squadronPos.forEach((pos, id) => allPositions.set(id, pos));
  squadronColumns = columns;
  currentY = squadronMaxY + config.levelHeight;
  maxWidth = Math.max(maxWidth, squadronStructures.size * (config.nodeWidth + config.nodeWidth * 2));
  
  // Levels 3+: Squadron Members
  const { positions: memberPos, maxY: memberMaxY } = 
    positionSquadronMembers(squadronStructures, layoutNodes, squadronColumns, config, currentY);
  memberPos.forEach((pos, id) => allPositions.set(id, pos));
  currentY = memberMaxY;
  
  // Create positioned nodes
  let positionedNodes: PositionedNode[] = Array.from(layoutNodes.values()).map(node => {
    const position = allPositions.get(node.id) || { x: 0, y: 0 };
    return {
      ...node,
      x: position.x,
      y: position.y,
      finalPosition: position,
    };
  });
  
  // Position assistants
  positionedNodes = positionAssistants(positionedNodes, jobs, config);
  
  // Resolve any remaining collisions
  positionedNodes = resolveCollisions(positionedNodes, config);
  
  console.log(`✨ Enhanced hierarchical layout completed: ${positionedNodes.length} nodes positioned`);
  
  return {
    positionedNodes,
    totalWidth: maxWidth + 200, // Add padding
    totalHeight: currentY + 100, // Add bottom padding
  };
};
