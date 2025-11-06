import React, { useState } from 'react';
import { useIncidentStatusOptions } from '@/hooks/incidents/useIncidentOptions';
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

interface IncidentStatusOptionsTabProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

export const IncidentStatusOptionsTab: React.FC<IncidentStatusOptionsTabProps> = ({ isDialogOpen, setIsDialogOpen }) => {
  const { statusOptions, createStatusOption, updateStatusOption, deleteStatusOption } = useIncidentStatusOptions();
  const { hasPermission } = usePermissionContext();
  const [editingStatus, setEditingStatus] = useState<any>(null);
  const [statusForm, setStatusForm] = useState<OptionFormData>({
    value: '',
    label: '',
    color_class: 'bg-gray-100 text-gray-800',
    sort_order: 0,
    is_active: true
  });

  const canUpdate = hasPermission('incident_status', 'update');
  const canDelete = hasPermission('incident_status', 'delete');

  const handleStatusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStatus) {
      updateStatusOption({ ...statusForm, id: editingStatus.id });
    } else {
      createStatusOption(statusForm);
    }
    setIsDialogOpen(false);
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
    setIsDialogOpen(true);
  };

  React.useEffect(() => {
    if (isDialogOpen && !editingStatus) {
      setStatusForm({ 
        value: '', 
        label: '', 
        color_class: 'bg-gray-100 text-gray-800', 
        sort_order: statusOptions.length + 1, 
        is_active: true 
      });
    }
  }, [isDialogOpen, editingStatus, statusOptions.length]);

  return (
    <div className="space-y-4">
      <OptionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formData={statusForm}
        setFormData={setStatusForm}
        onSubmit={handleStatusSubmit}
        isEditing={!!editingStatus}
        type="incident status"
      />
      <OptionsTable
        options={statusOptions}
        onEdit={canUpdate ? editStatus : undefined}
        onDelete={canDelete ? deleteStatusOption : undefined}
      />
    </div>
  );
};