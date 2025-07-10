
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/hooks/useTasks';
import { Subtask } from '@/hooks/tasks/types';
import { TableHeader as TaskTableHeader } from './table/TableHeader';
import { TaskTableRow } from './table/TaskTableRow';
import { useTaskTableLogic } from '@/hooks/useTaskTableLogic';
import { useTaskSorting } from '@/hooks/useTaskSorting';
import { useTaskSystemComments } from '@/hooks/useTaskSystemComments';
import { useSubtaskSystemComments } from '@/hooks/useSubtaskSystemComments';
import { useSubtasks } from '@/hooks/useSubtasks';
import { useSortableTable } from '@/hooks/useSortableTable';

interface TaskTableProps {
  tasks: (Task | Subtask)[];
  onTaskSelect: (task: Task | Subtask) => void;
  onEditTask: (task: Task | Subtask) => void;
  showOverdueFilter?: boolean;
  overdueFilterChecked?: boolean;
  onOverdueFilterChange?: (checked: boolean) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({ 
  tasks, 
  onTaskSelect, 
  onEditTask, 
  showOverdueFilter = false,
  overdueFilterChecked = false,
  onOverdueFilterChange 
}) => {
  const [expandedTasks, setExpandedTasks] = React.useState<Set<string>>(new Set());
  
  const { customSortFn } = useTaskSorting();
  const { handleSystemComment } = useTaskSystemComments();
  const { handleSystemComment: handleSubtaskSystemComment } = useSubtaskSystemComments();
  
  const { sortedData: sortedTasks, sortConfig, handleSort } = useSortableTable({
    data: tasks,
    customSortFn
  });

  // Get subtask mutations for updating subtasks
  const { updateSubtask } = useSubtasks();

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

  // Enhanced save function that detects subtasks vs tasks
  const handleSaveEdit = async (task: Task | any, field: string, newValue: any) => {
    // Check if this is a subtask (has parent_task_id)
    const isSubtask = 'parent_task_id' in task;
    
    if (isSubtask) {
      // Handle subtask update
      console.log('Saving subtask update:', { subtaskId: task.id, field, newValue });

      // Get the old value for comparison
      const oldValue = task[field as keyof typeof task];

      // Skip if values are the same
      if (oldValue === newValue) {
        return;
      }

      const updateData: any = { id: task.id };
      
      // Handle date field conversion
      if (field === 'due_date') {
        updateData.due_date = newValue ? newValue.toISOString() : null;
      } else {
        updateData[field] = newValue;
      }

      try {
        await updateSubtask(updateData);
        
        // Add system comment for the change
        let commentText = '';
        if (field === 'status') {
          commentText = `Status changed from "${oldValue}" to "${newValue}"`;
        } else if (field === 'priority') {
          commentText = `Priority changed from "${oldValue}" to "${newValue}"`;
        } else if (field === 'assigned_to') {
          const oldAssignee = task.assigned_to_profile ? `${task.assigned_to_profile.first_name} ${task.assigned_to_profile.last_name}` : 'Unassigned';
          const newAssignee = newValue ? users.find(u => u.id === newValue)?.first_name + ' ' + users.find(u => u.id === newValue)?.last_name : 'Unassigned';
          commentText = `Assigned to changed from "${oldAssignee}" to "${newAssignee}"`;
        } else if (field === 'due_date') {
          const { format } = await import('date-fns');
          const oldDate = oldValue ? format(new Date(oldValue as string), 'MMM d, yyyy') : 'No due date';
          const newDate = newValue ? format(newValue, 'MMM d, yyyy') : 'No due date';
          commentText = `Due date changed from "${oldDate}" to "${newDate}"`;
        } else if (field === 'title') {
          commentText = `Title changed from "${oldValue}" to "${newValue}"`;
        }
        
        if (commentText) {
          await handleSubtaskSystemComment(task.id, commentText);
        }

        // Clear edit state after successful update
        cancelEdit();
      } catch (error) {
        console.error('Failed to update subtask:', error);
      }
    } else {
      // Handle regular task update
      saveEdit(task, field, newValue, handleSystemComment);
    }
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

  return (
    <div className="bg-card rounded-lg border">
      <TaskTableHeader
        selectedTasks={selectedTasks}
        totalTasks={sortedTasks.length}
        onSelectAll={(checked) => handleSelectAll(checked, sortedTasks)}
        onBulkDelete={handleBulkDelete}
        canEdit={canEdit}
        showOverdueFilter={showOverdueFilter}
        overdueFilterChecked={overdueFilterChecked}
        onOverdueFilterChange={onOverdueFilterChange}
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
              className="text-center"
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
            <TableHead className="w-[80px]">Actions</TableHead>
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
