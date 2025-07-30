import { useState, useCallback } from 'react';
import { Edge } from '@xyflow/react';
import { JobBoardWithCadet, Connection } from '../types';

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

interface UseConnectionEditorProps {
  onUpdateConnection: (
    sourceJobId: string,
    targetJobId: string,
    connectionType: 'reports_to' | 'assistant',
    sourceHandle: string,
    targetHandle: string
  ) => void;
  onUpdateConnectionHandle: (
    sourceJobId: string,
    connectionId: string,
    sourceHandle: string,
    targetHandle: string
  ) => void;
}

interface UseConnectionEditorReturn {
  editState: ConnectionEditState;
  startConnectionDrag: (handleId: string, job: JobBoardWithCadet, event: React.MouseEvent) => void;
  updateDragPosition: (event: React.MouseEvent) => void;
  completeConnectionDrop: (targetJobId: string, targetHandle: string) => void;
  cancelConnectionEdit: () => void;
  isValidDropTarget: (jobId: string, handleId: string) => boolean;
  onUpdateConnection: (
    sourceJobId: string,
    targetJobId: string,
    connectionType: 'reports_to' | 'assistant',
    sourceHandle: string,
    targetHandle: string
  ) => void;
  onUpdateConnectionHandle: (
    sourceJobId: string,
    connectionId: string,
    sourceHandle: string,
    targetHandle: string
  ) => void;
}

export const useConnectionEditor = ({
  onUpdateConnection,
  onUpdateConnectionHandle
}: UseConnectionEditorProps): UseConnectionEditorReturn => {
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

    if (editState.sourceJobId === targetJobId) {
      cancelConnectionEdit();
      return;
    }

    // Determine connection type based on handle positions
    const isVerticalConnection = editState.sourceHandle.includes('bottom') || editState.sourceHandle.includes('top');
    const connectionType = isVerticalConnection ? 'reports_to' : 'assistant';
    
    // Use the new connection creation method
    onUpdateConnection(
      editState.sourceJobId,
      targetJobId,
      connectionType,
      editState.sourceHandle,
      targetHandle
    );
    
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
  }, [editState, onUpdateConnection]);

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
    updateDragPosition,
    completeConnectionDrop,
    cancelConnectionEdit,
    isValidDropTarget,
    onUpdateConnection,
    onUpdateConnectionHandle
  };
};