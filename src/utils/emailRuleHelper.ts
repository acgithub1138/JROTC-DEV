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