import React, { useState } from 'react';
import { CadetFormData } from './schemas/cadetFormSchema';
import { useCadetForm } from './hooks/useCadetForm';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { CadetBasicInfoFields } from './fields/CadetBasicInfoFields';
import { CadetRoleGradeFields } from './fields/CadetRoleGradeFields';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { Profile } from '../types';
import { useEmailValidation } from '@/hooks/useEmailValidation';
interface CadetFormContentProps {
  mode: 'create' | 'edit';
  cadet?: Profile;
  onSuccess: (cadet: Profile) => void;
  onCancel: () => void;
  hideActionButtons?: boolean;
}
export const CadetFormContent: React.FC<CadetFormContentProps> = ({
  mode,
  cadet,
  onSuccess,
  onCancel,
  hideActionButtons = false
}) => {
  const {
    form,
    onSubmit,
    onError,
    isSubmitting,
    isLoading
  } = useCadetForm({
    mode,
    cadet,
    onSuccess
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Watch email field value for validation
  const emailValue = form.watch('email');

  // Email validation hook - only check in create mode
  const {
    isChecking: isCheckingEmail,
    exists: emailExists,
    error: emailError
  } = useEmailValidation(emailValue, mode === 'create' && emailValue && emailValue.length > 0);

  // Determine if the form should be disabled
  const isFormDisabled = isSubmitting || mode === 'create' && emailExists === true;

  // Watch form changes to detect unsaved modifications
  React.useEffect(() => {
    const subscription = form.watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [form]);
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowConfirmDialog(true);
    } else {
      onCancel();
    }
  };
  const confirmCancel = () => {
    setShowConfirmDialog(false);
    onCancel();
  };
  const cancelConfirm = () => {
    setShowConfirmDialog(false);
  };
  if (isLoading) {
    return <div className="text-center py-4">Loading form...</div>;
  }
  return <div className="bg-background p-6 rounded-lg border">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6" id="cadet-form">
          {/* Basic Information Section */}
          <div className="space-y-6 p-6 border rounded-lg bg-card px-[24px] py-[8px]">
            
            <CadetBasicInfoFields form={form} mode={mode} />
          </div>

          {/* Role and Academic Information Section */}
          <div className="space-y-6 p-6 border rounded-lg bg-card py-[8px]">
            
            <CadetRoleGradeFields form={form} mode={mode} />
          </div>

          {/* Submit Buttons */}
          {!hideActionButtons && (
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isFormDisabled}>
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add Cadet' : 'Update Cadet'}
              </Button>
            </div>
          )}
        </form>
      </Form>

      <UnsavedChangesDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog} onDiscard={confirmCancel} onCancel={cancelConfirm} />
    </div>;
};