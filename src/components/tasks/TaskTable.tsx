
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Task } from '@/hooks/useTasks';
import { TableHeader as TaskTableHeader } from './table/TableHeader';
import { TaskTableRow } from './table/TaskTableRow';
import { useTaskTableLogic } from '@/hooks/useTaskTableLogic';

interface TaskTableProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
  onEditTask: (task: Task) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({ tasks, onTaskSelect, onEditTask }) => {
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

  return (
    <div className="rounded-md border">
      <TaskTableHeader
        selectedTasks={selectedTasks}
        totalTasks={tasks.length}
        onSelectAll={(checked) => handleSelectAll(checked, tasks)}
        onBulkDelete={handleBulkDelete}
        canEdit={canEdit}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedTasks.length === tasks.length && tasks.length > 0}
                onCheckedChange={(checked) => handleSelectAll(checked as boolean, tasks)}
              />
            </TableHead>
            <TableHead>Task #</TableHead>
            <TableHead>Task Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
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
              onSave={saveEdit}
              onCancel={cancelEdit}
            />
          ))}
        </TableBody>
      </Table>
      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks found matching your criteria.
        </div>
      )}
    </div>
  );
};
