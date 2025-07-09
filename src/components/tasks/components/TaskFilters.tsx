import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Task } from '@/hooks/useTasks';

interface TaskFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchTerm,
  onSearchChange
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
export const filterTasks = (taskList: Task[], searchTerm: string) => {
  if (!searchTerm) return taskList;
  
  return taskList.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.task_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assigned_to_profile?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assigned_to_profile?.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
};