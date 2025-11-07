import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTablePermissions } from '@/hooks/useTablePermissions';
import { useBudgetTransactions } from './hooks/useBudgetTransactions';
import { BudgetTransaction } from './BudgetManagementPage';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { AttachmentSection } from '@/components/attachments/AttachmentSection';
import { useAttachments } from '@/hooks/attachments/useAttachments';
import { useSchoolTimezone } from '@/hooks/useSchoolTimezone';
import { convertToUI, convertToUTC } from '@/utils/timezoneUtils';

const incomeSchema = z.object({
  item: z.string().min(1, 'Item is required'),
  type: z.enum(['fundraiser', 'donation', 'other']),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0')
});

type IncomeFormData = z.infer<typeof incomeSchema>;
type BudgetRecordMode = 'create' | 'edit' | 'view';

export const BudgetIncomeRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { timezone } = useSchoolTimezone();
  
  // Extract mode and record ID from URL parameters
  const mode = searchParams.get('mode') as BudgetRecordMode || 'view';
  const recordId = searchParams.get('id');
  
  // Permissions
  const { canCreate, canEdit, canView } = useTablePermissions('budget');
  
  // Data hooks
  const { transactions, createTransaction, updateTransaction, isLoading, isCreating } = useBudgetTransactions({
    search: '',
    category: '',
    type: '',
    paymentMethod: '',
    status: '',
    showArchived: false,
    budgetYear: ''
  });
  
  // Find current record
  const currentRecord = recordId ? transactions.find(t => t.id === recordId) : null;
  
  // Local state
  const [currentMode, setCurrentMode] = useState<BudgetRecordMode>(mode);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  // Initialize attachment hooks for file upload (only when we have a valid record ID)
  const { uploadFile, isUploading } = useAttachments('budget_transaction', recordId || 'temp');
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  
  // Form setup
  const defaultValues = {
    item: currentRecord?.item || '',
    type: (currentRecord?.type as 'fundraiser' | 'donation' | 'other') || 'other' as const,
    description: currentRecord?.description || '',
    date: currentRecord?.date || format(new Date(), 'yyyy-MM-dd'),
    amount: currentRecord?.amount || 0
  };

  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
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
        item: currentRecord.item || '',
        type: (currentRecord.type as 'fundraiser' | 'donation' | 'other') || 'other' as const,
        description: currentRecord.description || '',
        date: currentRecord.date || format(new Date(), 'yyyy-MM-dd'),
        amount: currentRecord.amount || 0
      };
      form.reset(newDefaults);
      resetChanges();
    }
  }, [currentRecord, form, resetChanges]);

  // Permission checks
  useEffect(() => {
    if (currentMode === 'create' && !canCreate) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create budget items.",
        variant: "destructive"
      });
      navigate('/app/budget');
      return;
    }
    
    if (currentMode === 'view' && !canView) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to view budget items.",
        variant: "destructive"
      });
      navigate('/app/budget');
      return;
    }
    
    if (currentMode === 'edit' && !canEdit) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit budget items.",
        variant: "destructive"
      });
      setCurrentMode('view');
      return;
    }

    // If record not found but we need one
    if ((currentMode === 'view' || currentMode === 'edit') && recordId && !currentRecord && !isLoading) {
      toast({
        title: "Income Record Not Found",
        description: "The requested income record could not be found.",
        variant: "destructive"
      });
      navigate('/app/budget');
      return;
    }
  }, [currentMode, canCreate, canEdit, canView, currentRecord, recordId, navigate, toast, isLoading]);

  // Handle navigation
  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/app/budget');
    }
  };

  const handleEdit = () => {
    if (recordId) {
      setCurrentMode('edit');
      navigate(`/app/budget/income_record?mode=edit&id=${recordId}`);
    }
  };

  const handleView = () => {
    if (recordId) {
      setCurrentMode('view');
      navigate(`/app/budget/income_record?id=${recordId}`);
    }
  };

  // Handle form submission
  const handleSubmit = async (data: IncomeFormData) => {
    if (isSubmitting || isCreating || isUploadingFiles) return;
    
    try {
      setIsSubmitting(true);
      
      const budgetData = {
        item: data.item,
        category: 'income' as const,
        type: data.type,
        description: data.description,
        date: data.date, // Already in YYYY-MM-DD format
        amount: data.amount,
        archive: false
      };

      if (currentMode === 'create') {
        // Create the record and get the new ID
        const newRecord = await createTransaction(budgetData);
        
        // Upload pending files with the new record ID
        if (pendingFiles.length > 0) {
          await uploadPendingFiles(newRecord.id);
        }
        
        toast({
          title: "Income Added",
          description: "Income record has been created successfully."
        });
        
        // Navigate back to budget overview
        navigate('/app/budget');
      } else if (currentMode === 'edit' && recordId) {
        updateTransaction(recordId, budgetData);
        toast({
          title: "Income Updated",
          description: "Income record has been updated successfully."
        });
        
        // Navigate back to budget overview
        navigate('/app/budget');
      }
      
      resetChanges();
    } catch (error) {
      console.error(`Error ${currentMode === 'create' ? 'creating' : 'updating'} income:`, error);
      toast({
        title: "Error",
        description: `Failed to ${currentMode === 'create' ? 'create' : 'update'} income record. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const uploadPendingFiles = async (recordId: string) => {
    if (pendingFiles.length === 0) return;
    
    setIsUploadingFiles(true);
    try {
      // Upload files one by one and wait for completion
      for (const file of pendingFiles) {
        await uploadFile({
          record_type: 'budget_transaction',
          record_id: recordId,
          file
        });
      }
      setPendingFiles([]);
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Handle unsaved changes dialog
  const handleDiscardChanges = () => {
    form.reset();
    resetChanges();
    setShowUnsavedDialog(false);
    navigate('/app/budget');
  };

  const handleContinueEditing = () => {
    setShowUnsavedDialog(false);
  };

  // Get page title
  const getPageTitle = () => {
    switch (currentMode) {
      case 'create':
        return 'Add Income';
      case 'edit':
        return `Edit Income: ${currentRecord?.item || 'N/A'}`;
      case 'view':
        return `Income: ${currentRecord?.item || 'N/A'}`;
      default:
        return 'Income Record';
    }
  };

  const isFormMode = currentMode === 'create' || currentMode === 'edit';

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Back Button - Above header on mobile */}
        <Button variant="ghost" size="sm" onClick={handleBack} className="sm:hidden">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Budget
        </Button>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="hidden sm:flex">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Budget
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
                <p className="text-muted-foreground">
                  Budget → {getPageTitle()}
                </p>
              </div>
            </div>
            
            {currentMode === 'view' && canEdit && (
              <Button onClick={handleEdit} className="hidden sm:flex">
                Edit Income
              </Button>
            )}
          </div>

          {/* Action Buttons - Mobile: Below header in 2-column grid */}
          {isFormMode && (
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="w-full"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={() => form.handleSubmit(handleSubmit)()} 
                disabled={isSubmitting || isUploadingFiles}
                className="w-full"
              >
                {(isSubmitting || isCreating || isUploadingFiles) ? 'Saving...' : 
                 currentMode === 'create' ? 'Add' : 'Update'}
              </Button>
            </div>
          )}

          {currentMode === 'view' && canEdit && (
            <Button onClick={handleEdit} className="sm:hidden w-full">
              Edit Income
            </Button>
          )}
        </div>

        {/* Form/View Content */}
        <div className="max-w-4xl mx-auto">
          <Card>
          <CardHeader>
            <CardTitle>
              {currentMode === 'create' ? 'Add New Income' : 'Income Details'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isFormMode ? (
              <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()} onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="item"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right text-left shrink-0">Item *</FormLabel>
                          <div className="flex-1">
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
                      name="type"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right text-left shrink-0">Type *</FormLabel>
                          <div className="flex-1">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select income type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fundraiser">Fundraiser</SelectItem>
                                <SelectItem value="donation">Donation</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right text-left shrink-0">Date *</FormLabel>
                          <div className="flex-1">
                            <FormControl>
                              <Input
                                type="date"
                                max={format(new Date(), 'yyyy-MM-dd')}
                                min="1900-01-01"
                                value={field.value}
                                onChange={field.onChange}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-4">
                          <FormLabel className="sm:w-32 sm:text-right text-left shrink-0">Amount *</FormLabel>
                          <div className="flex-1">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="flex flex-col space-y-2 sm:flex-row sm:gap-4">
                        <FormLabel className="sm:w-32 sm:text-right text-left shrink-0 sm:mt-2">Description</FormLabel>
                        <div className="flex-1">
                          <FormControl>
                            <Textarea
                              placeholder="Optional description"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </div>
                      </FormItem>
                   )}
                   />

                  {/* Attachments Section */}
                  <div className="lg:col-span-2">
                    <div className="flex flex-col space-y-2 sm:flex-row sm:gap-4">
                      <label className="sm:w-32 sm:text-right text-left text-sm font-medium sm:mt-2 shrink-0">Attachments</label>
                      <div className="flex-1">
                        {currentMode === 'create' ? (
                          <>
                            <input
                              type="file"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setPendingFiles(prev => [...prev, ...files]);
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                            />
                            {pendingFiles.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-muted-foreground">Files to upload after income creation:</p>
                                {pendingFiles.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                                    <span>{file.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== index))}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                {isUploadingFiles && (
                                  <div className="text-sm text-blue-600 font-medium">
                                    Uploading files...
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : recordId ? (
                          <AttachmentSection
                            recordType="budget_transaction"
                            recordId={recordId}
                            canEdit={canEdit && currentMode === 'edit'}
                            showContentOnly
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Desktop only */}
                  <div className="hidden sm:flex justify-end gap-2 pt-6 lg:col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                    >
                      Cancel
                    </Button>
                    <Button type="button" onClick={() => form.handleSubmit(handleSubmit)()} disabled={isSubmitting || isUploadingFiles}>
                     {(isSubmitting || isCreating || isUploadingFiles) ? 'Saving...' : 
                      currentMode === 'create' ? 'Add Income' : 'Update Income'}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              // View mode
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Item</h3>
                    <p className="text-sm">{currentRecord?.item || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Type</h3>
                    <p className="text-sm capitalize">{currentRecord?.type || 'N/A'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Date</h3>
                    <p className="text-sm">
                      {currentRecord?.date || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Amount</h3>
                    <p className="text-sm font-medium text-green-600">
                      ${currentRecord?.amount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
                
                {currentRecord?.description && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Description</h3>
                    <p className="text-sm">{currentRecord.description}</p>
                  </div>
                )}
                
                {/* Attachments Section for View Mode */}
                {recordId && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">Attachments</h3>
                    <AttachmentSection
                      recordType="budget_transaction"
                      recordId={recordId}
                      canEdit={false}
                      showContentOnly
                    />
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