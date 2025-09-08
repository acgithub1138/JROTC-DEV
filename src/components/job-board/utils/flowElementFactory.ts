
import { Node, Edge, Position } from '@xyflow/react';
import { JobBoardWithCadet, Connection } from '../types';
import { HierarchyResult } from './hierarchyBuilder';

const getOccupiedHandles = (jobs: JobBoardWithCadet[], currentJob: JobBoardWithCadet): Set<string> => {
  const occupiedHandles = new Set<string>();

  // Get occupied source handles from the connections array
  if (currentJob.connections && currentJob.connections.length > 0) {
    currentJob.connections.forEach(connection => {
      occupiedHandles.add(connection.source_handle);
    });
  }

  return occupiedHandles;
};

export const createFlowNodes = (
  jobs: JobBoardWithCadet[],
  positions: Map<string, { x: number; y: number }>
): Node[] => {
  return jobs.map((job) => {
    const position = positions.get(job.id) || { x: 0, y: 0 };
    const occupiedHandles = getOccupiedHandles(jobs, job);
    
    return {
      id: job.id,
      type: 'jobRole',
      position,
      draggable: true,
      data: {
        job,
        role: job.role,
        cadetName: job.cadet ? `${job.cadet.last_name}, ${job.cadet.first_name}` : 'Unassigned',
        rank: job.cadet?.rank || '',
        grade: job.cadet?.grade || '',
        occupiedHandles,
      },
    };
  });
};

export const createFlowEdges = (
  hierarchyResult: HierarchyResult,
  jobs: JobBoardWithCadet[]
): Edge[] => {
  console.log('Creating flow edges - hierarchy edges:', hierarchyResult.edges.length);
  
  const flowEdges: Edge[] = [];
  
  // Build a map of custom connections for quick lookup
  const customConnectionsMap = new Map<string, Connection>();
  jobs.forEach(job => {
    if (job.connections && job.connections.length > 0) {
      job.connections.forEach(connection => {
        if (connection.target_role !== 'NA') {
          const targetJob = jobs.find(j => j.role === connection.target_role);
          if (targetJob) {
            const key = `${job.id}-${targetJob.id}-${connection.type}`;
            customConnectionsMap.set(key, connection);
          }
        }
      });
    }
  });
  
  // Create edges from hierarchy edges, checking for custom overrides
  hierarchyResult.edges.forEach((hierarchyEdge) => {
    const sourceJob = jobs.find(j => j.id === hierarchyEdge.source);
    const targetJob = jobs.find(j => j.id === hierarchyEdge.target);
    
    if (!sourceJob || !targetJob) {
      console.warn(`Source or target job not found for edge:`, hierarchyEdge.id);
      return;
    }

    // Check if there's a custom connection that overrides this hierarchy edge
    const customKey = `${hierarchyEdge.source}-${hierarchyEdge.target}-${hierarchyEdge.type}`;
    const customConnection = customConnectionsMap.get(customKey);
    
    let sourceHandle = 'bottom-source';
    let targetHandle = 'top-target';
    
    if (hierarchyEdge.type === 'assistant') {
      sourceHandle = 'right-source';
      targetHandle = 'left-target';
    }
    
    // Use custom handles if available
    if (customConnection && customConnection.source_handle && customConnection.target_handle) {
      sourceHandle = customConnection.source_handle;
      targetHandle = customConnection.target_handle;
      console.log(`Using custom handles for ${hierarchyEdge.type} connection:`, { sourceHandle, targetHandle });
    }
    
    // Validate handle values to prevent invalid edges
    const validHandles = ['top-source', 'bottom-source', 'left-source', 'right-source', 'top-target', 'bottom-target', 'left-target', 'right-target'];
    
    // Validate and fix source handle
    if (!validHandles.includes(sourceHandle)) {
      console.warn(`🚨 Invalid source handle detected for edge ${hierarchyEdge.id}: ${sourceHandle}`);
      sourceHandle = hierarchyEdge.type === 'assistant' ? 'right-source' : 'bottom-source';
    }
    
    // Validate and fix target handle
    if (!validHandles.includes(targetHandle)) {
      console.warn(`🚨 Invalid target handle detected for edge ${hierarchyEdge.id}: ${targetHandle}`);
      targetHandle = hierarchyEdge.type === 'assistant' ? 'left-target' : 'top-target';
    }

    const edgeObj = {
      id: hierarchyEdge.id,
      source: hierarchyEdge.source,
      target: hierarchyEdge.target,
      sourceHandle,
      targetHandle,
      type: 'smoothstep' as const,
      animated: false,
      style: { 
        pointerEvents: 'all' as const,
        stroke: hierarchyEdge.type === 'assistant' ? '#10b981' : '#6366f1',
        strokeWidth: 2
      },
      data: { 
        connectionType: hierarchyEdge.type,
        connectionId: customConnection ? customConnection.id : hierarchyEdge.id
      }
    };
    
    flowEdges.push(edgeObj);
  });

  // Add any custom connections that don't have corresponding hierarchy edges
  jobs.forEach(job => {
    if (job.connections && job.connections.length > 0) {
      job.connections.forEach(connection => {
        // Skip connections with "NA" target role as it's not an actual job
        if (connection.target_role === 'NA') {
          return;
        }
        
        // Find the target job by role
        const targetJob = jobs.find(j => j.role === connection.target_role);
        if (!targetJob) {
          console.warn(`Target job not found for role: ${connection.target_role}`);
          return;
        }

        // Check if this connection was already handled by hierarchy edges
        const hierarchyEdgeExists = hierarchyResult.edges.some(hEdge => 
          hEdge.source === job.id && hEdge.target === targetJob.id && hEdge.type === connection.type
        );
        
        if (hierarchyEdgeExists) {
          return; // Skip - already handled above with custom handles
        }

        // This is a standalone custom connection
        // Validate handles for standalone connections
        let sourceHandle = connection.source_handle || 'bottom-source';
        let targetHandle = connection.target_handle || 'top-target';
        
        const validHandles = ['top-source', 'bottom-source', 'left-source', 'right-source', 'top-target', 'bottom-target', 'left-target', 'right-target'];
        
        if (!validHandles.includes(sourceHandle)) {
          console.warn(`🚨 Invalid source handle in standalone connection: ${sourceHandle}, using default`);
          sourceHandle = connection.type === 'assistant' ? 'right-source' : 'bottom-source';
        }
        
        if (!validHandles.includes(targetHandle)) {
          console.warn(`🚨 Invalid target handle in standalone connection: ${targetHandle}, using default`);
          targetHandle = connection.type === 'assistant' ? 'left-target' : 'top-target';
        }
        
        console.log(`🔗 Creating standalone edge: ${job.role} -> ${targetJob.role} (${connection.type})`);
        console.log(`🎯 Validated handles: ${sourceHandle} -> ${targetHandle}`);
        
        const edgeObj = {
          id: connection.id,
          source: job.id,
          target: targetJob.id,
          sourceHandle,
          targetHandle,
          type: 'smoothstep' as const,
          animated: false,
          style: { 
            pointerEvents: 'all' as const,
            stroke: connection.type === 'assistant' ? '#10b981' : '#6366f1',
            strokeWidth: 2
          },
          data: { 
            connectionType: connection.type,
            connectionId: connection.id
          }
        };
        
        flowEdges.push(edgeObj);
      });
    }
  });

  console.log('Flow edges created:', flowEdges.length);
  return flowEdges;
};
