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
  });

  const startConnectionEdit = useCallback((handleId: string, job: JobBoardWithCadet) => {
    // Determine connection type based on existing connections
    let connectionType: 'reports_to' | 'assistant' | null = null;
    
    if (job.reports_to) {
      connectionType = 'reports_to';
    } else if (job.assistant) {
      connectionType = 'assistant';
    }

    setEditState({
      isEditing: true,
      sourceJobId: job.id,
      sourceHandle: handleId,
      targetJobId: null,
      targetHandle: null,
      connectionType,
    });
  }, []);

  const completeConnectionEdit = useCallback((targetHandle: string) => {
    if (!editState.isEditing || !editState.sourceJobId || !editState.connectionType) {
      return;
    }

    const sourceJob = jobs.find(j => j.id === editState.sourceJobId);
    if (!sourceJob) return;

    // Update the connection handles based on the edit
    const updates: Partial<JobBoardWithCadet> = {};
    
    if (editState.connectionType === 'reports_to') {
      updates.reports_to_source_handle = editState.sourceHandle;
      updates.reports_to_target_handle = targetHandle;
    } else if (editState.connectionType === 'assistant') {
      updates.assistant_source_handle = editState.sourceHandle;
      updates.assistant_target_handle = targetHandle;
    }

    onUpdateConnection(editState.sourceJobId, updates);
    
    setEditState({
      isEditing: false,
      sourceJobId: null,
      sourceHandle: null,
      targetJobId: null,
      targetHandle: null,
      connectionType: null,
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
    });
  }, []);

  const isValidTarget = useCallback((handleId: string, jobId: string) => {
    if (!editState.isEditing || editState.sourceJobId !== jobId) {
      return false;
    }
    
    // Allow only handles on the same card
    return true;
  }, [editState]);

  return {
    editState,
    startConnectionEdit,
    completeConnectionEdit,
    cancelConnectionEdit,
    isValidTarget,
  };
};