
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

export const PriorityOptionsTab: React.FC = () => {
  const { priorityOptions, createPriorityOption, updatePriorityOption, deletePriorityOption } = useTaskPriorityOptions();
  const { hasPermission } = usePermissionContext();
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<any>(null);
  const [priorityForm, setPriorityForm] = useState<OptionFormData>({
    value: '',
    label: '',
    color_class: 'bg-gray-100 text-gray-800',
    sort_order: 0,
    is_active: true
  });

  const canCreate = hasPermission('task_priority_options', 'create');
  const canUpdate = hasPermission('task_priority_options', 'update');
  const canDelete = hasPermission('task_priority_options', 'delete');

  const handlePrioritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPriority) {
      updatePriorityOption({ ...priorityForm, id: editingPriority.id });
    } else {
      createPriorityOption(priorityForm);
    }
    setPriorityDialogOpen(false);
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
    setPriorityDialogOpen(true);
  };

  const handleAddPriority = () => {
    setEditingPriority(null);
    setPriorityForm({ 
      value: '', 
      label: '', 
      color_class: 'bg-gray-100 text-gray-800', 
      sort_order: priorityOptions.length + 1, 
      is_active: true 
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Priority Options</h3>
        {canCreate && (
          <OptionDialog
            open={priorityDialogOpen}
            onOpenChange={setPriorityDialogOpen}
            formData={priorityForm}
            setFormData={setPriorityForm}
            onSubmit={handlePrioritySubmit}
            isEditing={!!editingPriority}
            type="priority"
            optionsLength={priorityOptions.length}
            onAddClick={handleAddPriority}
          />
        )}
      </div>
      <OptionsTable
        options={priorityOptions}
        onEdit={canUpdate ? editPriority : undefined}
        onDelete={canDelete ? deletePriorityOption : undefined}
      />
    </div>
  );
};
