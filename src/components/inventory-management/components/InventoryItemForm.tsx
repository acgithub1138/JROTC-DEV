import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { MultiSelectProfiles } from './MultiSelectProfiles';
import { CategorySelect } from './CategorySelect';
import { useInventoryCategories } from '../hooks/useInventoryCategories';
import type { Tables } from '@/integrations/supabase/types';

interface InventoryItemFormData {
  item_id?: string;
  item: string;
  category?: string;
  sub_category?: string;
  size?: string;
  gender?: 'M' | 'F' | null;
  qty_total: number;
  qty_issued: number;
  issued_to?: string[];
  stock_number?: string;
  unit_of_measure?: 'EA' | 'PR' | null;
  has_serial_number: boolean;
  model_number?: string;
  returnable: boolean;
  accountable: boolean;
  pending_updates: number;
  pending_issue_changes: number;
  pending_write_offs: number;
  location?: string;
  notes?: string;
}

interface InventoryItemFormProps {
  initialData?: Tables<'inventory_items'> | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  onDataChange?: (data: any) => void;
  readOnly?: boolean;
}

export const InventoryItemForm: React.FC<InventoryItemFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  onDataChange,
  readOnly = false,
}) => {
  const { categories, subCategories, isCategoriesLoading, isSubCategoriesLoading, getSubCategoriesForCategory } = useInventoryCategories();
  const [filteredSubCategories, setFilteredSubCategories] = useState<string[]>([]);
  const [isIssuedToOpen, setIsIssuedToOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InventoryItemFormData>({
    defaultValues: initialData ? {
      item_id: initialData.item_id || '',
      item: initialData.item || '',
      category: initialData.category || '',
      sub_category: initialData.sub_category || '',
      size: initialData.size || '',
      gender: (initialData.gender as 'M' | 'F') || null,
      qty_total: initialData.qty_total || 0,
      qty_issued: initialData.qty_issued || 0,
      issued_to: initialData.issued_to || [],
      stock_number: initialData.stock_number || '',
      unit_of_measure: (initialData.unit_of_measure as 'EA' | 'PR') || null,
      has_serial_number: initialData.has_serial_number || false,
      model_number: initialData.model_number || '',
      returnable: initialData.returnable || false,
      accountable: initialData.accountable || false,
      pending_updates: initialData.pending_updates || 0,
      pending_issue_changes: initialData.pending_issue_changes || 0,
      pending_write_offs: initialData.pending_write_offs || 0,
      location: initialData.location || '',
      notes: initialData.notes || '',
    } : {
      item: '',
      qty_total: 0,
      qty_issued: 0,
      has_serial_number: false,
      returnable: false,
      accountable: false,
      pending_updates: 0,
      pending_issue_changes: 0,
      pending_write_offs: 0,
      issued_to: [],
    },
  });

  const watchedValues = watch();

  // Notify parent of data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(watchedValues);
    }
  }, [watchedValues, onDataChange]);

  // Update filtered subcategories when category changes
  useEffect(() => {
    const updateSubCategories = async () => {
      if (watchedValues.category) {
        const subCats = await getSubCategoriesForCategory(watchedValues.category);
        setFilteredSubCategories(subCats);
      } else {
        setFilteredSubCategories(subCategories);
      }
    };
    
    updateSubCategories();
  }, [watchedValues.category, subCategories, getSubCategoriesForCategory]);

  const handleCategoryChange = (category: string) => {
    setValue('category', category);
    // Clear sub_category when category changes
    setValue('sub_category', '');
  };

  const handleFormSubmit = async (data: InventoryItemFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="item_id">Item ID *</Label>
          <Input
            id="item_id"
            {...register('item_id')}
            placeholder="Enter item ID"
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="item">Item *</Label>
          <Input
            id="item"
            {...register('item', { required: 'Item name is required' })}
            placeholder="Enter item name"
            disabled={readOnly}
          />
          {errors.item && (
            <span className="text-sm text-red-500">{errors.item.message}</span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <CategorySelect
            value={watchedValues.category}
            onValueChange={handleCategoryChange}
            options={categories}
            placeholder="Select category"
            isLoading={isCategoriesLoading}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sub_category">Sub Category</Label>
          <CategorySelect
            value={watchedValues.sub_category}
            onValueChange={(value) => setValue('sub_category', value)}
            options={filteredSubCategories}
            placeholder="Select sub category"
            isLoading={isSubCategoriesLoading}
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="size">Size</Label>
          <Input
            id="size"
            {...register('size')}
            placeholder="Enter size"
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={watchedValues.gender || undefined}
            onValueChange={(value) => setValue('gender', value as 'M' | 'F')}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">M</SelectItem>
              <SelectItem value="F">F</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qty_total">Total Quantity</Label>
          <Input
            id="qty_total"
            type="number"
            {...register('qty_total', { 
              min: { value: 0, message: 'Quantity must be non-negative' }
            })}
            placeholder="0"
            disabled={readOnly}
          />
          {errors.qty_total && (
            <span className="text-sm text-red-500">{errors.qty_total.message}</span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="qty_issued">Issued Quantity</Label>
          <Input
            id="qty_issued"
            type="number"
            {...register('qty_issued', { 
              min: { value: 0, message: 'Quantity must be non-negative' }
            })}
            placeholder="0"
            disabled={readOnly}
          />
          {errors.qty_issued && (
            <span className="text-sm text-red-500">{errors.qty_issued.message}</span>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_number">Stock Number</Label>
          <Input
            id="stock_number"
            {...register('stock_number')}
            placeholder="Enter stock number"
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_of_measure">Unit of Measure</Label>
          <Select
            value={watchedValues.unit_of_measure || undefined}
            onValueChange={(value) => setValue('unit_of_measure', value as 'EA' | 'PR')}
            disabled={readOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EA">EA</SelectItem>
              <SelectItem value="PR">PR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            {...register('location')}
            placeholder="Enter location"
            disabled={readOnly}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="has_serial_number"
            checked={watchedValues.has_serial_number}
            onCheckedChange={(checked) => setValue('has_serial_number', !!checked)}
            disabled={readOnly}
          />
          <Label htmlFor="has_serial_number">Has Serial Number</Label>
        </div>

        {watchedValues.has_serial_number && (
          <div className="space-y-2">
            <Label htmlFor="model_number">Model Number</Label>
            <Input
              id="model_number"
              {...register('model_number')}
              placeholder="Enter model number"
              disabled={readOnly}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Collapsible open={isIssuedToOpen} onOpenChange={setIsIssuedToOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0 h-auto">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <Label className="cursor-pointer">Issued To</Label>
                {watchedValues.issued_to && watchedValues.issued_to.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    ({watchedValues.issued_to.length} selected)
                  </span>
                )}
              </div>
              {isIssuedToOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <MultiSelectProfiles
              value={watchedValues.issued_to || []}
              onChange={(value) => setValue('issued_to', value)}
              disabled={readOnly}
            />
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="returnable"
            checked={watchedValues.returnable}
            onCheckedChange={(checked) => setValue('returnable', !!checked)}
            disabled={readOnly}
          />
          <Label htmlFor="returnable">Returnable</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="accountable"
            checked={watchedValues.accountable}
            onCheckedChange={(checked) => setValue('accountable', !!checked)}
            disabled={readOnly}
          />
          <Label htmlFor="accountable">Accountable</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pending_updates">Pending Updates</Label>
          <Input
            id="pending_updates"
            type="number"
            {...register('pending_updates', { min: 0 })}
            placeholder="0"
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pending_issue_changes">Pending Issue Changes</Label>
          <Input
            id="pending_issue_changes"
            type="number"
            {...register('pending_issue_changes', { min: 0 })}
            placeholder="0"
            disabled={readOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pending_write_offs">Pending Write-offs</Label>
          <Input
            id="pending_write_offs"
            type="number"
            {...register('pending_write_offs', { min: 0 })}
            placeholder="0"
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          placeholder="Enter notes"
          rows={2}
          disabled={readOnly}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {readOnly ? 'Close' : 'Cancel'}
        </Button>
        {!readOnly && (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : initialData ? 'Update Item' : 'Add Item'}
          </Button>
        )}
      </div>
    </form>
  );
};