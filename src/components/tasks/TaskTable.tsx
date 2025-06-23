
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, Task } from '@/hooks/useTasks';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { format } from 'date-fns';
import { TableHeader as TaskTableHeader } from './table/TableHeader';
import { EditableCell } from './table/EditableCell';

interface TaskTableProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
  onEditTask: (task: Task) => void;
}

interface EditState {
  taskId: string | null;
  field: string | null;
  value: any;
}

export const TaskTable: React.FC<TaskTableProps> = ({ tasks, onTaskSelect, onEditTask }) => {
  const { userProfile } = useAuth();
  const { updateTask, deleteTask } = useTasks();
  const { users } = useSchoolUsers();
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const [editState, setEditState] = useState<EditState>({ taskId: null, field: null, value: null });
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const canEdit = userProfile?.role === 'instructor' || userProfile?.role === 'command_staff';

  // Helper functions to get labels from options
  const getStatusLabel = (statusValue: string) => {
    const option = statusOptions.find(opt => opt.value === statusValue);
    return option ? option.label : statusValue.replace('_', ' ');
  };

  const getPriorityLabel = (priorityValue: string) => {
    const option = priorityOptions.find(opt => opt.value === priorityValue);
    return option ? option.label : priorityValue;
  };

  const getStatusColorClass = (statusValue: string) => {
    const option = statusOptions.find(opt => opt.value === statusValue);
    return option ? option.color_class : 'bg-gray-100 text-gray-800';
  };

  const getPriorityColorClass = (priorityValue: string) => {
    const option = priorityOptions.find(opt => opt.value === priorityValue);
    return option ? option.color_class : 'bg-gray-100 text-gray-800';
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTasks([...selectedTasks, taskId]);
    } else {
      setSelectedTasks(selectedTasks.filter(id => id !== taskId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(tasks.map(task => task.id));
    } else {
      setSelectedTasks([]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedTasks.length === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''}?`;
    if (confirm(confirmMessage)) {
      selectedTasks.forEach(taskId => {
        deleteTask(taskId);
      });
      setSelectedTasks([]);
    }
  };

  const cancelEdit = () => {
    setEditState({ taskId: null, field: null, value: null });
  };

  const saveEdit = async (task: Task) => {
    if (!editState.taskId || !editState.field) return;

    const updateData: any = { id: task.id };
    
    if (editState.field === 'due_date') {
      updateData.due_date = editState.value ? editState.value.toISOString() : null;
    } else {
      updateData[editState.field] = editState.value;
    }

    try {
      await updateTask(updateData);
      cancelEdit();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const canEditTask = (task: Task) => {
    return canEdit || task.assigned_to === userProfile?.id;
  };

  return (
    <div className="rounded-md border">
      <TaskTableHeader
        selectedTasks={selectedTasks}
        totalTasks={tasks.length}
        onSelectAll={handleSelectAll}
        onBulkDelete={handleBulkDelete}
        canEdit={canEdit}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={selectedTasks.length === tasks.length && tasks.length > 0}
                onCheckedChange={handleSelectAll}
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
            <TableRow key={task.id} className="group">
              <TableCell>
                <Checkbox
                  checked={selectedTasks.includes(task.id)}
                  onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                />
              </TableCell>
              <TableCell className="font-mono text-sm">
                <button
                  onClick={() => onTaskSelect(task)}
                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {task.task_number || 'N/A'}
                </button>
              </TableCell>
              <TableCell className="font-medium">
                <EditableCell
                  task={task}
                  field="title"
                  value={task.title}
                  displayValue={task.title}
                  editState={editState}
                  setEditState={setEditState}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  canEdit={canEditTask(task)}
                />
              </TableCell>
              <TableCell>
                {editState.taskId === task.id && editState.field === 'status' ? (
                  <EditableCell
                    task={task}
                    field="status"
                    value={task.status}
                    displayValue=""
                    editState={editState}
                    setEditState={setEditState}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                    canEdit={canEditTask(task)}
                  />
                ) : (
                  <div onClick={() => canEditTask(task) && setEditState({ taskId: task.id, field: 'status', value: task.status })}>
                    <Badge className={getStatusColorClass(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {editState.taskId === task.id && editState.field === 'priority' ? (
                  <EditableCell
                    task={task}
                    field="priority"
                    value={task.priority}
                    displayValue=""
                    editState={editState}
                    setEditState={setEditState}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                    canEdit={canEditTask(task)}
                  />
                ) : (
                  <div onClick={() => canEditTask(task) && setEditState({ taskId: task.id, field: 'priority', value: task.priority })}>
                    <Badge className={getPriorityColorClass(task.priority)}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {canEdit ? (
                  <EditableCell
                    task={task}
                    field="assigned_to"
                    value={task.assigned_to}
                    displayValue={
                      task.assigned_to_profile
                        ? `${task.assigned_to_profile.first_name} ${task.assigned_to_profile.last_name}`
                        : 'Unassigned'
                    }
                    editState={editState}
                    setEditState={setEditState}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                    canEdit={canEdit}
                    users={users}
                  />
                ) : (
                  <span>
                    {task.assigned_to_profile
                      ? `${task.assigned_to_profile.first_name} ${task.assigned_to_profile.last_name}`
                      : 'Unassigned'}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <EditableCell
                  task={task}
                  field="due_date"
                  value={task.due_date ? new Date(task.due_date) : null}
                  displayValue={task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'}
                  editState={editState}
                  setEditState={setEditState}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  canEdit={canEditTask(task)}
                />
              </TableCell>
              <TableCell>
                {format(new Date(task.created_at), 'MMM d, yyyy')}
              </TableCell>
            </TableRow>
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
