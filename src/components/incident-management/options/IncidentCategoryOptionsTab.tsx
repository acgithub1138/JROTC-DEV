import React, { useState } from 'react';
import { useIncidentCategoryOptions } from '@/hooks/incidents/useIncidentOptions';
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

interface IncidentCategoryOptionsTabProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
}

export const IncidentCategoryOptionsTab: React.FC<IncidentCategoryOptionsTabProps> = ({ isDialogOpen, setIsDialogOpen }) => {
  const { categoryOptions, createCategoryOption, updateCategoryOption, deleteCategoryOption } = useIncidentCategoryOptions();
  const { hasPermission } = usePermissionContext();
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState<OptionFormData>({
    value: '',
    label: '',
    color_class: 'bg-gray-100 text-gray-800',
    sort_order: 0,
    is_active: true
  });

  const canUpdate = hasPermission('incident_category', 'update');
  const canDelete = hasPermission('incident_category', 'delete');

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryOption({ ...categoryForm, id: editingCategory.id });
    } else {
      createCategoryOption(categoryForm);
    }
    setIsDialogOpen(false);
    setEditingCategory(null);
    setCategoryForm({ value: '', label: '', color_class: 'bg-gray-100 text-gray-800', sort_order: 0, is_active: true });
  };

  const editCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      value: category.value,
      label: category.label,
      color_class: category.color_class,
      sort_order: category.sort_order,
      is_active: category.is_active
    });
    setIsDialogOpen(true);
  };

  React.useEffect(() => {
    if (isDialogOpen && !editingCategory) {
      setCategoryForm({ 
        value: '', 
        label: '', 
        color_class: 'bg-gray-100 text-gray-800', 
        sort_order: categoryOptions.length + 1, 
        is_active: true 
      });
    }
  }, [isDialogOpen, editingCategory, categoryOptions.length]);

  return (
    <div className="space-y-4">
      <OptionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formData={categoryForm}
        setFormData={setCategoryForm}
        onSubmit={handleCategorySubmit}
        isEditing={!!editingCategory}
        type="incident category"
      />
      <OptionsTable
        options={categoryOptions}
        onEdit={canUpdate ? editCategory : undefined}
        onDelete={canDelete ? deleteCategoryOption : undefined}
      />
    </div>
  );
};