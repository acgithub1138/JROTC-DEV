import React from 'react';
import { Subtask } from '@/hooks/tasks/types';
import { SubtaskFormContent } from './SubtaskFormContent';

interface SubtaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  subtask?: Subtask;
  parentTaskId?: string;
}

export const SubtaskForm: React.FC<SubtaskFormProps> = (props) => {
  return <SubtaskFormContent {...props} />;
};