
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/hooks/useTasks';
import { Subtask } from '@/hooks/tasks/types';
import { TableHeader as TaskTableHeader } from './table/TableHeader';
import { TaskTableRow } from './table/TaskTableRow';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useTaskPermissions } from '@/hooks/useModuleSpecificPermissions';
import { useTasks } from '@/hooks/useTasks';

interface TaskTableProps {
  tasks: (Task | Subtask)[];
  onTaskSelect: (task: Task | Subtask) => void;
  showOverdueFilter?: boolean;
  overdueFilterChecked?: boolean;
  onOverdueFilterChange?: (checked: boolean) => void;
  onRefresh?: () => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({ 
  tasks, 
  onTaskSelect,
  showOverdueFilter = false,
  overdueFilterChecked = false,
  onOverdueFilterChange,
  onRefresh 
}) => {
  const [expandedTasks, setExpandedTasks] = React.useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = React.useState<string[]>([]);
  
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const { users } = useSchoolUsers();
  const { canDelete, canUpdate } = useTaskPermissions();
  const { deleteTask } = useTasks();
  
  // Tasks are already sorted in TaskTabs, just display them
  const sortedTasks = tasks;

  const handleSelectTask = (taskId: string, checked: boolean) => {
    setSelectedTasks(prev => 
      checked 
        ? [...prev, taskId]
        : prev.filter(id => id !== taskId)
    );
  };

  const handleSelectAll = (checked: boolean, tasks: (Task | Subtask)[]) => {
    setSelectedTasks(checked ? tasks.map(task => task.id) : []);
  };

  const handleToggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectionClear = () => {
    setSelectedTasks([]);
  };

  return (
    <div className="bg-card rounded-lg border">
      <TaskTableHeader
        selectedTasks={selectedTasks}
        totalTasks={sortedTasks.length}
        onSelectAll={(checked) => handleSelectAll(checked, sortedTasks)}
        onSelectionClear={handleSelectionClear}
        canEdit={canUpdate}
        canDelete={canDelete}
        showOverdueFilter={showOverdueFilter}
        overdueFilterChecked={overdueFilterChecked}
        onOverdueFilterChange={onOverdueFilterChange}
        onRefresh={onRefresh}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedTasks.length === sortedTasks.length && sortedTasks.length > 0}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean, sortedTasks)}
              />
            </TableHead>
            <TableHead className="text-center">Task #</TableHead>
            <TableHead>Task Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => (
            <TaskTableRow
              key={task.id}
              task={task}
              isSelected={selectedTasks.includes(task.id)}
              statusOptions={statusOptions}
              priorityOptions={priorityOptions}
              users={users}
              onTaskSelect={onTaskSelect}
              onSelectTask={handleSelectTask}
              expandedTasks={expandedTasks}
              onToggleExpanded={handleToggleExpanded}
              selectedTasks={selectedTasks}
            />
          ))}
        </TableBody>
      </Table>
      {sortedTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks found matching your criteria.
        </div>
      )}
    </div>
  );
};
