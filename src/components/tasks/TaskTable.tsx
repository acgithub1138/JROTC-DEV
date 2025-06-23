
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MoreHorizontal, Edit, Trash2, Eye, CalendarIcon, Check, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, Task } from '@/hooks/useTasks';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { format } from 'date-fns';

interface TaskTableProps {
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
  onEditTask: (task: Task) => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
  critical: 'bg-purple-100 text-purple-800',
};

const statusColors = {
  not_started: 'bg-gray-100 text-gray-800',
  working_on_it: 'bg-blue-100 text-blue-800',
  stuck: 'bg-red-100 text-red-800',
  done: 'bg-green-100 text-green-800',
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

interface EditState {
  taskId: string | null;
  field: string | null;
  value: any;
}

export const TaskTable: React.FC<TaskTableProps> = ({ tasks, onTaskSelect, onEditTask }) => {
  const { userProfile } = useAuth();
  const { updateTask, deleteTask } = useTasks();
  const { users } = useSchoolUsers();
  const [editState, setEditState] = useState<EditState>({ taskId: null, field: null, value: null });

  const canEdit = userProfile?.role === 'instructor' || userProfile?.role === 'command_staff';

  const startEdit = (taskId: string, field: string, currentValue: any) => {
    setEditState({ taskId, field, value: currentValue });
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

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  const canEditTask = (task: Task) => {
    return canEdit || task.assigned_to === userProfile?.id;
  };

  const renderEditableCell = (task: Task, field: string, value: any, displayValue: string) => {
    const isEditing = editState.taskId === task.id && editState.field === field;
    const canEditThisTask = canEditTask(task);

    if (!canEditThisTask) {
      return <span>{displayValue}</span>;
    }

    if (isEditing) {
      if (field === 'title') {
        return (
          <div className="flex items-center gap-2">
            <Input
              value={editState.value}
              onChange={(e) => setEditState({ ...editState, value: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(task);
                if (e.key === 'Escape') cancelEdit();
              }}
              className="h-8"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={() => saveEdit(task)}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        );
      }

      if (field === 'status') {
        return (
          <Select
            value={editState.value}
            onValueChange={(value) => {
              setEditState({ ...editState, value });
              // Auto-save for select fields
              setTimeout(() => {
                updateTask({ id: task.id, status: value });
                cancelEdit();
              }, 100);
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="working_on_it">Working On It</SelectItem>
              <SelectItem value="stuck">Stuck</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        );
      }

      if (field === 'priority') {
        return (
          <Select
            value={editState.value}
            onValueChange={(value) => {
              setEditState({ ...editState, value });
              // Auto-save for select fields
              setTimeout(() => {
                updateTask({ id: task.id, priority: value });
                cancelEdit();
              }, 100);
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
        );
      }

      if (field === 'assigned_to' && canEdit) {
        return (
          <Select
            value={editState.value || ''}
            onValueChange={(value) => {
              setEditState({ ...editState, value: value || null });
              // Auto-save for select fields
              setTimeout(() => {
                updateTask({ id: task.id, assigned_to: value || null });
                cancelEdit();
              }, 100);
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Unassigned</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      if (field === 'due_date') {
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {editState.value ? format(editState.value, 'MMM d, yyyy') : 'Set date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={editState.value}
                onSelect={(date) => {
                  setEditState({ ...editState, value: date });
                  // Auto-save for date picker
                  setTimeout(() => {
                    updateTask({ id: task.id, due_date: date ? date.toISOString() : null });
                    cancelEdit();
                  }, 100);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      }
    }

    return (
      <div
        className="cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 flex items-center gap-2"
        onClick={() => startEdit(task.id, field, value)}
      >
        <span>{displayValue}</span>
        <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100" />
      </div>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} className="group">
              <TableCell className="font-medium">
                {renderEditableCell(
                  task,
                  'title',
                  task.title,
                  task.title
                )}
              </TableCell>
              <TableCell>
                {renderEditableCell(
                  task,
                  'status',
                  task.status,
                  ''
                )}
                {!(editState.taskId === task.id && editState.field === 'status') && (
                  <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {renderEditableCell(
                  task,
                  'priority',
                  task.priority,
                  ''
                )}
                {!(editState.taskId === task.id && editState.field === 'priority') && (
                  <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                    {task.priority}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {canEdit ? (
                  renderEditableCell(
                    task,
                    'assigned_to',
                    task.assigned_to,
                    task.assigned_to_profile
                      ? `${task.assigned_to_profile.first_name} ${task.assigned_to_profile.last_name}`
                      : 'Unassigned'
                  )
                ) : (
                  <span>
                    {task.assigned_to_profile
                      ? `${task.assigned_to_profile.first_name} ${task.assigned_to_profile.last_name}`
                      : 'Unassigned'}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {renderEditableCell(
                  task,
                  'due_date',
                  task.due_date ? new Date(task.due_date) : null,
                  task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No due date'
                )}
              </TableCell>
              <TableCell>
                {format(new Date(task.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onTaskSelect(task)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {canEditTask(task) && (
                      <DropdownMenuItem onClick={() => onEditTask(task)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit in Modal
                      </DropdownMenuItem>
                    )}
                    {canEdit && (
                      <DropdownMenuItem 
                        onClick={() => handleDelete(task.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
