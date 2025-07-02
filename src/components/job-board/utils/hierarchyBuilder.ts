
import { JobBoardWithCadet } from '../types';

export interface HierarchyNode {
  id: string;
  level: number;
  children: string[];
}

export interface HierarchyResult {
  nodes: Map<string, HierarchyNode>;
  rootNodes: string[];
  edges: Array<{ id: string; source: string; target: string }>;
}

export const buildJobHierarchy = (jobs: JobBoardWithCadet[]): HierarchyResult => {
  console.log('Building hierarchy with jobs:', jobs);
  
  const hierarchyNodes = new Map<string, HierarchyNode>();
  const edges: Array<{ id: string; source: string; target: string }> = [];
  
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
    console.log(`Job ${job.role} reports to: ${job.reports_to || 'none'}`);
    if (!job.reports_to || job.reports_to === 'NA') {
      rootNodes.push(job.id);
      const node = hierarchyNodes.get(job.id);
      if (node) {
        node.level = 0;
      }
    }
  });

  console.log('Root nodes:', rootNodes);

  // Build hierarchy levels and relationships
  const buildHierarchy = (nodeId: string, level: number) => {
    const currentJob = jobs.find(j => j.id === nodeId);
    if (!currentJob) return;
    
    console.log(`Building hierarchy for ${currentJob.role} at level ${level}`);
    
    // Find subordinates - those who report to this person's role
    const subordinates = jobs.filter(job => {
      const reportsToMatch = job.reports_to === currentJob.role;
      if (reportsToMatch) {
        console.log(`Found subordinate: ${job.role} reports to ${currentJob.role}`);
      }
      return reportsToMatch;
    });
    
    console.log(`${currentJob.role} has ${subordinates.length} subordinates:`, subordinates.map(s => s.role));
    
    const currentNode = hierarchyNodes.get(nodeId);
    if (currentNode) {
      currentNode.children = subordinates.map(s => s.id);
    }
    
    subordinates.forEach((subordinate) => {
      const subordinateNode = hierarchyNodes.get(subordinate.id);
      if (subordinateNode) {
        subordinateNode.level = level + 1;
      }
      
      // Create edge from supervisor to subordinate
      edges.push({
        id: `${nodeId}-${subordinate.id}`,
        source: nodeId,
        target: subordinate.id,
      });
      
      console.log(`Created edge: ${currentJob.role} -> ${subordinate.role}`);
      
      buildHierarchy(subordinate.id, level + 1);
    });
  };

  // Build hierarchy for each root node
  rootNodes.forEach(rootId => {
    const rootJob = jobs.find(j => j.id === rootId);
    console.log(`Starting hierarchy build from root: ${rootJob?.role}`);
    buildHierarchy(rootId, 0);
  });

  console.log('Hierarchy nodes:', Array.from(hierarchyNodes.entries()));
  console.log('Edges:', edges);

  return {
    nodes: hierarchyNodes,
    rootNodes,
    edges,
  };
};
