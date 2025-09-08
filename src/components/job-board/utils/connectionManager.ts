import { Connection, JobBoardWithCadet } from '../types';

/**
 * Utility functions for managing job board connections and preventing duplicates
 */

export const ConnectionManager = {
  /**
   * Removes duplicate connections from a connections array based on type and target_role
   */
  deduplicateConnections: (connections: Connection[], newConnection: Connection): Connection[] => {
    // Remove any existing connection with the same type and target_role
    const filtered = connections.filter(conn => 
      !(conn.type === newConnection.type && conn.target_role === newConnection.target_role)
    );
    // Add the new/updated connection
    return [...filtered, newConnection];
  },

  /**
   * Finds existing connection between two jobs
   */
  findExistingConnection: (
    sourceJob: JobBoardWithCadet, 
    targetJob: JobBoardWithCadet, 
    connectionType: 'reports_to' | 'assistant'
  ): Connection | null => {
    if (!sourceJob.connections) return null;
    
    return sourceJob.connections.find(conn => 
      conn.type === connectionType && conn.target_role === targetJob.role
    ) || null;
  },

  /**
   * Creates a connection object with proper ID and handles
   */
  createConnection: (
    sourceJob: JobBoardWithCadet,
    targetJob: JobBoardWithCadet,
    connectionType: 'reports_to' | 'assistant',
    sourceHandle: string,
    targetHandle: string
  ): Connection => {
    const connectionId = connectionType === 'assistant' 
      ? `${sourceJob.id}-assistant-${targetJob.id}`
      : `${sourceJob.id}-${targetJob.id}`;

    return {
      id: connectionId,
      type: connectionType,
      target_role: targetJob.role,
      source_handle: sourceHandle,
      target_handle: targetHandle
    };
  },

  /**
   * Validates handle positions
   */
  validateHandles: (sourceHandle: string, targetHandle: string): boolean => {
    const validHandles = ['top-source', 'bottom-source', 'left-source', 'right-source', 
                         'top-target', 'bottom-target', 'left-target', 'right-target'];
    return validHandles.includes(sourceHandle) && validHandles.includes(targetHandle);
  },

  /**
   * Gets handle position from full handle string (e.g., 'left-source' -> 'left')
   */
  getHandlePosition: (handle: string): string => {
    return handle.split('-')[0];
  }
};