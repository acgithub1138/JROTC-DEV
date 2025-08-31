import React, { useState } from 'react';
import { CadetFormData } from './schemas/cadetFormSchema';
import { useCadetForm } from './hooks/useCadetForm';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { CadetBasicInfoFields } from './fields/CadetBasicInfoFields';
import { CadetRoleGradeFields } from './fields/CadetRoleGradeFields';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { Profile } from '../types';

interface CadetFormContentProps {
  mode: 'create' | 'edit';
  cadet?: Profile;
  onSuccess: (cadet: Profile) => void;
  onCancel: () => void;
}

export const CadetFormContent: React.FC<CadetFormContentProps> = ({
  mode,
  cadet,
  onSuccess,
  onCancel
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

  return (
    <div className="bg-background p-6 rounded-lg border">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-6 p-6 border rounded-lg bg-card">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <CadetBasicInfoFields 
              form={form}
              mode={mode}
            />
          </div>

          {/* Role and Academic Information Section */}
          <div className="space-y-6 p-6 border rounded-lg bg-card">
            <h3 className="text-lg font-semibold">Role & Academic Information</h3>
            <CadetRoleGradeFields 
              form={form}
              mode={mode}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Add Cadet' : 'Update Cadet')}
            </Button>
          </div>
        </form>
      </Form>

      <UnsavedChangesDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onDiscard={confirmCancel}
        onCancel={cancelConfirm}
      />
    </div>
  );
};