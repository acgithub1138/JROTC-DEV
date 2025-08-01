import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { OptionForm } from './OptionForm';
interface OptionFormData {
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}
interface OptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: OptionFormData;
  setFormData: (data: OptionFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  type: 'status' | 'priority' | 'incident status' | 'incident priority' | 'incident category';
  optionsLength: number;
  onAddClick: () => void;
}
export const OptionDialog: React.FC<OptionDialogProps> = ({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isEditing,
  type,
  optionsLength,
  onAddClick
}) => {
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={onAddClick}>
          <Plus className="w-4 h-4 mr-2" />
          Add {type}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit ${type}` : `Add New ${type}`}
          </DialogTitle>
          <DialogDescription>
            Configure the {type} option for tasks
          </DialogDescription>
        </DialogHeader>
        <OptionForm formData={formData} setFormData={setFormData} onSubmit={onSubmit} isEditing={isEditing} type={type} />
      </DialogContent>
    </Dialog>;
};