import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useSubtasks } from '@/hooks/useSubtasks';
import { useTaskStatusOptions, useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { useSchoolUsers } from '@/hooks/useSchoolUsers';

interface CreateSubtaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentTaskId: string;
  parentTaskTitle: string;
}

export const CreateSubtaskDialog: React.FC<CreateSubtaskDialogProps> = ({
  isOpen,
  onClose,
  parentTaskId,
  parentTaskTitle,
}) => {
  const { createSubtask } = useSubtasks();
  const { statusOptions } = useTaskStatusOptions();
  const { priorityOptions } = useTaskPriorityOptions();
  const { users } = useSchoolUsers(true); // Only fetch active users

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    assigned_to: '',
    due_date: null as Date | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createSubtask({
      parent_task_id: parentTaskId,
      title: formData.title,
      description: formData.description || null,
      status: formData.status,
      priority: formData.priority,
      assigned_to: formData.assigned_to === 'unassigned' ? null : formData.assigned_to || null,
      due_date: formData.due_date?.toISOString() || null,
    });

    // Reset form and close dialog
    setFormData({
      title: '',
      description: '',
      status: 'open',
      priority: 'medium',
      assigned_to: '',
      due_date: null,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Subtask for: {parentTaskTitle}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter subtask title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter subtask description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Assigned To</Label>
              <Select
                value={formData.assigned_to}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users
                    .sort((a, b) => a.last_name.localeCompare(b.last_name))
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.last_name}, {user.first_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={formData.due_date ? format(formData.due_date, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const dateValue = e.target.value;
                  if (dateValue) {
                    // Create date object from input value with validation
                    const date = new Date(dateValue + 'T00:00:00');
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);
                    
                    if (date >= tomorrow) {
                      setFormData({ ...formData, due_date: date });
                    }
                  } else {
                    setFormData({ ...formData, due_date: null });
                  }
                }}
                min={(() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return format(tomorrow, 'yyyy-MM-dd');
                })()}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Subtask</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};