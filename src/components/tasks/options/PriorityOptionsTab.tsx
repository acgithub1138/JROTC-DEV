
import React, { useState } from 'react';
import { useTaskPriorityOptions } from '@/hooks/useTaskOptions';
import { usePermissionContext } from '@/contexts/PermissionContext';
import { OptionDialog } from './OptionDialog';
import { OptionsTable } from './OptionsTable';

interface OptionFormData {
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}

interface PriorityOptionsTabProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

export const PriorityOptionsTab: React.FC<PriorityOptionsTabProps> = ({ isDialogOpen, setIsDialogOpen }) => {
  const { priorityOptions, createPriorityOption, updatePriorityOption, deletePriorityOption } = useTaskPriorityOptions();
  const { hasPermission } = usePermissionContext();
  const [editingPriority, setEditingPriority] = useState<any>(null);
  const [priorityForm, setPriorityForm] = useState<OptionFormData>({
    value: '',
    label: '',
    color_class: 'bg-gray-100 text-gray-800',
    sort_order: 0,
    is_active: true
  });

  const canUpdate = hasPermission('task_priority', 'update');
  const canDelete = hasPermission('task_priority', 'delete');

  const handlePrioritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPriority) {
      updatePriorityOption({ ...priorityForm, id: editingPriority.id });
    } else {
      createPriorityOption(priorityForm);
    }
    setIsDialogOpen(false);
    setEditingPriority(null);
    setPriorityForm({ value: '', label: '', color_class: 'bg-gray-100 text-gray-800', sort_order: 0, is_active: true });
  };

  const editPriority = (priority: any) => {
    setEditingPriority(priority);
    setPriorityForm({
      value: priority.value,
      label: priority.label,
      color_class: priority.color_class,
      sort_order: priority.sort_order,
      is_active: priority.is_active
    });
    setIsDialogOpen(true);
  };

  React.useEffect(() => {
    if (isDialogOpen && !editingPriority) {
      setPriorityForm({ 
        value: '', 
        label: '', 
        color_class: 'bg-gray-100 text-gray-800', 
        sort_order: priorityOptions.length + 1, 
        is_active: true 
      });
    }
  }, [isDialogOpen, editingPriority, priorityOptions.length]);

  return (
    <div className="space-y-4">
      <OptionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formData={priorityForm}
        setFormData={setPriorityForm}
        onSubmit={handlePrioritySubmit}
        isEditing={!!editingPriority}
        type="priority"
      />
      <OptionsTable
        options={priorityOptions}
        onEdit={canUpdate ? editPriority : undefined}
        onDelete={canDelete ? deletePriorityOption : undefined}
      />
    </div>
  );
};
