
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

// Position squadron members in vertical columns
const positionSquadronMembers = (
  squadrons: Map<string, SquadronStructure>,
  layoutNodes: Map<string, LayoutNode>,
  squadronColumns: Map<string, number>,
  config: LayoutConfig,
  startY: number
): { positions: Map<string, { x: number; y: number }>, maxY: number } => {
  const positions = new Map<string, { x: number; y: number }>();
  let globalMaxY = startY;
  
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
    
    // Position each level group
    Array.from(levelGroups.keys()).sort().forEach(level => {
      const levelMembers = levelGroups.get(level) || [];
      
      levelMembers.forEach((member, index) => {
        // For more than 2 members at same level, create sub-columns with better spacing
        const subColumnOffset = levelMembers.length > 2 ? 
          (index % 2) * (config.nodeWidth + config.minNodeSpacing * 0.6) - (config.nodeWidth + config.minNodeSpacing * 0.6) * 0.5 : 0;
        
        positions.set(member.id, { 
          x: columnX + subColumnOffset, 
          y: currentY 
        });
        
        // Move to next row if we have more than 1 at same level
        if (levelMembers.length > 1 && (index + 1) % 2 === 0) {
          currentY += config.levelHeight * 0.8;
        }
      });
      
      // Move to next level with proper spacing
      if (levelMembers.length > 0) {
        currentY += config.levelHeight * 0.9;
      }
    });
    
    globalMaxY = Math.max(globalMaxY, currentY);
  });
  
  return { positions, maxY: globalMaxY };
};

// Position assistants next to their supervisors
const positionAssistants = (
  nodes: PositionedNode[],
  jobs: JobBoardWithCadet[],
  config: LayoutConfig
): PositionedNode[] => {
  const result = [...nodes];
  
  jobs.forEach(job => {
    if (job.assistant && job.assistant !== 'NA') {
      const supervisorJob = jobs.find(j => j.role === job.assistant);
      if (supervisorJob) {
        const supervisorPosition = result.find(n => n.id === supervisorJob.id);
        const assistantIndex = result.findIndex(n => n.id === job.id);
        
        if (supervisorPosition && assistantIndex >= 0) {
          // Position assistant to the right of supervisor
          const assistantX = supervisorPosition.finalPosition.x + config.nodeWidth + config.assistantOffset;
          const assistantY = supervisorPosition.finalPosition.y;
          
          result[assistantIndex] = {
            ...result[assistantIndex],
            x: assistantX,
            y: assistantY,
            finalPosition: { x: assistantX, y: assistantY }
          };
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
    nodeWidth: 300,
    nodeHeight: 120,
    levelHeight: 220,
    minNodeSpacing: 150,
    maxNodeSpacing: 250,
    assistantOffset: 80,
    squadronPadding: 200,
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
