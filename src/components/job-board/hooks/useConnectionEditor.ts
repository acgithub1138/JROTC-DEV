import { useState, useCallback } from 'react';
import { Edge } from '@xyflow/react';
import { JobBoardWithCadet } from '../types';

interface ConnectionEditState {
  isEditing: boolean;
  sourceJobId: string | null;
  sourceHandle: string | null;
  targetJobId: string | null;
  targetHandle: string | null;
  connectionType: 'reports_to' | 'assistant' | null;
  isDragging: boolean;
  dragPreview: {
    sourceJobId: string;
    sourceHandle: string;
    mousePosition?: { x: number; y: number };
  } | null;
}

export const useConnectionEditor = (
  jobs: JobBoardWithCadet[],
  onUpdateConnection: (jobId: string, updates: Partial<JobBoardWithCadet>) => void
) => {
  const [editState, setEditState] = useState<ConnectionEditState>({
    isEditing: false,
    sourceJobId: null,
    sourceHandle: null,
    targetJobId: null,
    targetHandle: null,
    connectionType: null,
    isDragging: false,
    dragPreview: null,
  });

  const startConnectionDrag = useCallback((handleId: string, job: JobBoardWithCadet, event: React.MouseEvent) => {
    event.preventDefault();
    
    setEditState({
      isEditing: true,
      sourceJobId: job.id,
      sourceHandle: handleId,
      targetJobId: null,
      targetHandle: null,
      connectionType: null,
      isDragging: true,
      dragPreview: {
        sourceJobId: job.id,
        sourceHandle: handleId,
        mousePosition: { x: event.clientX, y: event.clientY }
      }
    });
  }, []);

  const updateDragPosition = useCallback((event: React.MouseEvent) => {
    if (editState.isDragging && editState.dragPreview) {
      setEditState(prev => ({
        ...prev,
        dragPreview: prev.dragPreview ? {
          ...prev.dragPreview,
          mousePosition: { x: event.clientX, y: event.clientY }
        } : null
      }));
    }
  }, [editState.isDragging, editState.dragPreview]);

  const completeConnectionDrop = useCallback((targetJobId: string, targetHandle: string) => {
    if (!editState.isDragging || !editState.sourceJobId || !editState.sourceHandle) {
      return;
    }

    const sourceJob = jobs.find(j => j.id === editState.sourceJobId);
    const targetJob = jobs.find(j => j.id === targetJobId);
    
    if (!sourceJob || !targetJob || editState.sourceJobId === targetJobId) {
      cancelConnectionEdit();
      return;
    }

    // Determine connection type based on handle positions
    const isVerticalConnection = editState.sourceHandle.includes('bottom') || editState.sourceHandle.includes('top');
    const connectionType = isVerticalConnection ? 'reports_to' : 'assistant';
    
    // Create updates for source job
    const sourceUpdates: Partial<JobBoardWithCadet> = {};
    
    // First, clear the old connection if we're moving an existing one
    if (connectionType === 'reports_to') {
      // Clear any existing reports_to connection
      sourceUpdates.reports_to = targetJob.role;
      sourceUpdates.reports_to_source_handle = editState.sourceHandle;
      // Don't update target handle to prevent cascading updates
    } else {
      // Clear any existing assistant connection  
      sourceUpdates.assistant = targetJob.role;
      sourceUpdates.assistant_source_handle = editState.sourceHandle;
      // Don't update target handle to prevent cascading updates
    }

    // Apply updates to source job
    onUpdateConnection(editState.sourceJobId, sourceUpdates);
    
    setEditState({
      isEditing: false,
      sourceJobId: null,
      sourceHandle: null,
      targetJobId: null,
      targetHandle: null,
      connectionType: null,
      isDragging: false,
      dragPreview: null,
    });
  }, [editState, jobs, onUpdateConnection]);

  const cancelConnectionEdit = useCallback(() => {
    setEditState({
      isEditing: false,
      sourceJobId: null,
      sourceHandle: null,
      targetJobId: null,
      targetHandle: null,
      connectionType: null,
      isDragging: false,
      dragPreview: null,
    });
  }, []);

  const isValidDropTarget = useCallback((jobId: string, handleId: string) => {
    if (!editState.isDragging || !editState.sourceJobId || editState.sourceJobId === jobId) {
      return false;
    }
    
    // Validate based on handle compatibility
    const sourceHandle = editState.sourceHandle || '';
    const isVerticalSource = sourceHandle.includes('bottom') || sourceHandle.includes('top');
    const isHorizontalSource = sourceHandle.includes('left') || sourceHandle.includes('right');
    const isVerticalTarget = handleId.includes('bottom') || handleId.includes('top');
    const isHorizontalTarget = handleId.includes('left') || handleId.includes('right');
    
    // Prevent connecting same-direction handles
    if ((isVerticalSource && isVerticalTarget) || (isHorizontalSource && isHorizontalTarget)) {
      return false;
    }
    
    return true;
  }, [editState]);

  return {
    editState,
    startConnectionDrag,
    completeConnectionDrop,
    updateDragPosition,
    cancelConnectionEdit,
    isValidDropTarget,
  };
};