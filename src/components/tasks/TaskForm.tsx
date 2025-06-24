import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTasks, Task } from '@/hooks/useTasks';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';
import { useAuth } from '@/contexts/AuthContext';

const taskSchema = z.object({
  title: z.string().min(1, 'Task name is required').max(150, 'Task name must be 150 characters or less'),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'critical']),
  status: z.enum(['not_started', 'working_on_it', 'stuck', 'done', 'pending', 'in_progress', 'completed', 'overdue', 'cancelled']),
  due_date: z.date().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  task?: Task;
}

export const TaskForm: React.FC<TaskFormProps> = ({ open, onOpenChange, mode, task }) => {
  const { userProfile } = useAuth();
  const { createTask, updateTask, isCreating, isUpdating } = useTasks();
  const { users } = useSchoolUsers();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    task?.due_date ? new Date(task.due_date) : undefined
  );

  const canAssignTasks = userProfile?.role === 'instructor' || userProfile?.role === 'command_staff';
  const isEditingAssignedTask = mode === 'edit' && task?.assigned_to === userProfile?.id;

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      assigned_to: task?.assigned_to || '',
      priority: task?.priority || 'medium',
      status: task?.status || 'not_started',
    },
  });

  const onSubmit = (data: TaskFormData) => {
    const taskData = {
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      assigned_to: data.assigned_to || null,
      due_date: selectedDate ? selectedDate.toISOString() : null,
      team_id: null,
    };

    if (mode === 'create') {
      createTask(taskData);
    } else if (task) {
      updateTask({ id: task.id, ...taskData });
    }
    
    onOpenChange(false);
    form.reset();
    setSelectedDate(undefined);
  };

  const getDialogTitle = () => {
    if (mode === 'create') {
      return 'Create New Task';
    }
    if (task?.task_number) {
      return `${task.task_number} - ${task.title}`;
    }
    return `${task.task_number} - ${task.title}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Fill in the details to create a new task.'
              : 'Update the task details below.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Name *</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Enter task name (max 150 characters)"
              maxLength={150}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>

          {canAssignTasks && (
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Select value={form.watch('assigned_to')} onValueChange={(value) => form.setValue('assigned_to', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Task Details</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter detailed description of the task"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={form.watch('priority')} onValueChange={(value) => form.setValue('priority', value as any)}>
                <SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={form.watch('status')} 
                onValueChange={(value) => form.setValue('status', value as any)}
                disabled={!canAssignTasks && !isEditingAssignedTask}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="working_on_it">Working On It</SelectItem>
                  <SelectItem value="stuck">Stuck</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Select due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {mode === 'create' ? 'Create Task' : 'Update Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
