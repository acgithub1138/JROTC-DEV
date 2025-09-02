import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { useJudges, Judge } from '@/hooks/competition-portal/useJudges';
import { useCPJudgesPermissions } from '@/hooks/useModuleSpecificPermissions';
import { toast } from '@/hooks/use-toast';

interface JudgeFormData {
  name: string;
  phone: string;
  email: string;
  available: boolean;
}

export const JudgeRecordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const judgeId = searchParams.get('id');
  const mode = searchParams.get('mode') as 'create' | 'edit' | 'view' || 'create';
  
  const { canCreate, canEdit, canDelete, canView } = useCPJudgesPermissions();
  const { judges, createJudge, updateJudge, deleteJudge, isCreating, isUpdating, isDeleting } = useJudges();
  
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [existingJudge, setExistingJudge] = useState<Judge | null>(null);
  
  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const isCreateMode = mode === 'create';

  // Phone number formatting function
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<JudgeFormData>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      available: true
    }
  });

  const [initialFormData, setInitialFormData] = useState<JudgeFormData>({
    name: '',
    phone: '',
    email: '',
    available: true
  });

  const currentFormData = watch();

  const { hasUnsavedChanges } = useUnsavedChanges({
    initialData: initialFormData,
    currentData: currentFormData
  });

  // Load existing judge data
  useEffect(() => {
    if (judgeId && judges.length > 0) {
      const judge = judges.find(j => j.id === judgeId);
      if (judge) {
        setExistingJudge(judge);
      }
    }
  }, [judgeId, judges]);

  // Reinitialize form data when judge data becomes available
  useEffect(() => {
    if (existingJudge && (isEditMode || isViewMode)) {
      const formData: JudgeFormData = {
        name: existingJudge.name || '',
        phone: existingJudge.phone || '',
        email: existingJudge.email || '',
        available: existingJudge.available ?? true
      };
      reset(formData);
      setInitialFormData(formData);
    } else if (isCreateMode) {
      const formData: JudgeFormData = {
        name: '',
        phone: '',
        email: '',
        available: true
      };
      reset(formData);
      setInitialFormData(formData);
    }
  }, [existingJudge, isEditMode, isViewMode, isCreateMode, reset]);

  // Show loading state while waiting for data
  if ((isEditMode || isViewMode) && judgeId && !existingJudge) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted/50 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-muted/50 rounded w-1/3"></div>
            <div className="h-10 bg-muted/50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
    } else {
      navigate('/app/competition-portal/judges');
    }
  };

  const handleFormSubmit = async (data: JudgeFormData) => {
    try {
      if (isCreateMode) {
        await createJudge(data);
        toast({
          title: "Judge created",
          description: "Judge has been created successfully.",
        });
      } else if (isEditMode && existingJudge) {
        await updateJudge({ id: existingJudge.id, ...data });
        toast({
          title: "Judge updated",
          description: "Judge has been updated successfully.",
        });
      }
      navigate('/app/competition-portal/judges');
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleDelete = async () => {
    if (!existingJudge) return;
    
    if (window.confirm('Are you sure you want to delete this judge? This action cannot be undone.')) {
      try {
        await deleteJudge(existingJudge.id);
        toast({
          title: "Judge deleted",
          description: "Judge has been deleted successfully.",
        });
        navigate('/app/competition-portal/judges');
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    navigate('/app/competition-portal/judges');
  };

  const handleCancelDiscard = () => {
    setShowUnsavedDialog(false);
  };

  const pageTitle = isCreateMode ? 'Create Judge' : isViewMode ? 'View Judge' : 'Edit Judge';
  const canEditForm = (isCreateMode && canCreate) || (isEditMode && canEdit);
  const showDeleteButton = !isCreateMode && canDelete && existingJudge;

  // Permission check
  if (isViewMode && !canView) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You don't have permission to view judges.</p>
          <Button onClick={() => navigate('/app/competition-portal/judges')} className="mt-4">
            Back to Judges
          </Button>
        </div>
      </div>
    );
  }

  if ((isCreateMode && !canCreate) || (isEditMode && !canEdit)) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            You don't have permission to {isCreateMode ? 'create' : 'edit'} judges.
          </p>
          <Button onClick={() => navigate('/app/competition-portal/judges')} className="mt-4">
            Back to Judges
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to Judges
          </Button>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          {canEditForm && (
            <>
              <Button type="button" variant="outline" onClick={handleBack}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="judge-form"
                disabled={isCreating || isUpdating}
              >
                <Save className="h-4 w-4" />
                {isCreating || isUpdating ? 'Saving...' : (isCreateMode ? 'Create Judge' : 'Save Changes')}
              </Button>
            </>
          )}
          {showDeleteButton && (
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Judge Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="judge-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Name Field */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
              <Label htmlFor="name" className="text-right">Name *</Label>
              <Input 
                id="name" 
                {...register('name', { required: 'Name is required' })}
                placeholder="Enter judge name"
                disabled={isViewMode}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <div className="md:col-start-2 text-sm text-destructive">
                  {errors.name.message}
                </div>
              )}
            </div>

            {/* Phone Field */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input 
                id="phone" 
                {...register('phone')}
                placeholder="(123) 456-7890"
                disabled={isViewMode}
                onChange={(e) => {
                  if (!isViewMode) {
                    const formatted = formatPhoneNumber(e.target.value);
                    setValue('phone', formatted);
                  }
                }}
              />
            </div>

            {/* Email Field */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input 
                id="email" 
                type="email" 
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Please enter a valid email address"
                  }
                })}
                placeholder="Enter email address"
                disabled={isViewMode}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <div className="md:col-start-2 text-sm text-destructive">
                  {errors.email.message}
                </div>
              )}
            </div>

            {/* Available Field */}
            <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
              <Label htmlFor="available" className="text-right">Available</Label>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="available" 
                  checked={watch('available')} 
                  onCheckedChange={(checked) => !isViewMode && setValue('available', checked)}
                  disabled={isViewMode}
                />
                <Label htmlFor="available" className="text-sm text-muted-foreground">
                  Available for judging
                </Label>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onCancel={handleCancelDiscard}
      />
    </div>
  );
};