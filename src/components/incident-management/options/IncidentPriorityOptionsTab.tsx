import React, { useState } from 'react';
import { useIncidentPriorityOptions } from '@/hooks/incidents/useIncidentOptions';
import { OptionDialog } from '@/components/tasks/options/OptionDialog';
import { OptionsTable } from '@/components/tasks/options/OptionsTable';
import { usePermissionContext } from '@/contexts/PermissionContext';

interface OptionFormData {
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}

interface IncidentPriorityOptionsTabProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

export const IncidentPriorityOptionsTab: React.FC<IncidentPriorityOptionsTabProps> = ({ isDialogOpen, setIsDialogOpen }) => {
  const { priorityOptions, createPriorityOption, updatePriorityOption, deletePriorityOption } = useIncidentPriorityOptions();
  const { hasPermission } = usePermissionContext();
  const [editingPriority, setEditingPriority] = useState<any>(null);
  const [priorityForm, setPriorityForm] = useState<OptionFormData>({
    value: '',
    label: '',
    color_class: 'bg-gray-100 text-gray-800',
    sort_order: 0,
    is_active: true
  });

  const canUpdate = hasPermission('incident_priority', 'update');
  const canDelete = hasPermission('incident_priority', 'delete');

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
        type="incident priority"
      />
      <OptionsTable
        options={priorityOptions}
        onEdit={canUpdate ? editPriority : undefined}
        onDelete={canDelete ? deletePriorityOption : undefined}
      />
    </div>
  );
};