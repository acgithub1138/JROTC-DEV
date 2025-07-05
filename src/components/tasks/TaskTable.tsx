
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead, SortConfig } from '@/components/ui/sortable-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/hooks/useTasks';
import { TableHeader as TaskTableHeader } from './table/TableHeader';
import { TaskTableRow } from './table/TaskTableRow';
import { useTaskTableLogic } from '@/hooks/useTaskTableLogic';
import { useSortableTable } from '@/hooks/useSortableTable';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TaskTableProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
  onEditTask: (task: Task) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({ tasks, onTaskSelect, onEditTask }) => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  
  // Custom sort function for tasks that handles nested values
  const customSortFn = (a: Task, b: Task, sortConfig: SortConfig) => {
    const getTaskValue = (task: Task, key: string) => {
      if (key === 'assigned_to_name') {
        return task.assigned_to_profile 
          ? `${task.assigned_to_profile.last_name}, ${task.assigned_to_profile.first_name}`
          : '';
      }
      return task[key as keyof Task];
    };

    const aValue = getTaskValue(a, sortConfig.key);
    const bValue = getTaskValue(b, sortConfig.key);

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  };

  const { sortedData: sortedTasks, sortConfig, handleSort } = useSortableTable({
    data: tasks,
    customSortFn
  });

  const {
    editState,
    setEditState,
    selectedTasks,
    canEdit,
    users,
    statusOptions,
    priorityOptions,
    handleSelectTask,
    handleSelectAll,
    handleBulkDelete,
    cancelEdit,
    saveEdit,
    canEditTask,
  } = useTaskTableLogic();
  const handleSystemComment = async (taskId: string, commentText: string) => {
    try {
      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          user_id: userProfile?.id,
          comment_text: commentText,
          is_system_comment: true,
        });

      if (error) {
        console.error('Error adding system comment:', error);
        return;
      }

      // Invalidate the task comments query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
    } catch (error) {
      console.error('Failed to add system comment:', error);
    }
  };

  // Enhanced save function that includes system comment handling
  const handleSaveEdit = (task: Task, field: string, newValue: any) => {
    saveEdit(task, field, newValue, handleSystemComment);
  };

  return (
    <div className="bg-card rounded-lg border">
      <TaskTableHeader
        selectedTasks={selectedTasks}
        totalTasks={sortedTasks.length}
        onSelectAll={(checked) => handleSelectAll(checked, sortedTasks)}
        onBulkDelete={handleBulkDelete}
        canEdit={canEdit}
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
            <SortableTableHead
              sortKey="task_number"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Task #
            </SortableTableHead>
            <SortableTableHead
              sortKey="title"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Task Name
            </SortableTableHead>
            <SortableTableHead
              sortKey="description"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Description
            </SortableTableHead>
            <SortableTableHead
              sortKey="status"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Status
            </SortableTableHead>
            <SortableTableHead
              sortKey="priority"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Priority
            </SortableTableHead>
            <SortableTableHead
              sortKey="assigned_to_name"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Assigned To
            </SortableTableHead>
            <SortableTableHead
              sortKey="due_date"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Due Date
            </SortableTableHead>
            <SortableTableHead
              sortKey="created_at"
              currentSort={sortConfig}
              onSort={handleSort}
            >
              Created
            </SortableTableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => (
            <TaskTableRow
              key={task.id}
              task={task}
              isSelected={selectedTasks.includes(task.id)}
              editState={editState}
              setEditState={setEditState}
              statusOptions={statusOptions}
              priorityOptions={priorityOptions}
              users={users}
              canEdit={canEdit}
              canEditTask={canEditTask}
              onTaskSelect={onTaskSelect}
              onSelectTask={handleSelectTask}
              onSave={handleSaveEdit}
              onCancel={cancelEdit}
              onEditTask={onEditTask}
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
