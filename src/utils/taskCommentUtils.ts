
import { TaskStatusOption, TaskPriorityOption } from '@/hooks/useTaskOptions';

export const formatFieldChangeComment = (
  field: string,
  oldValue: any,
  newValue: any,
  statusOptions: TaskStatusOption[],
  priorityOptions: TaskPriorityOption[],
  users: any[]
): string => {
  const getStatusLabel = (value: string) => {
    const option = statusOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const getPriorityLabel = (value: string) => {
    const option = priorityOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
  };

  switch (field) {
    case 'status':
      return `Status changed from "${getStatusLabel(oldValue)}" to "${getStatusLabel(newValue)}"`;
    
    case 'priority':
      return `Priority changed from "${getPriorityLabel(oldValue)}" to "${getPriorityLabel(newValue)}"`;
    
    case 'assigned_to':
      return `Assignment changed from "${getUserName(oldValue)}" to "${getUserName(newValue)}"`;
    
    case 'description':
      const oldDesc = oldValue || 'No description';
      const newDesc = newValue || 'No description';
      const truncatedOld = oldDesc.length > 50 ? oldDesc.substring(0, 50) + '...' : oldDesc;
      const truncatedNew = newDesc.length > 50 ? newDesc.substring(0, 50) + '...' : newDesc;
      return `Description changed from "${truncatedOld}" to "${truncatedNew}"`;
    
    default:
      return `${field} changed`;
  }
};
