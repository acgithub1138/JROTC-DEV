import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useInventoryItems } from './hooks/useInventoryItems';
import { useInventoryCategories } from './hooks/useInventoryCategories';
import { MultiSelectProfiles } from './components/MultiSelectProfiles';
import { CategorySelect } from './components/CategorySelect';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Tables } from '@/integrations/supabase/types';

interface InventoryFormData {
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

type InventoryRecordMode = 'create' | 'edit' | 'view';

export const InventoryRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Extract mode and record ID from URL parameters
  const mode = (searchParams.get('mode') as InventoryRecordMode) || 'view';
  const recordId = searchParams.get('id');
  
  // Permissions
  const { canCreate, canEdit, canView } = useTablePermissions('inventory');
  
  // Data hooks
  const { inventoryItems, createItem, updateItem, isLoading } = useInventoryItems();
  const { categories, subCategories, isCategoriesLoading, isSubCategoriesLoading, getSubCategoriesForCategory } = useInventoryCategories();
  
  // Find current record
  const currentRecord = recordId && inventoryItems ? inventoryItems.find(item => item.id === recordId) : null;
  
  // Local state
  const [currentMode, setCurrentMode] = useState<InventoryRecordMode>(mode);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredSubCategories, setFilteredSubCategories] = useState<string[]>([]);
  const [isIssuedToOpen, setIsIssuedToOpen] = useState(false);
  
  // Form setup
  const defaultValues = currentRecord ? {
    item_id: currentRecord.item_id || '',
    item: currentRecord.item || '',
    category: currentRecord.category || '',
    sub_category: currentRecord.sub_category || '',
    size: currentRecord.size || '',
    gender: (currentRecord.gender as 'M' | 'F') || null,
    qty_total: currentRecord.qty_total || 0,
    qty_issued: currentRecord.qty_issued || 0,
    issued_to: currentRecord.issued_to || [],
    stock_number: currentRecord.stock_number || '',
    unit_of_measure: (currentRecord.unit_of_measure as 'EA' | 'PR') || null,
    has_serial_number: currentRecord.has_serial_number || false,
    model_number: currentRecord.model_number || '',
    returnable: currentRecord.returnable || false,
    accountable: currentRecord.accountable || false,
    pending_updates: currentRecord.pending_updates || 0,
    pending_issue_changes: currentRecord.pending_issue_changes || 0,
    pending_write_offs: currentRecord.pending_write_offs || 0,
    location: currentRecord.location || '',
    notes: currentRecord.notes || '',
  } : {
    item_id: '',
    item: '',
    category: '',
    sub_category: '',
    size: '',
    gender: null,
    qty_total: 0,
    qty_issued: 0,
    issued_to: [],
    stock_number: '',
    unit_of_measure: null,
    has_serial_number: false,
    model_number: '',
    returnable: false,
    accountable: false,
    pending_updates: 0,
    pending_issue_changes: 0,
    pending_write_offs: 0,
    location: '',
    notes: '',
  };

  const form = useForm<InventoryFormData>({
    defaultValues
  });

  // Unsaved changes detection
  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges({
    initialData: defaultValues,
    currentData: form.watch(),
    enabled: currentMode !== 'view'
  });

  // Update currentMode when URL mode changes
  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  // Reset form when record changes
  useEffect(() => {
    if (currentRecord) {
      const newDefaults = {
        item_id: currentRecord.item_id || '',
        item: currentRecord.item || '',
        category: currentRecord.category || '',
        sub_category: currentRecord.sub_category || '',
        size: currentRecord.size || '',
        gender: (currentRecord.gender as 'M' | 'F') || null,
        qty_total: currentRecord.qty_total || 0,
        qty_issued: currentRecord.qty_issued || 0,
        issued_to: currentRecord.issued_to || [],
        stock_number: currentRecord.stock_number || '',
        unit_of_measure: (currentRecord.unit_of_measure as 'EA' | 'PR') || null,
        has_serial_number: currentRecord.has_serial_number || false,
        model_number: currentRecord.model_number || '',
        returnable: currentRecord.returnable || false,
        accountable: currentRecord.accountable || false,
        pending_updates: currentRecord.pending_updates || 0,
        pending_issue_changes: currentRecord.pending_issue_changes || 0,
        pending_write_offs: currentRecord.pending_write_offs || 0,
        location: currentRecord.location || '',
        notes: currentRecord.notes || '',
      };
      form.reset(newDefaults);
      resetChanges();
    }
  }, [currentRecord, form, resetChanges]);

  // Update filtered subcategories when category changes
  useEffect(() => {
    const updateSubCategories = async () => {
      const categoryValue = form.watch('category');
      if (categoryValue) {
        const subCats = await getSubCategoriesForCategory(categoryValue);
        setFilteredSubCategories(subCats);
      } else {
        setFilteredSubCategories(subCategories);
      }
    };
    
    updateSubCategories();
  }, [form.watch('category'), subCategories, getSubCategoriesForCategory]);

  // Permission checks
  useEffect(() => {
    if (currentMode === 'create' && !canCreate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create inventory items.",
        variant: "destructive"
      });
      navigate('/app/inventory');
      return;
    }
    
    if (currentMode === 'view' && !canView) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view inventory items.",
        variant: "destructive"
      });
      navigate('/app/inventory');
      return;
    }
    
    if (currentMode === 'edit' && !canEdit) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit inventory items.",
        variant: "destructive"
      });
      setCurrentMode('view');
      return;
    }

    // If record not found but we need one
    if ((currentMode === 'view' || currentMode === 'edit') && recordId && !currentRecord && !isLoading) {
      toast({
        title: "Inventory Item Not Found",
        description: "The requested inventory item could not be found.",
        variant: "destructive"
      });
      navigate('/app/inventory');
      return;
    }
  }, [currentMode, canCreate, canEdit, canView, currentRecord, recordId, navigate, toast, isLoading]);

  // Handle navigation
  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/app/inventory');
    }
  };

  const handleEdit = () => {
    if (recordId) {
      setCurrentMode('edit');
      navigate(`/app/inventory/inventory_record?mode=edit&id=${recordId}`);
    }
  };

  const handleView = () => {
    if (recordId) {
      setCurrentMode('view');
      navigate(`/app/inventory/inventory_record?id=${recordId}`);
    }
  };

  // Handle form submission
  const handleSubmit = async (data: InventoryFormData) => {
    try {
      setIsSubmitting(true);

      if (currentMode === 'create') {
        await createItem(data);
        toast({
          title: "Inventory Item Added",
          description: "Inventory item has been created successfully."
        });
        navigate('/app/inventory');
      } else if (currentMode === 'edit' && recordId) {
        await updateItem({ id: recordId, ...data });
        toast({
          title: "Inventory Item Updated",
          description: "Inventory item has been updated successfully."
        });
        navigate('/app/inventory');
      }
      
      resetChanges();
    } catch (error) {
      console.error(`Error ${currentMode === 'create' ? 'creating' : 'updating'} inventory item:`, error);
      toast({
        title: "Error",
        description: `Failed to ${currentMode === 'create' ? 'create' : 'update'} inventory item. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle unsaved changes dialog
  const handleDiscardChanges = () => {
    form.reset();
    resetChanges();
    setShowUnsavedDialog(false);
    navigate('/app/inventory');
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    form.setValue('category', category);
    form.setValue('sub_category', '');
  };

  // Get page title
  const getPageTitle = () => {
    switch (currentMode) {
      case 'create':
        return 'Add Inventory Item';
      case 'edit':
        return `Edit Item: ${currentRecord?.item || 'N/A'}`;
      case 'view':
        return `Item: ${currentRecord?.item || 'N/A'}`;
      default:
        return 'Inventory Item';
    }
  };

  const isFormMode = currentMode === 'create' || currentMode === 'edit';

  return (
    <>
      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden min-w-0">
        {/* Mobile: Back button above header */}
        {isMobile && (
          <Button variant="ghost" size="sm" onClick={handleBack} className="w-fit -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Desktop: Back button + Title side by side */}
          <div className="flex items-center gap-4">
            {!isMobile && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Inventory
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{getPageTitle()}</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Inventory → {getPageTitle()}
              </p>
            </div>
          </div>
          
          {/* Desktop: Action buttons on the right */}
          {!isMobile && currentMode === 'view' && canEdit && (
            <Button onClick={handleEdit}>
              Edit Item
            </Button>
          )}
        </div>

        {/* Mobile: Action buttons below header */}
        {isMobile && (
          <>
            {currentMode === 'view' && canEdit && (
              <Button onClick={handleEdit} className="w-full">
                Edit Item
              </Button>
            )}
            {isFormMode && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={form.handleSubmit(handleSubmit)} 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Saving...' : 
                   currentMode === 'create' ? 'Add Item' : 'Update Item'}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Form/View Content */}
        <div className="max-w-4xl mx-auto">
          <Card>
          <CardHeader>
            <CardTitle>
              {currentMode === 'create' ? 'Add New Inventory Item' : 'Inventory Item Details'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isFormMode ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="item_id"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Item ID</FormLabel>
                          <div className="flex-1 min-w-0">
                            <FormControl>
                              <Input placeholder="Enter item ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="item"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Item *</FormLabel>
                          <div className="flex-1 min-w-0">
                            <FormControl>
                              <Input placeholder="Enter item name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Category</FormLabel>
                          <div className="flex-1 min-w-0">
                            <CategorySelect
                              value={field.value}
                              onValueChange={handleCategoryChange}
                              options={categories}
                              placeholder="Select category"
                              isLoading={isCategoriesLoading}
                            />
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sub_category"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Sub Category</FormLabel>
                          <div className="flex-1 min-w-0">
                            <CategorySelect
                              value={field.value}
                              onValueChange={field.onChange}
                              options={filteredSubCategories}
                              placeholder="Select sub category"
                              isLoading={isSubCategoriesLoading}
                            />
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Size</FormLabel>
                          <div className="flex-1 min-w-0">
                            <FormControl>
                              <Input placeholder="Enter size" {...field} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Gender</FormLabel>
                          <div className="flex-1 min-w-0">
                            <Select value={field.value || undefined} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="M">M</SelectItem>
                                <SelectItem value="F">F</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Quantities and Stock */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="qty_total"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Total Qty</FormLabel>
                          <div className="flex-1 min-w-0">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="qty_issued"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Issued Qty</FormLabel>
                          <div className="flex-1 min-w-0">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock_number"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Stock Number</FormLabel>
                          <div className="flex-1 min-w-0">
                            <FormControl>
                              <Input placeholder="Enter stock number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unit_of_measure"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Unit</FormLabel>
                          <div className="flex-1 min-w-0">
                            <Select value={field.value || undefined} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="EA">EA</SelectItem>
                                <SelectItem value="PR">PR</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Location</FormLabel>
                          <div className="flex-1 min-w-0">
                            <FormControl>
                              <Input placeholder="Enter location" {...field} />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="has_serial_number"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Serial Number</FormLabel>
                          <div className="flex-1 flex items-center space-x-2 min-w-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm">Has Serial Number</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {form.watch('has_serial_number') && (
                      <FormField
                        control={form.control}
                        name="model_number"
                        render={({ field }) => (
                          <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Model Number</FormLabel>
                            <div className="flex-1 min-w-0">
                              <FormControl>
                                <Input placeholder="Enter model number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="returnable"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Returnable</FormLabel>
                          <div className="flex-1 flex items-center space-x-2 min-w-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm">Returnable</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountable"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Accountable</FormLabel>
                          <div className="flex-1 flex items-center space-x-2 min-w-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm">Accountable</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Issued To Section */}
                  <FormField
                    control={form.control}
                    name="issued_to"
                    render={({ field }) => (
                      <FormItem>
                        <Collapsible open={isIssuedToOpen} onOpenChange={setIsIssuedToOpen}>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="w-full justify-between p-4 h-auto border rounded-md">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <FormLabel className="cursor-pointer">Issued To</FormLabel>
                                {field.value && field.value.length > 0 && (
                                  <span className="text-sm text-muted-foreground">
                                    ({field.value.length} selected)
                                  </span>
                                )}
                              </div>
                              {isIssuedToOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-2 pt-2">
                            <MultiSelectProfiles
                              value={field.value || []}
                              onChange={field.onChange}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      </FormItem>
                    )}
                  />

                  {/* Pending Fields */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    <FormField
                      control={form.control}
                      name="pending_updates"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Pending Updates</FormLabel>
                          <div className="flex-1 min-w-0">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pending_issue_changes"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Pending Issues</FormLabel>
                          <div className="flex-1 min-w-0">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pending_write_offs"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right sm:shrink-0">Pending Write-offs</FormLabel>
                          <div className="flex-1 min-w-0">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <FormLabel className="sm:w-32 sm:text-right sm:shrink-0 sm:mt-2">Notes</FormLabel>
                        <div className="flex-1 min-w-0">
                          <FormControl>
                            <Textarea
                              placeholder="Enter notes"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Desktop: Action buttons at bottom */}
                  {!isMobile && (
                    <div className="flex justify-end gap-2 pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 
                         currentMode === 'create' ? 'Add Item' : 'Update Item'}
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            ) : (
              // View mode
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Item ID</h3>
                    <p className="text-sm">{currentRecord?.item_id || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Item</h3>
                    <p className="text-sm">{currentRecord?.item || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Category</h3>
                    <p className="text-sm">{currentRecord?.category || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Sub Category</h3>
                    <p className="text-sm">{currentRecord?.sub_category || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Size</h3>
                    <p className="text-sm">{currentRecord?.size || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Gender</h3>
                    <p className="text-sm">{currentRecord?.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Total Quantity</h3>
                    <p className="text-sm font-medium">{currentRecord?.qty_total || 0}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Issued Quantity</h3>
                    <p className="text-sm font-medium">{currentRecord?.qty_issued || 0}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Available Quantity</h3>
                    <p className="text-sm font-medium text-green-600">
                      {(currentRecord?.qty_total || 0) - (currentRecord?.qty_issued || 0)}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Location</h3>
                    <p className="text-sm">{currentRecord?.location || 'N/A'}</p>
                  </div>
                </div>
                
                {currentRecord?.notes && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Notes</h3>
                    <p className="text-sm">{currentRecord.notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      </div>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleContinueEditing}
      />
    </>
  );
};