
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Task } from '@/hooks/useTasks';
import { Subtask } from '@/hooks/tasks/types';

interface TaskFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const TaskFilters = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <Input
        placeholder="Search tasks..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};

// Filter utility functions
export const filterTasks = (taskList: (Task | Subtask)[], searchTerm: string) => {
  if (!searchTerm) return taskList;
  
  return taskList.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.task_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assigned_to_profile?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assigned_to_profile?.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
};