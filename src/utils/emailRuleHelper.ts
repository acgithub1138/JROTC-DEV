import { useEmailService } from '@/hooks/email/useEmailService';

interface EmailRuleParams {
  operation: 'task_created' | 'task_information_needed' | 'task_completed' | 'task_canceled' | 
             'subtask_created' | 'subtask_information_needed' | 'subtask_completed' | 'subtask_canceled';
  recordId: string;
  schoolId: string;
  sourceTable: 'tasks' | 'subtasks';
  templateId?: string;
}

export const triggerEmailRule = async (params: EmailRuleParams, queueEmail: any) => {
  try {
    await queueEmail({
      templateId: params.templateId || '', // Will be resolved by backend based on rule
      recipientEmail: '', // Will be resolved by backend
      sourceTable: params.sourceTable,
      recordId: params.recordId,
      schoolId: params.schoolId,
      ruleId: '', // Will be resolved by backend based on operation type
    });
  } catch (error) {
    console.error(`Failed to trigger email for ${params.operation}:`, error);
  }
};

export const shouldTriggerStatusChangeEmail = (
  oldStatus: string | undefined, 
  newStatus: string | undefined
): string | null => {
  // Only trigger if status actually changed
  if (oldStatus === newStatus) return null;
  
  // Map status values to email rule types
  if (newStatus === 'need_information') return 'information_needed';
  if (newStatus === 'completed') return 'completed';
  if (newStatus === 'canceled') return 'canceled';
  
  return null;
};