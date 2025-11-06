import React, { useState } from 'react';
import { useIncidentStatusOptions } from '@/hooks/incidents/useIncidentOptions';
import { OptionDialog } from '@/components/tasks/options/OptionDialog';
import { OptionsTable } from '@/components/tasks/options/OptionsTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface OptionFormData {
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}

export const IncidentStatusOptionsTab: React.FC = () => {
  const { statusOptions, createStatusOption, updateStatusOption, deleteStatusOption } = useIncidentStatusOptions();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any>(null);
  const [statusForm, setStatusForm] = useState<OptionFormData>({
    value: '',
    label: '',
    color_class: 'bg-gray-100 text-gray-800',
    sort_order: 0,
    is_active: true
  });

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
    setStatusDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Incident Status Options</h3>
        <Button onClick={handleAddStatus}>
          <Plus className="w-4 h-4 mr-2" />
          Add incident status
        </Button>
      </div>
      <OptionDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        formData={statusForm}
        setFormData={setStatusForm}
        onSubmit={handleStatusSubmit}
        isEditing={!!editingStatus}
        type="incident status"
      />
      <OptionsTable
        options={statusOptions}
        onEdit={editStatus}
        onDelete={deleteStatusOption}
      />
    </div>
  );
};