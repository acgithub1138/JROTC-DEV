
import { JobBoardWithCadet } from '../types';

export interface HierarchyNode {
  id: string;
  level: number;
  children: string[];
}

export interface HierarchyEdge {
  id: string;
  source: string;
  target: string;
  type: 'reports_to' | 'assistant';
}

export interface HierarchyResult {
  nodes: Map<string, HierarchyNode>;
  rootNodes: string[];
  edges: HierarchyEdge[];
}

export const buildJobHierarchy = (jobs: JobBoardWithCadet[]): HierarchyResult => {
  console.log('Building hierarchy with jobs count:', jobs.length);
  
  const hierarchyNodes = new Map<string, HierarchyNode>();
  const edges: HierarchyEdge[] = [];
  const visitedNodes = new Set<string>(); // Track visited nodes to prevent cycles
  
  // Initialize hierarchy nodes
  jobs.forEach((job) => {
    hierarchyNodes.set(job.id, {
      id: job.id,
      level: 0,
      children: [],
    });
  });

  // Find root nodes (no reports_to or reports_to is 'NA')
  const rootNodes: string[] = [];
  jobs.forEach((job) => {
    if (!job.reports_to || job.reports_to === 'NA') {
      rootNodes.push(job.id);
      const node = hierarchyNodes.get(job.id);
      if (node) {
        node.level = 0;
      }
    }
  });

  console.log('Root nodes count:', rootNodes.length);

  // Build hierarchy levels and relationships with cycle detection
  const buildHierarchy = (nodeId: string, level: number, ancestors: Set<string> = new Set()) => {
    // Prevent infinite recursion by checking if we've seen this node in current path
    if (ancestors.has(nodeId)) {
      console.warn(`Circular reference detected at ${nodeId}, skipping to prevent infinite recursion`);
      return;
    }
    
    // Prevent processing same node multiple times
    if (visitedNodes.has(nodeId)) {
      return;
    }
    
    const currentJob = jobs.find(j => j.id === nodeId);
    if (!currentJob) return;
    
    // Prevent excessive depth
    if (level > 10) {
      console.warn(`Maximum hierarchy depth reached for ${currentJob.role}, stopping recursion`);
      return;
    }
    
    visitedNodes.add(nodeId);
    const newAncestors = new Set([...ancestors, nodeId]);
    
    // Find subordinates - those who report to this person's role
    const subordinates = jobs.filter(job => {
      return job.reports_to === currentJob.role && job.id !== nodeId; // Ensure not self-reporting
    });
    
    const currentNode = hierarchyNodes.get(nodeId);
    if (currentNode) {
      currentNode.children = subordinates.map(s => s.id);
      currentNode.level = level;
    }
    
    subordinates.forEach((subordinate) => {
      const subordinateNode = hierarchyNodes.get(subordinate.id);
      if (subordinateNode) {
        subordinateNode.level = level + 1;
      }
      
      // Create edge from supervisor to subordinate (reports_to relationship)
      edges.push({
        id: `${nodeId}-${subordinate.id}`,
        source: nodeId,
        target: subordinate.id,
        type: 'reports_to',
      });
      
      buildHierarchy(subordinate.id, level + 1, newAncestors);
    });
  };

  // Build hierarchy for each root node
  rootNodes.forEach(rootId => {
    buildHierarchy(rootId, 0);
  });

  // Handle assistant relationships separately
  jobs.forEach((job) => {
    if (job.assistant && job.assistant !== 'NA') {
      // Find the person this job is assistant TO
      const supervisorJob = jobs.find(j => j.role === job.assistant);
      if (supervisorJob) {
        // Create edge from supervisor to assistant (supervisor right -> assistant left)
        edges.push({
          id: `${supervisorJob.id}-assistant-${job.id}`,
          source: supervisorJob.id,
          target: job.id,
          type: 'assistant',
        });
      }
    }
  });

  console.log('Hierarchy complete - nodes:', hierarchyNodes.size, 'edges:', edges.length);

  return {
    nodes: hierarchyNodes,
    rootNodes,
    edges,
  };
};
