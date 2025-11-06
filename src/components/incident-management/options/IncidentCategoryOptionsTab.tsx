import React, { useState } from 'react';
import { useIncidentCategoryOptions } from '@/hooks/incidents/useIncidentOptions';
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

export const IncidentCategoryOptionsTab: React.FC = () => {
  const { categoryOptions, createCategoryOption, updateCategoryOption, deleteCategoryOption } = useIncidentCategoryOptions();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState<OptionFormData>({
    value: '',
    label: '',
    color_class: 'bg-gray-100 text-gray-800',
    sort_order: 0,
    is_active: true
  });

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryOption({ ...categoryForm, id: editingCategory.id });
    } else {
      createCategoryOption(categoryForm);
    }
    setCategoryDialogOpen(false);
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
    setCategoryDialogOpen(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ 
      value: '', 
      label: '', 
      color_class: 'bg-gray-100 text-gray-800', 
      sort_order: categoryOptions.length + 1, 
      is_active: true 
    });
    setCategoryDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Incident Category Options</h3>
        <Button onClick={handleAddCategory}>
          <Plus className="w-4 h-4 mr-2" />
          Add incident category
        </Button>
      </div>
      <OptionDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        formData={categoryForm}
        setFormData={setCategoryForm}
        onSubmit={handleCategorySubmit}
        isEditing={!!editingCategory}
        type="incident category"
      />
      <OptionsTable
        options={categoryOptions}
        onEdit={editCategory}
        onDelete={deleteCategoryOption}
      />
    </div>
  );
};