
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';

interface OptionFormData {
  value: string;
  label: string;
  color_class: string;
  sort_order: number;
  is_active: boolean;
}

interface OptionFormProps {
  formData: OptionFormData;
  setFormData: (data: OptionFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
  type: 'status' | 'priority' | 'incident status' | 'incident priority' | 'incident category';
}

const colorOptions = [
  { value: 'bg-gray-100 text-gray-800', label: 'Gray' },
  { value: 'bg-blue-100 text-blue-800', label: 'Blue' },
  { value: 'bg-green-100 text-green-800', label: 'Green' },
  { value: 'bg-yellow-100 text-yellow-800', label: 'Yellow' },
  { value: 'bg-orange-100 text-orange-800', label: 'Orange' },
  { value: 'bg-red-100 text-red-800', label: 'Red' },
  { value: 'bg-purple-100 text-purple-800', label: 'Purple' },
];

export const OptionForm: React.FC<OptionFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  isEditing,
  type
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor={`${type}-value`}>Value</Label>
        <Input
          id={`${type}-value`}
          value={formData.value}
          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
          placeholder={`e.g., ${type === 'status' ? 'in_progress' : 'high'}`}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${type}-label`}>Label</Label>
        <Input
          id={`${type}-label`}
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder={`e.g., ${type === 'status' ? 'In Progress' : 'High'}`}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${type}-color`}>Color</Label>
        <select
          id={`${type}-color`}
          value={formData.color_class}
          onChange={(e) => setFormData({ ...formData, color_class: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          {colorOptions.map((color) => (
            <option key={color.value} value={color.value}>
              {color.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={`${type}-sort`}>Sort Order</Label>
        <Input
          id={`${type}-sort`}
          type="number"
          value={formData.sort_order}
          onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
          required
        />
      </div>
      <DialogFooter>
        <Button type="submit">{isEditing ? 'Update' : 'Create'}</Button>
      </DialogFooter>
    </form>
  );
};
