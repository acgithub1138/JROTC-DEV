
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TaskDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  taskDescription: string | null;
}

export const TaskDescriptionModal: React.FC<TaskDescriptionModalProps> = ({
  isOpen,
  onClose,
  taskTitle,
  taskDescription,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Task Description</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{taskTitle}</h3>
          </div>
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Description:</h4>
            <div className="text-gray-700 whitespace-pre-wrap">
              {taskDescription || 'No description provided'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
