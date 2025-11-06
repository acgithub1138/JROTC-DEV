import React, { useState } from 'react';
import { useIncidentPriorityOptions } from '@/hooks/incidents/useIncidentOptions';
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

export const IncidentPriorityOptionsTab: React.FC = () => {
  const { priorityOptions, createPriorityOption, updatePriorityOption, deletePriorityOption } = useIncidentPriorityOptions();
  const [priorityDialogOpen, setPriorityDialogOpen] = useState(false);
  const [editingPriority, setEditingPriority] = useState<any>(null);
  const [priorityForm, setPriorityForm] = useState<OptionFormData>({
    value: '',
    label: '',
    color_class: 'bg-gray-100 text-gray-800',
    sort_order: 0,
    is_active: true
  });

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
    setPriorityDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Incident Priority Options</h3>
        <Button onClick={handleAddPriority}>
          <Plus className="w-4 h-4 mr-2" />
          Add incident priority
        </Button>
      </div>
      <OptionDialog
        open={priorityDialogOpen}
        onOpenChange={setPriorityDialogOpen}
        formData={priorityForm}
        setFormData={setPriorityForm}
        onSubmit={handlePrioritySubmit}
        isEditing={!!editingPriority}
        type="incident priority"
      />
      <OptionsTable
        options={priorityOptions}
        onEdit={editPriority}
        onDelete={deletePriorityOption}
      />
    </div>
  );
};