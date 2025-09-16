import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useJudges, Judge } from '@/hooks/competition-portal/useJudges';
import { useCPJudgesPermissions } from '@/hooks/useModuleSpecificPermissions';

interface EditState {
  judgeId: string | null;
  field: string | null;
  value: any;
}

export const useJudgeTableLogic = () => {
  const { userProfile } = useAuth();
  const { updateJudge } = useJudges();
  const { canUpdate } = useCPJudgesPermissions();
  const [editState, setEditState] = useState<EditState>({ judgeId: null, field: null, value: null });

  const canEdit = canUpdate;

  const cancelEdit = () => {
    setEditState({ judgeId: null, field: null, value: null });
  };

  const saveEdit = async (judge: Judge, field: string, newValue: any) => {
    console.log('Saving judge update:', { judgeId: judge.id, field, newValue });

    // Get the old value for comparison
    const oldValue = judge[field as keyof Judge];

    // Skip if values are the same
    if (oldValue === newValue) {
      cancelEdit();
      return;
    }

    const updateData: any = { id: judge.id };
    updateData[field] = newValue;

    console.log('Final update data:', updateData);

    try {
      await updateJudge(updateData);
      cancelEdit();
    } catch (error) {
      console.error('Failed to update judge:', error);
    }
  };

  return {
    editState,
    setEditState,
    canEdit,
    cancelEdit,
    saveEdit,
  };
};