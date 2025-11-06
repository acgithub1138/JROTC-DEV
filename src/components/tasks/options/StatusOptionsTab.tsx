
import React, { useState } from 'react';
import { useTaskStatusOptions } from '@/hooks/useTaskOptions';
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

export const StatusOptionsTab: React.FC = () => {
  const { statusOptions, createStatusOption, updateStatusOption, deleteStatusOption } = useTaskStatusOptions();
  const { hasPermission } = usePermissionContext();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any>(null);
  const [statusForm, setStatusForm] = useState<OptionFormData>({
    value: '',
    label: '',
    color_class: 'bg-gray-100 text-gray-800',
    sort_order: 0,
    is_active: true
  });

  const canCreate = hasPermission('task_status_options', 'create');
  const canUpdate = hasPermission('task_status_options', 'update');
  const canDelete = hasPermission('task_status_options', 'delete');

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStatus) {
      updateStatusOption({ ...statusForm, id: editingStatus.id });
    } else {
      createStatusOption(statusForm);
    }
    setStatusDialogOpen(false);
    setEditingStatus(null);
    setStatusForm({ value: '', label: '', color_class: 'bg-gray-100 text-gray-800', sort_order: 0, is_active: true });
  };

  const editStatus = (status: any) => {
    setEditingStatus(status);
    setStatusForm({
      value: status.value,
      label: status.label,
      color_class: status.color_class,
      sort_order: status.sort_order,
      is_active: status.is_active
    });
    setStatusDialogOpen(true);
  };

  const handleAddStatus = () => {
    setEditingStatus(null);
    setStatusForm({ 
      value: '', 
      label: '', 
      color_class: 'bg-gray-100 text-gray-800', 
      sort_order: statusOptions.length + 1, 
      is_active: true 
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Status Options</h3>
        {canCreate && (
          <OptionDialog
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            formData={statusForm}
            setFormData={setStatusForm}
            onSubmit={handleStatusSubmit}
            isEditing={!!editingStatus}
            type="status"
            optionsLength={statusOptions.length}
            onAddClick={handleAddStatus}
          />
        )}
      </div>
      <OptionsTable
        options={statusOptions}
        onEdit={canUpdate ? editStatus : undefined}
        onDelete={canDelete ? deleteStatusOption : undefined}
      />
    </div>
  );
};
